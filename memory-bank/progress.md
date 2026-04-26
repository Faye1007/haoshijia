# 进度记录

## Step 39: 身体基础资料与 BMI ✅ (完成日期: 2026-04-26)

### 完成内容
- 个人资料页文案更新为当前身体基础资料会用于 BMI 计算和后续轻量营养目标。
- 继续复用已存在的用户资料字段：身高、性别、出生年份、活动水平，不新增 Firestore 字段。
- 仪表盘新增“身体概览”模块，展示 BMI、身高、年龄、性别和活动水平。
- BMI 基于身高和最近体重计算；没有最近体重时回退使用初始体重。
- BMI 展示为记录参考，并按偏低、正常、偏高、较高做轻量状态标注。
- 缺少身高或体重时，仪表盘显示明确引导，提示补充个人资料和体重数据。

### 验证结果
- `npx tsc --noEmit` 通过 ✅
- `npm run lint` 通过，无 warning ✅
- `npm run build` 通过 ✅
- 本地已有 `npm run dev -- --port 3001` 服务，访问 `/dashboard` 和 `/dashboard/profile` 均返回 `200 OK` ✅

### Git 提交
- 本次提交包含 Step 39 仪表盘身体概览、BMI 计算和对应文档更新。

### 后续步骤
- Step 40: 轻量营养目标与菜谱份量建议

---

## Step 38: 菜谱生成按顿数消耗库存 ✅ (完成日期: 2026-04-26)

### 完成内容
- 菜谱生成改为基于食材可用顿数消耗库存，已填写 `servings` 的食材每安排一次扣减 1 顿。
- 同一食材不会被安排超过它填写的可用顿数，例如可用 4 顿最多安排 4 次。
- 主食、蛋白质和蔬菜在生成前按一周完整菜单所需顿数检查库存容量。
- 顿数不足时显示“当前库存不足以生成完整一周菜谱”，并按主食、蛋白质、蔬菜给出补货方向。
- 水果仍为可选项，缺失或顿数较少只作为补充建议，不阻断菜谱生成。
- 晚餐主食保持可选逻辑：只有主食还有剩余顿数时才安排。
- 旧食材没有 `servings` 时继续兼容参与生成，不强制判为不足。

### 验证结果
- `npx tsc --noEmit` 通过 ✅
- `npm run lint` 通过，无 warning ✅
- `npm run build` 通过 ✅
- 本地已有 `npm run dev -- --port 3001` 服务，访问 `/dashboard/inventory?tab=recipe` 返回 `200 OK` ✅

### Git 提交
- 本次提交包含 Step 38 菜谱生成按顿数消耗库存、库存不足提示和对应文档更新。

### 后续步骤
- Step 39: 身体基础资料与 BMI（已完成）

---

## Step 37: 食材库存支持可用顿数 ✅ (完成日期: 2026-04-26)

### 完成内容
- 食材库存 `ingredients/{userId}/items/{ingredientId}` 新增可选字段 `servings`，用于记录“这份食材计划吃几顿”。
- 添加食材表单新增“可用顿数”输入，用户可以继续填写数量/单位和剩余天数，也可以补充可用顿数。
- 编辑食材弹窗支持查看、修改和清空可用顿数。
- 食材列表展示剩余数量和可用顿数；旧食材没有 `servings` 时显示“可用顿数未填”。
- 一周菜谱页的“当前食材库存”卡片同步展示可用顿数。
- 本次只增加库存字段和展示，不修改菜谱生成消耗逻辑；按顿数消耗留到 Step 38。

### 验证结果
- `npx tsc --noEmit` 通过 ✅
- `npm run lint` 通过，无 warning ✅
- `npm run build` 通过 ✅
- 本地已有 `npm run dev -- --port 3001` 服务，访问 `/dashboard/inventory` 返回 `200 OK` ✅

### Git 提交
- 本次提交包含 Step 37 食材库存可用顿数、旧数据兼容和对应文档更新。

### 后续步骤
- Step 38: 菜谱生成按顿数消耗库存（已完成）

---

## Step 36: 仪表盘增加围度概览 ✅ (完成日期: 2026-04-26)

### 完成内容
- 仪表盘 `/dashboard` 新增“围度概览”模块，读取最近 90 天内的有效围度记录。
- 围度概览显示腰围、臀围、大腿围、上臂围最近有效值和对应记录日期。
- 腰围使用更突出的重点卡片展示，便于把腰围作为减脂观察核心指标。
- 其他围度使用紧凑网格展示，缺失单项时显示“未记录”。
- 用户没有任何围度记录时，仪表盘显示明确空状态和记录引导。
- 复用已有 `getLatestMeasurementSummary` 查询逻辑，不新增 Firestore 字段。

