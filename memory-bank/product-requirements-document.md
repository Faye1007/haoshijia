# 好食家 - 产品需求文档

## 1. 产品概述

**产品名称**：好食家

**产品定位**：围绕"记录 → 复盘 → 下周计划"闭环的减脂助手，不仅记录饮食，还理解为什么吃、吃后状态如何、什么场景最容易失控，并自动生成可执行的下一周食谱方案。

**核心差异化**：对比薄荷等竞品，好食家更注重：
- 饮食记录的"原因"（为什么吃、什么情绪触发）
- 周期性复盘看板（不只是记账）
- 智能食谱生成（根据库存、习惯、条件）

---

## 2. 目标用户

### 典型用户画像

| 属性 | 描述 |
|---|---|
| 年龄 | 20-35岁 |
| 性别 | 主要是女性 |
| 痛点 | 减肥反复失败、情绪性进食、聚餐打乱计划后心态崩 |
| 行为 | 有尝试过记录饮食，但缺乏复盘指导导致放弃 |
| 条件 | 学生党/上班族，做饭条件受限 |

### 典型场景

1. 每日快速记录体重、饮食、运动
2. 每晚补全记录后查看日复盘
3. 每周看"情绪-进食关联"和高风险场景
4. 周末一键生成下周菜单（结合库存食材）

---

## 3. 功能范围

### MVP 必须做

| 模块 | 功能点 |
|---|---|
| **A. 体重与减脂周期** | 目标设定、体重记录（多次）、趋势图、周/月视图、伴随因素记录 |
| **B. 围度记录** | 腰/臀/大腿/上臂围、维度趋势图 |
| **C. 饮食记录** | 六时段记录（早餐/午餐/晚餐/上午加餐/下午加餐/晚上加餐）、触发原因、情绪状态、吃后感受 |
| **D. 运动记录** | 运动类型、时长、消耗、强度 |
| **E. 复盘系统** | 日复盘（自动生成）、周复盘（情绪-进食关联、高风险场景TOP3） |
| **F. 菜谱生成** | 食材库存输入、菜单生成（智能匹配+条件约束） |

### 暂不做

- 复杂营养素精准计算
- AI图像识别营养估算
- 深度硬件自动同步
- 数据导出功能

---

## 4. 非功能需求

| 需求 | 说明 |
|---|---|
| **隐私保护** | 用户数据完全私有，开发者无法查看任何用户数据 |
| **数据安全** | Firebase 服务端加密存储 |
| **响应式** | 移动端优先（手机使用为主） |
| **网络要求** | 必须联网才能使用（第一版暂不做离线支持） |
| **图片存储** | 第一版暂不做，优先文字描述 |
| **加载速度** | 首屏加载 < 2秒 |

---

## 5. 技术架构

| 层级 | 技术选型 |
|---|---|
| 前端框架 | Next.js + TypeScript |
| UI框架 | Tailwind CSS + shadcn/ui |
| 后端/数据库 | Firebase（Auth + Firestore） |
| 部署平台 | Vercel |
| 部署方式 | GitHub 自动部署 |

---

## 6. 数据结构

### 当前实现

```
users/{userId}
  - email
  - createdAt
  - nickname
  - heightCm
  - gender
  - birthYear
  - activityLevel
  - currentWeight
  - targetWeight
  - targetDate
  - recipeSettings

records/{userId}/daily/{date}/weight/{recordId}
  - weight
  - recordTime
  - isMorning
  - createdAt

records/{userId}/daily/{date}/measurement/{recordId}
  - waist
  - hip
  - thigh
  - upperArm
  - createdAt

records/{userId}/daily/{date}/food/{recordId}
  - mealType
  - mealTime
  - foodDescription
  - portion
  - hungerLevel
  - triggerReason
  - emotion
  - feeling
  - createdAt

records/{userId}/daily/{date}/exercise/{recordId}
  - exerciseType
  - duration
  - calories
  - intensity
  - createdAt

plans/{userId}/weekly/{planId}
  - weekId
  - weekStart
  - weekEnd
  - triggerWarnings
  - emotionPlans
  - mealSchedule
  - avoidFoods
  - createdAt

ingredients/{userId}/items/{ingredientId}
  - name
  - category
  - quantity
  - unit
  - remainingDays
  - userId
  - createdAt
```

### 规划中的数据结构调整

- 独立复盘页面尚未实现，当前复盘内容主要在饮食记录页内即时生成。
- 后续如果需要持久化复盘结果，可再引入 `reviews/{userId}/weekly/{weekId}`。
- 运动记录后续计划从固定 `duration` 扩展为“运动量数值 + 单位”，详见 `modification-plan.md`。

---

## 7. 开发阶段

| 阶段 | 内容 | 预计时间 |
|---|---|---|
| 1 | 项目初始化、Firebase配置 | 1-2天 |
| 2 | 数据模型、用户认证 | 1天 |
| 3 | 首页仪表盘 | 1天 |
| 4 | 体重模块 | 1-2天 |
| 5 | 围度模块 | 0.5-1天 |
| 6 | 饮食记录 | 2-3天 |
| 7 | 运动记录 | 0.5-1天 |
| 8 | 复盘系统 | 2-3天 |
| 9 | 菜谱生成 | 2-3天 |
| 10 | 优化、上线 | 1天 |

**总计**：约 13-16 天

---

## 8. 版本规划

**当前版本**：v1.0.0（内部测试版）

由于是个人工具且自己需要使用，建议：
- 先内部测试自己用，确认功能完整
- 验证2-4周后如果功能稳定，再考虑公开
- 公开为作品集前，需要完成 `modification-plan.md` 中的核心修复，并整理公开版文档

---

## 9. 风险与对策

| 风险 | 对策 |
|---|---|
| 菜谱生成逻辑复杂 | 第一版用规则匹配，后续迭代加智能推荐 |
| 数据量大时加载慢 | Firebase 查询优化 + 分页 |
| 用户不会用 | 首次使用引导 + 页面内提示 |
