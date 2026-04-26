# 架构文档

## 项目概述

- **项目名称**：好食家
- **项目类型**：减脂记录与复盘 Web App
- **技术栈**：Next.js 16 + React 19 + TypeScript + Tailwind CSS v4 + shadcn/ui + Firebase
- **部署平台**：Vercel（当前已部署过生产环境）

## 当前目录结构

```
haoshijia/
├── src/
│   ├── app/                         # Next.js App Router
│   │   ├── globals.css              # 全局样式与 Tailwind v4 CSS 变量
│   │   ├── layout.tsx               # 根布局
│   │   ├── page.tsx                 # 首页
│   │   ├── login/page.tsx           # 登录页
│   │   ├── register/page.tsx        # 注册页
│   │   └── dashboard/
│   │       ├── layout.tsx           # 只读浏览布局、侧边栏、移动端菜单
│   │       ├── page.tsx             # 仪表盘
│   │       ├── goal/page.tsx        # 目标设定
│   │       ├── weight/page.tsx      # 体重记录
│   │       ├── measurements/page.tsx # 围度记录
│   │       ├── food/page.tsx        # 饮食记录、日/周复盘、周计划
│   │       ├── exercise/page.tsx    # 运动记录
│   │       ├── review/page.tsx      # 独立复盘页面
│   │       ├── inventory/page.tsx   # 食材库存
│   │       ├── recipe/page.tsx      # 菜谱生成
│   │       └── profile/page.tsx     # 个人资料
│   ├── components/
│   │   ├── AuthRequiredDialog.tsx   # 未登录写入动作登录提醒弹窗
│   │   ├── Providers.tsx            # 全局 Provider 组合
│   │   ├── RecordPrincipleNotice.tsx # 真实记录原则统一提示
│   │   └── ui/                      # shadcn/ui 基础组件
│   ├── contexts/
│   │   └── AuthContext.tsx          # Firebase Auth 全局状态
│   └── lib/
│       ├── auth.ts                  # Firebase Auth 工具函数
│       ├── firebase.ts              # Firebase 初始化
│       ├── firestore.ts             # Firestore 数据访问函数
│       ├── profile.ts               # 用户展示名和头像首字母工具
│       ├── review.ts                # 日复盘、周复盘分析逻辑
│       └── utils.ts                 # cn() 等通用工具
├── memory-bank/                     # 产品、架构、进度和修改计划
├── components.json                  # shadcn/ui 配置
├── package.json
├── postcss.config.mjs
├── next.config.ts
└── tsconfig.json
```

## 页面与功能状态

| 页面 | 路径 | 当前状态 |
|---|---|---|
| 首页 | `/` | 已实现公开入口，未登录可进入仪表盘浏览 |
| 登录 | `/login` | 已实现 Firebase 邮箱密码登录 |
| 注册 | `/register` | 已实现 Firebase 邮箱密码注册 |
| 仪表盘 | `/dashboard` | 已实现，支持未登录只读浏览，今日体重已从体重记录子集合同步 |
| 体重记录与目标 | `/dashboard/weight` | 已实现体重记录、今日记录、趋势图、顶部目标摘要和折叠目标设置 |
| 目标设定兼容跳转 | `/dashboard/goal` | 兼容旧入口，自动跳转到 `/dashboard/weight#goal-settings` |
| 围度记录 | `/dashboard/measurements` | 已实现记录、趋势图、最近有效摘要、移动端紧凑摘要和今日记录删除 |
| 饮食记录 | `/dashboard/food` | 已实现饮食记录、日复盘、周复盘、周计划 |
| 运动记录 | `/dashboard/exercise` | 已实现运动记录、自定义运动量单位和旧分钟数据兼容 |
| 食材与菜谱 | `/dashboard/inventory` | 已实现食材 CRUD、一周菜谱生成和条件设置 |
| 菜谱生成兼容跳转 | `/dashboard/recipe` | 兼容旧入口，自动跳转到 `/dashboard/inventory?tab=recipe` |
| 复盘页 | `/dashboard/review` | 已实现独立日复盘和周复盘 |
| 个人资料 | `/dashboard/profile` | 已实现昵称、身高、性别、出生年份和活动水平保存 |

## 前端架构