### 验证结果
- `npx tsc --noEmit` 通过 ✅
- `npm run lint` 通过，无 warning ✅
- `npm run build` 通过 ✅
- 本地已有 `npm run dev -- --port 3001` 服务，访问 `/dashboard` 返回 `200 OK` ✅

### Git 提交
- 本次提交包含 Step 36 仪表盘围度概览与对应文档更新。

### 后续步骤
- Step 37: 食材库存支持可用顿数（已完成）

---

## Step 35: 饮食记录增加进食时间 ✅ (完成日期: 2026-04-26)

### 完成内容
- 饮食记录页 `/dashboard/food` 表单新增“进食时间”字段，默认填入当前时间。
- 保存饮食记录时同步写入 `mealTime`，保留原有餐次字段 `mealType`。
- 今日饮食记录列表优先显示 `mealTime`，让“几点吃”和“属于哪一餐”分开记录。
- 旧饮食记录没有 `mealTime` 时，列表回退显示 `createdAt` 创建时间，保证历史数据兼容。
- 扩展 `FoodRecord` 和 `FoodReviewRecord` 类型，周复盘数据读取继续兼容新旧饮食记录。
- 重构饮食页加载逻辑，消除该页面原有 hook dependency warning。

### 验证结果
- 用户验证测试通过 ✅
- `npx tsc --noEmit` 通过 ✅
- `npm run lint` 通过，无 warning ✅
- `npm run build` 通过 ✅
- 本地使用 `npm run dev -- --port 3001` 可正常访问 `/dashboard/food`，返回 `200 OK` ✅

### Git 提交
- 本次提交包含 Step 35 饮食记录进食时间、旧记录兼容和对应文档更新。

### 后续步骤
- Step 36: 仪表盘增加围度概览（已完成）

---

## Step 34: 围度最近有效记录展示 ✅ (完成日期: 2026-04-26)

### 完成内容
- 围度页 `/dashboard/measurements` 顶部 4 个摘要改为显示最近一次有效围度记录。
- 腰围、臀围、大腿围、上臂围各自独立回看最近 90 天，避免今天未记录时摘要显示为空。
- 摘要中标注最近记录日期，例如“最近记录：2026-04-25”。
- 单项没有有效记录时显示“未记录”，不再显示 `0 cm`。
- 新增 `getLatestMeasurementSummary` Firestore 读取方法，用于按字段查找最近有效围度值。
- 围度变化计算改为只比较有效记录，避免空字段或 0 值参与变化计算。
- 重构围度页加载逻辑，消除该页面原有 hook dependency warning。

### 验证结果
- 用户验证测试通过 ✅
- `npx tsc --noEmit` 通过 ✅
- `npm run lint` 无 error，仅剩 3 个既有饮食页 hook dependency warning ✅
- `npm run build` 通过 ✅
- 本地使用 `npm run dev -- --port 3001` 可正常访问 `/dashboard/measurements`，返回 `200 OK` ✅

### Git 提交
- 本次提交包含 Step 34 围度最近有效记录展示与对应文档更新。

### 后续步骤
- Step 35: 饮食记录增加进食时间（已完成）

---

## Step 33: 体重目标顶部折叠与 7 天趋势修正 ✅ (完成日期: 2026-04-26)

### 完成内容
- 体重页 `/dashboard/weight` 的“体重目标”区域移到顶部摘要卡片下方，和体重记录任务流更贴近。
- 目标设置表单默认折叠，通过“设置目标”按钮展开或收起。
- 保留目标摘要中的今日/最新体重、初始体重、目标体重、剩余差距展示。
- 7 天体重趋势固定显示今天和过去 6 天的日期刻度。
- 缺失日期使用空值，不显示为 0，也不跨缺失日期错误连线。
- 保留 30 天趋势原有逻辑，继续按已有记录展示。
- 修复 dashboard 布局中登录态兜底读取 `auth.currentUser` 导致的 hydration mismatch 控制台报错。

### 验证结果
- 用户验证测试通过 ✅
- `npx tsc --noEmit` 通过 ✅
- `npm run lint` 无 error，仅剩 4 个既有 hook dependency warning ✅
- `npm run build` 通过 ✅
- 本地使用 `npm run dev -- --port 3001` 可正常访问 `/dashboard/weight`，返回 `200 OK` ✅

### Git 提交
- 本次提交包含 Step 33 体重目标折叠、7 天趋势修正、dashboard hydration 修复与对应文档更新。

