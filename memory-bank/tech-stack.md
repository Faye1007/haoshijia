# 技术栈文档

## 1. 前端

| 技术 | 当前版本 | 说明 |
|---|---:|---|
| Next.js | 16.2.4 | React 全栈框架，使用 App Router |
| React | 19.2.4 | UI 库 |
| React DOM | 19.2.4 | React DOM 渲染 |
| TypeScript | 5.x | 类型安全 |

## 2. UI 与样式

| 技术 | 当前版本 | 说明 |
|---|---:|---|
| Tailwind CSS | 4.x | 原子化 CSS，当前通过 `@tailwindcss/postcss` 使用 |
| shadcn/ui | - | 基于 Radix UI 的本地组件组织方式 |
| Radix UI | 1.x / 2.x | Dialog、Select、Tabs、Dropdown、Toast 等基础交互组件 |
| lucide-react | 0.511.0 | 图标库 |
| Recharts | 3.8.1 | 趋势图和数据可视化 |
| class-variance-authority | 0.7.1 | 组件 variant 管理 |
| clsx | 2.1.1 | className 条件拼接 |
| tailwind-merge | 3.3.0 | Tailwind class 合并 |

## 3. 表单与校验

| 技术 | 当前版本 | 说明 |
|---|---:|---|
| react-hook-form | 7.72.1 | 登录/注册等表单状态管理 |
| zod | 4.3.6 | 表单校验 |
| @hookform/resolvers | 5.2.2 | react-hook-form 与 zod 集成 |

## 4. 状态管理

| 技术 | 说明 |
|---|---|
| React Context | 当前用于 Firebase Auth 全局状态 |
| React local state | 页面级表单、加载状态、列表数据管理 |

当前没有引入 Redux、Zustand 等独立状态管理库。

## 5. 后端与数据服务

| 服务/技术 | 当前版本 | 说明 |
|---|---:|---|
| Firebase Client SDK | 12.12.0 | 客户端 Firebase 集成 |
| Firebase Auth | - | 邮箱密码注册、登录、登出、登录状态监听 |
| Firestore | - | 用户资料、记录、计划、食材库存数据存储 |

当前项目没有实现 Next.js API Routes，也没有使用 Firebase Admin SDK。所有现有数据读写都通过客户端 Firebase SDK 完成。

## 6. 部署与工程工具

| 工具/平台 | 当前版本 | 说明 |
|---|---:|---|
| Vercel | - | 前端部署平台，项目已进行过生产部署 |
| GitHub | - | 代码托管与部署触发 |
| npm | - | 包管理与脚本执行 |
| ESLint | 9.x | 代码检查 |
| eslint-config-next | 16.2.4 | Next.js ESLint 配置 |

## 7. 当前脚本

```bash
npm run dev    # 本地开发
npm run build  # 生产构建验证
npm run start  # 启动生产构建
npm run lint   # ESLint 检查
```

## 8. 当前目录结构

```
haoshijia/
├── src/
│   ├── app/                 # Next.js App Router 页面
│   │   ├── login/           # 登录
│   │   ├── register/        # 注册
│   │   └── dashboard/       # 核心功能页面
│   ├── components/          # Provider 与 UI 组件
│   │   └── ui/              # shadcn/ui 基础组件
│   ├── contexts/            # React Context
│   └── lib/                 # Firebase、Firestore、工具函数
├── public/                  # 静态资源
├── memory-bank/             # 项目文档与修改计划
├── components.json          # shadcn/ui 配置
├── package.json
├── postcss.config.mjs
├── next.config.ts
└── tsconfig.json
```

