# 删除 Coding Plan 兼容服务

## 目标

删除只返回拒绝或本地默认值的 `ICodingPlanSubscriptionService`。动态工作流当前保持本地关闭，
不再借用账号套餐 service 获取默认值。

## 边界与不变量

- UI 的动态工作流可用性 hook 直接发布 `{ status: ready, enabled: false }` 本地事实。
- 删除套餐 service descriptor、Host 注册、Renderer 代理和远程 workspace 注册。
- 普通 API Key、Coding Plan API Key 额度查询和本地 App Usage 不依赖本服务，保持可用。
- 删除无调用方的共享支付、订单、企业套餐和 Start Plan preview schema；API Key 额度查询继续使用
  独立的 usage-stats 类型。

## 验收场景

1. 全仓不存在 `ICodingPlanSubscriptionService` 或对应 ServiceChannel。
2. 动态工作流入口保持隐藏，不发生远端请求或加载等待。
3. 模型选择、API Key 配置与使用统计类型检查通过。

## 迁移边界

该 service 不持有持久数据，删除不迁移订单或账号数据。共享支付 schema 已确认无协议消费者，不保留。