### 后续步骤
- Step 34: 围度最近有效记录展示（已完成）

---

## Step 32: 昵称与个人资料 ✅ (完成日期: 2026-04-26)

### 完成内容
- 新增 `/dashboard/profile` 个人资料页，支持已登录用户保存昵称。
- 个人资料页预留并保存身体基础资料字段：身高、性别、出生年份、活动水平。
- 侧边栏新增“个人资料”入口，未登录用户可只读浏览，点击保存相关动作时弹出登录/注册提醒。
- 顶部栏和仪表盘欢迎语优先显示昵称，未设置昵称时回退邮箱。
- 右上角昵称和头像区域改为可点击入口，可直接跳转到个人资料页编辑。
- 保存昵称后通过页面内事件刷新顶部栏展示，不需要手动刷新页面。
- 扩展 `UserProfile` 类型和 `getUserProfile` 读取逻辑，旧用户未设置新增字段时继续兼容。

### 验证结果
- 用户验证测试通过 ✅
- `npx tsc --noEmit` 通过 ✅
- `npm run lint` 无 error，仅剩 4 个既有 hook dependency warning ✅
- `npm run build` 通过 ✅
- 本地使用 `npm run dev -- --port 3001` 可正常访问 `/dashboard` 和 `/dashboard/profile`，均返回 `200 OK` ✅

### Git 提交
- 本次提交包含 Step 32 昵称与个人资料功能、右上角资料入口与对应文档更新。

### 后续步骤
- Step 33: 体重目标顶部折叠与 7 天趋势修正（已完成）

---

## Step 31: 真实记录原则提示 ✅ (完成日期: 2026-04-26)

### 完成内容
- 新增统一 `RecordPrincipleNotice` 组件，用于提示“真实记录，才方便复盘”。
- 首页 `/` 增加真实记录原则提示，让首次访问者在进入应用前理解记录口径。
- 仪表盘 `/dashboard` 增加真实记录原则提示，作为记录入口前的统一说明。
- 体重、围度、饮食、运动记录页均增加同一提示，明确历史记录暂不支持修改。
- 文案保留今日误录可按页面已有能力删除或重新记录的说明，不扩展任意历史编辑能力。
- 本次不改动 Firestore 数据结构，不修改现有保存、删除或记录流程。

### 验证结果
- 用户验证测试通过 ✅
- `npx tsc --noEmit` 通过 ✅
- `npm run lint` 无 error，仅剩 4 个既有 hook dependency warning ✅
- `npm run build` 通过 ✅
- 本地使用 `npm run dev -- --port 3001` 可正常访问 `/`、`/dashboard`、`/dashboard/weight`、`/dashboard/food`、`/dashboard/measurements`、`/dashboard/exercise`，均返回 `200 OK` ✅

### Git 提交
- 本次提交包含 Step 31 真实记录提示与对应文档更新。

### 后续步骤
- Step 32: 昵称与个人资料

---

## Step 30: 冰蓝玻璃感视觉升级 ✅ (完成日期: 2026-04-26)

### 完成内容
- 全局视觉从黑白灰后台模板感升级为冷白、浅蓝灰、蓝青色主基调。
- `globals.css` 新增冰蓝渐变背景、选中文本样式和 dashboard 内部浅蓝灰覆盖规则。
- dashboard shell、侧边栏、顶部栏、移动端菜单按钮改为半透明玻璃质感、细边框和柔和阴影。
- 首页、登录页、注册页同步使用冰蓝背景，保持公开入口和账号入口视觉一致。
- Card、Button、Input、Select、Tabs、Dialog、Sheet、Dropdown、Toast、Checkbox 等基础 UI 组件统一为冰蓝玻璃感。
- 保持记录工具的信息密度，不改动核心页面业务流程。
- 修复 `/dashboard/inventory` 在生产构建中的 `useSearchParams()` Suspense 要求，避免 Next.js 预渲染失败。

### 验证结果
- 用户验证测试通过 ✅
- `npx tsc --noEmit` 通过 ✅
- `npm run lint` 无 error，仅剩 4 个既有 hook dependency warning ✅
- `npm run build` 通过 ✅
- 本地使用 `npm run dev -- --port 3001` 可正常启动 webpack 开发服务，`/`、`/dashboard`、`/dashboard/inventory` 均返回 `200 OK` ✅

### Git 提交
- 本次提交包含 Step 30 视觉升级、生产构建修复与对应文档更新。

### 后续步骤
- Step 31: 真实记录原则提示

---

## Step 29: 未登录用户完整只读浏览 ✅ (完成日期: 2026-04-26)

