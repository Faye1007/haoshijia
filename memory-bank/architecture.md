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
│   │       ├── layout.tsx           # 登录保护、侧边栏、移动端菜单
│   │       ├── page.tsx             # 仪表盘
│   │       ├── goal/page.tsx        # 目标设定
│   │       ├── weight/page.tsx      # 体重记录
│   │       ├── measurements/page.tsx # 围度记录
│   │       ├── food/page.tsx        # 饮食记录、日/周复盘、周计划
│   │       ├── exercise/page.tsx    # 运动记录
│   │       ├── review/page.tsx      # 独立复盘页面
│   │       ├── inventory/page.tsx   # 食材库存
│   │       └── recipe/page.tsx      # 菜谱生成
│   ├── components/
│   │   ├── Providers.tsx            # 全局 Provider 组合
│   │   └── ui/                      # shadcn/ui 基础组件
│   ├── contexts/
│   │   └── AuthContext.tsx          # Firebase Auth 全局状态
│   └── lib/
│       ├── auth.ts                  # Firebase Auth 工具函数
│       ├── firebase.ts              # Firebase 初始化
│       ├── firestore.ts             # Firestore 数据访问函数
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
| 首页 | `/` | 已实现基础入口 |
| 登录 | `/login` | 已实现 Firebase 邮箱密码登录 |
| 注册 | `/register` | 已实现 Firebase 邮箱密码注册 |
| 仪表盘 | `/dashboard` | 已实现，今日体重已从体重记录子集合同步 |
| 目标设定 | `/dashboard/goal` | 已实现 |
| 体重记录 | `/dashboard/weight` | 已实现体重记录、今日记录、趋势图 |
| 围度记录 | `/dashboard/measurements` | 已实现记录、趋势图、移动端紧凑摘要和今日记录删除 |
| 饮食记录 | `/dashboard/food` | 已实现饮食记录、日复盘、周复盘、周计划 |
| 运动记录 | `/dashboard/exercise` | 已实现基础运动记录，单位自定义待补充 |
| 食材库存 | `/dashboard/inventory` | 已实现食材 CRUD |
| 菜谱生成 | `/dashboard/recipe` | 已实现基础规则生成和条件设置 |
| 复盘页 | `/dashboard/review` | 已实现独立日复盘和周复盘 |

## 前端架构

- 使用 Next.js App Router，页面主要为 Client Component。
- 登录状态由 `AuthProvider` 提供，`dashboard/layout.tsx` 根据 Firebase Auth 状态保护后台页面。
- UI 使用 Tailwind CSS v4 + shadcn/ui 基础组件。
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

## 已知架构问题

- `getUserProfile` 的返回值需要与 `recipeSettings` 使用场景保持一致。
- 目标设定和体重记录、食材库存和菜谱生成后续计划合并，详见 `memory-bank/modification-plan.md`。