- 使用 Next.js App Router，页面主要为 Client Component。
- 登录状态由 `AuthProvider` 提供，dashboard 页面支持未登录只读浏览，不再由 `dashboard/layout.tsx` 强制跳转登录页。
- 未登录用户可访问 `/dashboard` 和各 dashboard 子页面；涉及保存、记录、删除、生成计划和编辑设置等写入动作时，由页面级逻辑拦截并弹出登录/注册提醒。
- 登录/注册成功后直接进入仪表盘；布局使用 `AuthContext` 用户，并在客户端挂载后兜底读取 `auth.currentUser` 展示已登录账号，避免认证状态同步期间误显示游客态，同时避免服务端和客户端首次渲染不一致。
- 侧边栏导航已将目标设定合并到体重记录入口，体重记录页同时承担体重记录、趋势查看和目标设置；目标摘要位于页面顶部，目标设置表单默认折叠，通过“设置目标”按钮展开。
- 侧边栏导航已将食材库存和菜谱生成合并为“食材与菜谱”入口，页面内使用 Tab 组织食材库存、一周菜谱和条件设置。
- 侧边栏已新增“个人资料”入口，个人资料页用于保存昵称和基础身体资料；未登录用户可只读浏览，写入时仍使用 `AuthRequiredDialog` 拦截。
- 顶部栏和仪表盘欢迎语优先使用用户昵称，未设置时回退邮箱；右上角昵称和头像区域可点击跳转到 `/dashboard/profile`。
- 首页、仪表盘和体重、围度、饮食、运动记录页共用 `RecordPrincipleNotice`，提示记录用于复盘、请尽量真实填写、历史记录暂不支持修改；今日误录仍按各页面已有能力删除或重新记录，不扩展任意历史编辑能力。
- UI 使用 Tailwind CSS v4 + shadcn/ui 基础组件。
- 全局视觉风格已升级为冰蓝玻璃感：
  - `src/app/globals.css` 定义冷白、浅蓝灰、蓝青色主基调，以及 `app-aurora-bg` 背景。
  - dashboard shell、侧边栏、顶部栏和移动端菜单按钮使用半透明背景、细边框、柔和阴影和 `backdrop-blur`。
  - Card、Button、Input、Select、Tabs、Dialog、Sheet、Dropdown、Toast、Checkbox 等基础 UI 组件统一采用冰蓝玻璃质感。
  - 打印样式仍集中在 `globals.css` 的 `@media print` 中，保持白底、隐藏后台导航，并只放行菜谱打印区域。
- 图表使用 Recharts。
- 图标使用 lucide-react，部分导航图标当前仍为内联 SVG path。
- 日复盘和周复盘分析逻辑集中在 `src/lib/review.ts`，饮食记录页与独立复盘页共用同一套计算规则。

## Firebase 集成

### `src/lib/firebase.ts`

初始化 Firebase Client SDK，并导出：

- `app`
- `auth`
- `db`

当前项目未使用 Next.js API Routes 或 Firebase Admin SDK；数据访问主要由浏览器端 Firebase SDK 完成。

### `src/lib/auth.ts`

Firebase Auth 工具函数：

- `firebaseSignUp`
- `firebaseSignIn`
- `firebaseSignOut`
- `firebaseOnAuthStateChanged`

### `src/contexts/AuthContext.tsx`

提供全局认证状态：

- `user`：当前 Firebase 用户
- `loading`：认证状态加载中
- `useAuth()`：消费认证状态的 hook

## Firestore 数据访问

### 用户资料

路径：

```
users/{userId}
```

当前字段：

- `email`
- `createdAt`
- `nickname`
- `heightCm`
- `gender`
- `birthYear`
- `activityLevel`
- `currentWeight`
- `targetWeight`
- `targetDate`
- `recipeSettings`

相关函数：

- `createUserProfile`
- `getUserProfile`
- `updateUserProfile`

### 每日记录

当前每日记录使用子集合结构：

```
records/{userId}/daily/{date}/weight/{recordId}
records/{userId}/daily/{date}/measurement/{recordId}
records/{userId}/daily/{date}/food/{recordId}
records/{userId}/daily/{date}/exercise/{recordId}
```

相关函数：

- `addDailyRecord`
- `getDailyRecords`
- `deleteDailyRecord`
- `getLatestDisplayWeight`
- `getWeightHistory`
- `getLatestMeasurementSummary`
- `getMeasurementHistory`
- `getFoodHistory`
- `addExerciseRecord`
- `getExerciseHistory`
- `getWeeklyData`

仪表盘体重显示规则：

- 今日体重读取 `records/{userId}/daily/{date}/weight` 子集合。
- 同一天多条体重记录时，优先显示晨起体重；没有晨起体重时显示当天最新记录。
- 今天没有体重记录时，回看最近 90 天的体重记录，使用最近一次记录作为参考，并在界面标注“最近记录”日期。
- 用户资料中的 `currentWeight` 字段保留为兼容字段，界面文案按“初始体重”展示。
- 体重记录页与仪表盘使用同一套展示口径：今日/最新体重、初始体重、目标体重和剩余差距。
- 体重目标设置写入 `users/{userId}` 的 `currentWeight`、`targetWeight`、`targetDate` 字段，不迁移既有用户资料结构。
- 体重页 7 天趋势固定生成今天和过去 6 天的日期刻度；缺失日期使用空值，不显示为 0，也不跨缺失日期连线。30 天趋势保留按已有记录展示。