### 完成内容
- 首页 `/` 改为面向公开访问者的产品入口，未登录用户可先进入仪表盘浏览，登录用户仍会自动进入 `/dashboard`。
- 仪表盘布局取消未登录强制跳转登录页，未登录用户可以访问 `/dashboard` 和各 dashboard 子页面。
- 仪表盘首屏不再等待 Firebase Auth 加载完成，避免未登录只读浏览时卡在加载态。
- 顶部栏在未登录状态显示“当前为只读浏览”，并提供登录、注册入口；侧边栏提示登录后可保存记录。
- 新增统一 `AuthRequiredDialog`，未登录用户点击保存、记录、删除、生成计划、编辑设置等写入动作时，会弹出登录/注册提醒。
- 体重、围度、饮食、运动、食材库存和菜谱相关页面均补充未登录写入拦截，未登录状态不会向 Firestore 写入数据。
- 修复 `Button` 的 `asChild` 支持，使登录/注册链接能正确作为按钮渲染。
- 将 `npm run dev` 固定为 `next dev --webpack`，绕过当前 Next 16 Turbopack 本地 panic 导致的页面反复加载问题。

### 验证结果
- 用户验证测试通过 ✅
- `npx tsc --noEmit` 通过 ✅
- `npm run lint` 无 error，仅剩 4 个既有 hook dependency warning ✅
- 本地使用 `npm run dev -- --port 3001` 可正常启动 webpack 开发服务，`/dashboard` 返回 `200 OK` ✅

### Git 提交
- 本次提交包含 Step 29 功能实现、开发服务器脚本修正与对应文档更新。

### 后续步骤
- Step 30: 冰蓝玻璃感视觉升级

---

## 新一轮产品迭代计划补充 ✅ (完成日期: 2026-04-26)

### 完成内容
- 将用户新提出的产品方向整理进 `memory-bank/modification-plan.md`：
  - 未登录用户完整只读浏览。
  - 写入动作弹出登录/注册提醒。
  - 冰蓝玻璃感视觉升级。
  - 昵称与个人资料。
  - 体重目标顶部折叠与 7 天趋势修正。
  - 真实记录原则提示，历史记录暂不支持修改。
  - 围度最近有效记录展示。
  - 饮食记录增加进食时间。
  - 仪表盘增加围度概览。
  - 食材库存支持可用顿数。
  - 菜谱生成按顿数消耗库存。
  - 身体基础资料、BMI 和轻量营养目标。
- 将以上方向拆分到 `memory-bank/implementation-plan.md` 的 Step 29-40，作为后续工程执行顺序。

### 验证结果
- 本次为规划和文档整理，未进行功能验收。

### 后续步骤
- 从 Step 29“未登录用户完整只读浏览”开始实施。

---

## Step 28: 菜谱生成规则和库存不足提示 ✅ (完成日期: 2026-04-26)

### 完成内容
- 菜谱生成改为只使用用户库存中的食材，不再使用内置推荐食材作为兜底。
- 建立基础三餐搭配规则：
  - 早餐：主食 + 蛋白/蛋奶，可选水果。
  - 午餐：2 份蔬菜 + 1 份蛋白质 + 1 份主食。
  - 晚餐：蔬菜 + 蛋白质，主食可选。
- 肉类和蛋奶统一作为蛋白质来源，主食、蔬菜、蛋白质按临期优先轮换使用。
- 库存不足时不强行生成完整一周菜单，并显示“当前库存不足以生成完整一周菜谱”。
- 页面新增补货建议，能提示主食不足、蔬菜不足、蛋白质不足；水果缺失作为可选补充建议，不阻断生成。
- 保留已有表格、九宫格、日历三种菜单视图和浏览器打印导出能力。

### 验证结果
- `npx eslint src/app/dashboard/inventory/page.tsx` 通过 ✅
- `npx tsc --noEmit` 通过 ✅
- `npm run lint` 无 error，仅剩 5 个既有 warning ✅

### 后续步骤
- 等用户完成网页端验收后，按需要继续补充测试反馈或进入下一轮优化。

---

## Step 27: 菜谱导出为便于查看的一页纸 ✅ (完成日期: 2026-04-25)

### 完成内容
- 在食材与菜谱页的一周菜单区域新增“导出 / 保存 PDF”入口，直接调用浏览器打印能力。
- 导出内容跟随当前菜单视图，且仅导出当前一周菜单，不包含库存、食材使用计划或条件设置。支持打印：
  - 表格视图
  - 九宫格视图
  - 日历视图
- 为菜谱打印新增专用样式：
  - 打印时隐藏侧边栏、顶部栏、移动端菜单按钮和页面内无关按钮/表单。
  - 打印页仅保留菜谱标题、日期范围和当前菜单视图内容。
  - 打印范围采用菜谱容器白名单控制，避免误带页面其他区块。
  - 默认按 A4 横向紧凑排版，压缩间距以适配一页纸查看或保存 PDF。

### 验证结果
- `npx eslint src/app/dashboard/inventory/page.tsx src/app/dashboard/layout.tsx` 通过 ✅
- `npx tsc --noEmit` 通过 ✅
- 本地开发服务下 `curl -I http://localhost:3000/dashboard/inventory` 返回 `200 OK` ✅

### 后续步骤
- Step 28: 菜谱生成规则和库存不足提示

---

## Step 26: 菜谱展示压缩为表格/日历视图 ✅ (完成日期: 2026-04-25)

### 完成内容
- 一周菜单从按天长卡片改为可切换的紧凑视图。
- 新增三种菜单展示：
  - 表格视图：桌面端按日期、早餐、午餐、晚餐展示，移动端自动降级为紧凑日期卡片。
  - 九宫格视图：按日期和餐次拆成紧凑餐次块，便于快速扫视。
  - 日历视图：横向一周日历布局，保留三餐和做法提示。
- 三种视图共用同一份 `weeklyPlan` 数据，切换后菜谱内容保持一致。

### 验证结果
- `npx eslint src/app/dashboard/inventory/page.tsx` 通过 ✅
- `npx tsc --noEmit` 通过 ✅

### 后续步骤
- Step 27: 菜谱导出为便于查看的一页纸

---

## Step 25: 合并食材库存和菜谱生成 ✅ (完成日期: 2026-04-25)

### 完成内容
- 将食材库存和菜谱生成合并为 `/dashboard/inventory` 的“食材与菜谱”页面。
- 页面内使用 Tab 组织：
  - 食材库存
  - 一周菜谱
  - 条件设置
- 添加、编辑、删除食材后，同页菜谱生成直接读取最新库存状态。
- 侧边栏移除独立“菜谱生成”入口，保留一个“食材与菜谱”入口。
- `/dashboard/recipe` 保留为兼容跳转页，自动跳转到 `/dashboard/inventory?tab=recipe`，避免旧入口 404。
- 原库存页和菜谱页的 lint error 已随合并消除。

### 验证结果
- 用户验证测试通过 ✅
- `npx eslint src/app/dashboard/inventory/page.tsx src/app/dashboard/recipe/page.tsx src/app/dashboard/layout.tsx` 通过 ✅
- `npx tsc --noEmit` 通过 ✅
- `npm run lint` 无 error，仅剩 5 个既有 warning。

### Git 提交
- 本次提交包含 Step 25 功能实现与对应文档更新。

### 后续步骤
- Step 26: 菜谱展示压缩为表格/日历视图

---

## Step 24: 合并目标设定和体重记录 ✅ (完成日期: 2026-04-25)

### 完成内容
- 将目标设定整合进体重记录页 `/dashboard/weight`。
- 体重记录页顶部新增目标摘要，展示今日/最新体重、初始体重、目标体重和剩余差距。
- 页面中部保留快速记录今日体重，页面下部保留今日记录、体重趋势，并新增目标设置表单。
- 侧边栏移除独立“目标设定”入口。
- `/dashboard/goal` 保留为兼容跳转页，自动跳转到 `/dashboard/weight#goal-settings`，避免旧入口 404。
- 仪表盘空状态文案改为引导用户到体重记录中设置体重目标。

### 验证结果
- 用户验证测试通过 ✅
- `npx eslint src/app/dashboard/weight/page.tsx src/app/dashboard/goal/page.tsx src/app/dashboard/layout.tsx src/app/dashboard/page.tsx` 通过 ✅
- `npx tsc --noEmit` 通过 ✅
- `npm run lint` 仍存在既有无关错误，涉及 inventory、recipe 等文件，以及部分既有 hook dependency warning。
- 本次不处理全仓既有 lint cleanup，后续单独安排。

### Git 提交
- 本次提交包含 Step 24 功能实现与对应文档更新。

### 后续步骤
- Step 25: 合并食材库存和菜谱生成

---

## Step 23: 运动记录支持自定义运动量单位 ✅ (完成日期: 2026-04-25)