围度摘要显示规则：

- 围度页顶部摘要不只读取今日记录，而是通过 `getLatestMeasurementSummary` 分别回看腰围、臀围、大腿围、上臂围最近 90 天内的有效值。
- 每个围度字段独立计算最近有效记录日期；今天没有记录但历史有值时，摘要显示历史最近值并标注“最近记录：YYYY-MM-DD”。
- 单项没有有效记录时显示“未记录”，不使用 `0 cm` 表达空值。
- 围度变化计算只比较有效记录，避免空字段或旧记录中的 0 值参与变化。

运动记录字段：

- `exerciseType`：运动类型。
- `amount`：运动量数值。
- `unit`：运动量单位，当前支持 `minutes`、`steps`、`kilometers`、`reps`、`sets`、`laps`、`custom`。
- `customUnit`：自定义单位文本，仅 `unit` 为 `custom` 时写入。
- `duration`：旧字段兼容；旧记录没有 `amount`、`unit` 时按 `duration + minutes` 读取，新记录选择分钟时继续写入该字段。
- `calories`：可选热量消耗，未填写时为 0。
- `intensity`：运动强度，取值为 `light`、`medium`、`high`。

### 周计划

路径：

```
plans/{userId}/weekly/{planId}
```

相关函数：

- `savePlan`
- `getPlans`
- `updatePlan`
- `deletePlan`

### 食材库存

路径：

```
ingredients/{userId}/items/{ingredientId}
```

相关函数：

- `addIngredient`
- `getIngredients`
- `updateIngredient`
- `deleteIngredient`

菜谱生成流程：

- 菜谱生成与食材库存位于同一页面 `/dashboard/inventory`。
- 页面 Tab 包括：食材库存、一周菜谱、条件设置。
- 添加、编辑、删除食材后会刷新同页 `ingredients` 状态，生成一周菜谱时直接读取最新库存。
- 生成菜谱时只使用用户库存中的食材，不再使用系统内置食材作为菜单兜底。
- 当前基础搭配规则：
  - 早餐：主食 + 蛋白/蛋奶，可选水果。
  - 午餐：2 份蔬菜 + 1 份蛋白质 + 1 份主食。
  - 晚餐：蔬菜 + 蛋白质，主食可选。
- 蛋白质来源由 `肉类` 和 `蛋奶` 分类共同满足；`调味品` 和 `其他` 暂不参与核心三餐搭配。
- 库存约束：
  - 缺少主食、蛋白质来源或至少 2 种蔬菜时，不生成完整一周菜单。
  - 页面显示“当前库存不足以生成完整一周菜谱”，并按类别给出补货建议。
  - 水果缺失只作为可选补充建议，不阻断菜单生成。
- 生成后的一周菜单使用同一份 `weeklyPlan` 状态驱动三种视图：
  - 表格视图：桌面端按日期、早餐、午餐、晚餐展示，移动端使用紧凑日期卡片。
  - 九宫格视图：将 7 天 × 3 餐拆成紧凑餐次块。
  - 日历视图：横向一周日历布局，保留每餐主菜、配菜、做法和提示。
- 菜谱导出复用浏览器打印能力：菜单区提供“导出 / 保存 PDF”入口，打印内容跟随当前菜单视图，且仅包含当前一周菜单。
- 打印样式集中定义在 `src/app/globals.css`：
  - 通过 `dashboard-*` 类隐藏后台导航、顶部栏和移动端菜单按钮。
  - 通过 `no-print` 和 `print-only` 控制页面内按钮、表单和打印头信息显示。
  - 使用 `inventory-*`、`recipe-*` 结构类对白名单放行打印范围，只保留菜单打印容器。
  - 使用 `recipe-print-*` 类压缩表格、九宫格、日历三种视图，适配 A4 横向一页纸输出。
- 条件设置保存在 `users/{userId}.recipeSettings`，包括居住场景、设备、每餐可投入时间、易饿时段和偏好做法。
- 旧 `/dashboard/recipe` 路由保留为兼容跳转页，自动跳转到 `/dashboard/inventory?tab=recipe`。

## 已知架构问题

- `getUserProfile` 的返回值需要与 `recipeSettings` 使用场景保持一致。