### 完成内容
- 运动记录页支持按“运动量数值 + 单位”记录运动。
- 单位支持：分钟、步、公里、次、组、圈、自定义。
- 今日统计从“运动时长”调整为“运动量记录”，并按单位分组汇总。
- 今日运动记录列表显示用户选择的单位。
- Firestore 读取逻辑兼容旧 `duration` 数据，旧记录按分钟显示。
- 新记录选择分钟时继续写入 `duration`，同时写入新的 `amount`、`unit` 字段。
- 测试过程中修复登录成功后页面在登录页、首页和仪表盘之间反复跳转的问题：
  - 登录和注册成功后直接 `replace` 到 `/dashboard`。
  - 已登录用户打开登录/注册页时直接进入 `/dashboard`。
  - 仪表盘鉴权守卫使用 `auth.currentUser` 兜底，避免 Firebase Auth 状态同步期间误跳回登录页。

### 验证结果
- 用户验证测试通过 ✅
- `npx eslint src/app/dashboard/exercise/page.tsx src/lib/firestore.ts src/lib/review.ts` 通过 ✅
- `npx eslint src/app/login/page.tsx src/app/register/page.tsx src/app/page.tsx src/app/dashboard/layout.tsx` 通过 ✅
- `npx tsc --noEmit` 通过 ✅
- `npm run lint` 仍存在既有无关错误，涉及 inventory、recipe 等文件，以及部分既有 hook dependency warning。
- 本地开发服务使用 `npm run dev -- --webpack` 后可正常打开，绕过 Next 16 Turbopack 本地 panic。

### Git 提交
- 本次提交包含 Step 23 功能实现、登录跳转修复与对应文档更新。

### 后续步骤
- Step 24: 合并目标设定和体重记录

---

## Step 22: 围度记录移动端优化与删除能力 ✅ (完成日期: 2026-04-25)

### 完成内容
- 围度记录页摘要卡片在移动端改为两列展示。
- 压缩摘要卡片的间距、标题字号、图标和数值字号，减少手机端纵向占用。
- 今日围度记录增加删除按钮和确认弹窗，支持删除误录的今日记录。
- 删除今日围度记录后，同步刷新今日记录列表和围度趋势图。
- 新增通用 `deleteDailyRecord` 方法，复用现有每日记录子集合结构删除指定记录。

### 验证结果
- 用户验证测试通过 ✅
- `npx tsc --noEmit` 通过 ✅
- `npm run lint` 仍存在既有无关错误，涉及 inventory、layout、recipe 等文件；本次围度页仅保留同类 hook dependency warning。
- 本地开发服务改用 `npx next dev --webpack` 后页面可正常打开，绕过 Next 16 Turbopack 本地 panic。

### Git 提交
- 本次提交包含 Step 22 功能实现与对应文档更新。

### 后续步骤
- Step 23: 运动记录支持自定义运动量单位

---

## Step 21: 新建独立复盘页面 ✅ (完成日期: 2026-04-25)

### 完成内容
- 新建独立复盘页面 `/dashboard/review`，修复侧边栏和首页快速入口跳转 404。
- 新增 `src/lib/review.ts`，将日复盘、周复盘分析逻辑抽为可复用函数。
- 饮食记录页改为复用同一套复盘分析逻辑，保留原有日复盘、周复盘和周计划入口。
- 独立复盘页支持：
  - 今日复盘：今日执行度、触发性进食、做得好的事、明日优先改进。
  - 本周复盘：体重/围度变化、执行度、触发性进食、情绪-进食关联、高风险场景、下周策略。
  - 无记录时展示空状态，并引导用户前往饮食记录页。

### 验证结果
- 用户验证测试通过 ✅
- 用户已跑通 `npm run build` ✅
- `npx eslint src/app/dashboard/food/page.tsx src/app/dashboard/review/page.tsx src/lib/review.ts` 无错误；仅保留饮食页既有 hook dependency warning。

### Git 提交
- 本次提交包含 Step 21 功能实现与对应文档更新。

### 后续步骤
- Step 22: 围度记录移动端优化与删除能力

---

## Step 20: 仪表盘体重同步与文案调整 ✅ (完成日期: 2026-04-25)

### 完成内容
- 修复仪表盘今日体重读取路径：
  - 从 `records/{userId}/daily/{date}/weight` 子集合读取体重记录。
  - 今日有晨起体重时优先显示晨起体重。
  - 今日无晨起体重时显示当天最新记录。
  - 今日无记录时回看最近 90 天记录，并在仪表盘标注“最近记录”日期。
- 仪表盘三项体重口径调整为：
  - 今日体重
  - 初始体重
  - 目标体重
- 进展概览改为使用今日体重或最近体重与目标体重计算“还需”。
- 目标设定页面将用户可见的“当前体重”文案调整为“初始体重”。
- 保留内部字段 `currentWeight`，不做 Firestore 数据迁移。

### 验证结果
- 用户验证测试通过 ✅
- `npm run build` 通过 ✅
- `npx eslint src/app/dashboard/page.tsx src/app/dashboard/goal/page.tsx src/lib/firestore.ts` 无错误；仅保留 `src/lib/firestore.ts` 既有未使用导入 warning。
- 全量 `npm run lint` 仍存在既有无关错误，涉及 inventory、recipe、layout 等文件。

### Git 提交
- 本次提交包含 Step 20 功能实现与对应文档更新。

### 后续步骤
- Step 21: 新建独立复盘页面

---

## 修改规划：功能优化与重构计划 ✅ (完成日期: 2026-04-25)

### 背景
- 用户基于当前内部测试体验，提出 7 个方面的修改需求：
  - 仪表盘体重同步与文案调整
  - 围度记录移动端优化和历史数据删除
  - 运动记录支持自定义运动量单位
  - 独立复盘页面缺失导致 404
  - 菜谱生成展示、导出和搭配规则优化
  - 食材库存与菜谱生成页面合并
  - 目标设定与体重记录页面合并

### 完成内容
- 新增 `memory-bank/modification-plan.md`
- 将修改内容拆分为三个阶段：
  - 阶段一：修复明显问题，恢复核心闭环
  - 阶段二：合并强相关页面，降低使用路径成本
  - 阶段三：升级菜谱生成和导出能力
- 明确每个任务的问题、修改方向和验收标准

### 后续步骤
- 优先执行阶段一：
  1. 仪表盘体重同步与文案调整
  2. 新建独立复盘页面
  3. 围度记录移动端优化与删除能力
  4. 运动记录支持自定义运动量单位

---

## Step 1: 创建 Next.js 项目骨架 ✅ (完成日期: 2026-04-16)

### 完成内容
- 使用 create-next-app 初始化项目 `haoshijia`
- 配置 TypeScript + Tailwind CSS (v4)
- 安装 shadcn/ui 基础组件：
  - Button、Input、Card、Dialog、Select、Form
  - Dropdown Menu、Toast、Sheet、Label
- 创建 lib/utils.ts 工具函数
- 更新 globals.css 使用 CSS 变量
- 更新 metadata 为"好食家"

### 验证结果
- `npm run build` 通过
- 浏览器访问 http://localhost:3000 显示 "好食家" 欢迎页面 ✅
- 测试通过

---

## Step 3: Firebase 集成 ✅ (完成日期: 2026-04-16)

### 完成内容
- 安装 firebase SDK
- 创建 `src/lib/firebase.ts` - Firebase 初始化配置
- 创建 `src/lib/auth.ts` - Auth 工具函数（signUp, signIn, signOut, onAuthStateChanged）
- 创建 `src/lib/firestore.ts` - Firestore 工具函数（用户profile CRUD、日记录操作）
- 创建 `src/contexts/AuthContext.tsx` - Auth Context 全局状态管理

### 验证结果
- `npm run build` 通过 ✅
- 浏览器测试通过 ✅

### 后续步骤
- Step 11: 日复盘
- Step 12: 周复盘

---

## Step 10: 运动记录 ✅ (完成日期: 2026-04-17)

### 完成内容
- 创建运动记录页面 `/app/dashboard/exercise/page.tsx`
  - 记录字段：运动类型、时长、消耗卡路里、强度（轻/中/高）
  - 今日记录列表展示
  - 统计卡片：运动次数、运动时长、消耗卡路里

### 验证结果
- `npm run build` 通过 ✅
- 浏览器测试通过 ✅

### 后续步骤
- Step 11: 日复盘

---

## Step 11: 日复盘 ✅ (完成日期: 2026-04-17)

### 完成内容
- 在饮食记录页面添加复盘入口按钮
- 实现自动生成日复盘内容：
  - 今日执行度（三餐完成比例）
  - 触发性进食次数（非生理饥饿原因加餐）
  - 做得好的事（基于数据分析）
  - 明日优先改进（基于问题分析）

### 验证结果
- `npm run build` 通过 ✅
- 浏览器测试通过 ✅

### 后续步骤
- Step 12: 周复盘

---

## Step 12: 周复盘 ✅ (完成日期: 2026-04-17)

### 完成内容
- 在饮食记录页面添加日复盘和周复盘两个 Tab
- 实现自动生成周复盘内容：
  - 体重周均变化、围度变化（腰围、臀围）
  - 饮食结构概览（执行度、触发性进食次数）
  - 情绪-进食关联分析
  - 高风险场景 TOP3
  - 下周 3 条可执行策略（系统自动推荐）

### 验证结果
- `npm run build` 通过 ✅
- 浏览器测试通过 ✅

### 后续步骤
- Step 14: 食材库存输入

---

## Step 13: 复盘联动计划 ✅ (完成日期: 2026-04-17)

### 完成内容
- 在 firestore.ts 添加 plans CRUD 函数（savePlan, getPlans, updatePlan, deletePlan）
- 在 food/page.tsx 添加第三 Tab "周计划"
- 实现一键生成下周饮食草案：
  - 高风险触发预警和应对建议
  - 情绪应对计划
  - 每天饮食安排（早/午/晚+加餐）
  - 避免食物列表
- 支持计划的编辑和删除功能
- 数据存储到 Firestore: plans/{userId}/weekly/{planId}

### 验证结果
- `npm run build` 通过 ✅
- 浏览器测试 /dashboard/food 页面正常加载 ✅
- 用户验证测试通过 ✅

### 后续步骤
- Step 14: 食材库存输入

---

## Step 14: 食材库存输入 ✅ (完成日期: 2026-04-18)

### 完成内容
- 创建食材库存页面 `/app/dashboard/inventory/page.tsx`
- 添加食材表单：名称、分类、数量、单位、剩余天数
- 食材列表展示（支持分类筛选）
- 临近过期提醒（剩余天数 ≤ 2 天红色警示）
- 编辑和删除功能
- 添加侧边栏导航"食材库存"

### 验证结果
- `npm run build` 通过 ✅
- 用户验证测试通过 ✅

### 后续步骤
- Step 15: 菜谱生成

---

## Step 15: 菜谱生成（基础版） ✅ (完成日期: 2026-04-18)

### 完成内容
- 创建菜谱生成页面 `/app/dashboard/recipe/page.tsx`
- 读取用户食材库存数据
- 根据食材生成一周每日三餐安排
- 食材消耗节奏规划（优先消耗临近过期食材）
- 简单健康做法推荐

### 验证结果
- `npm run build` 通过 ✅
- 用户验证测试通过 ✅

### 后续步骤
- Step 17: 响应式适配

---

## Step 16: 菜谱生成（增强版） ✅ (完成日期: 2026-04-18)

### 完成内容
- 添加条件约束引擎：
  - 场景选择（宿舍/出租屋/家庭）
  - 设备选择（电饭煲/微波炉/空气炸锅等）
  - 每餐可投入时间
  - 易饿时段设置
  - 偏好做法选择
- 根据用户设置调整菜单生成逻辑
- 添加设置保存功能（保存到用户 profile）
- 添加"条件设置"按钮到菜谱页面

### 验证结果
- `npm run build` 通过 ✅

### 后续步骤
- Step 18: 用户体验优化

---

## Step 17: 响应式适配 ✅ (完成日期: 2026-04-18)

### 完成内容
- 修改 dashboard layout 添加移动端侧边栏菜单（汉堡菜单 + 抽屉式侧边栏）
- 所有 dashboard 页面添加顶部 padding 避免与移动端菜单重叠
- 优化菜谱生成页面按钮布局

### 验证结果
- `npm run build` 通过 ✅
- 用户验证测试通过 ✅

### 后续步骤
- Step 18: 用户体验优化

---

## Step 18: 用户体验优化 ✅ (完成日期: 2026-04-18)

### 完成内容
- 仪表盘首次使用引导：检测用户是否设置目标，未设置则显示引导卡片
- 添加首次使用引导卡片，介绍各功能入口
- 在目标设定页面添加"查看建议"按钮，显示填写建议
- 在体重记录页面添加"查看建议"按钮，显示称重建议
- 在围度记录页面添加"查看建议"按钮，显示测量建议
- 所有数据加载页面添加加载状态（loading-spinner）
- 在注册、登录页面添加加载状态

### 验证结果
- `npm run build` 通过 ✅
- 用户验证测试通过 ✅

### Git 提交
- commit: b701114
- 描述: feat: 添加首次使用引导和加载状态

### 后续步骤
- Step 19: 部署上线

---

## Step 19: 部署上线 ✅ (完成日期: 2026-04-18)

### 完成内容
- 推送代码到 GitHub
- 用户在 Vercel 部署

### 验证结果
- Vercel 部署成功，生产环境可访问

### Git 提交
- commit: b701114
- 描述: feat: 添加首次使用引导和加载状态

### 后续步骤
- 无，项目完成
