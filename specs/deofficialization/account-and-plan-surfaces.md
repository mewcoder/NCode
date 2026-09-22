# 去官方化的账号、OAuth 与账号套餐

## 目标

移除 Z.ai/BigModel 官方账号登录、OAuth 会话、账号型 Start Plan/Coding Plan 及其权益、额度、
购买和同步链路，以及依赖这些账号身份的闲时任务和官方 Server MCP 认证，使 ZCode 可以直接
作为本地开发工具使用。保留通用 Provider、普通 API Key、Coding Plan API Key、自定义模型和
已有本地工作区能力。

## 范围与状态所有者

- `Root` 仍负责启动和工作区选择，不再恢复或轮询官方 OAuth 会话，也不因为官方账号状态阻塞渲染。
- Provider Runtime 只接受普通 API Key、Coding Plan API Key 和自定义 Provider；账号型 Provider
  不再进入 Registry、模型选择或配置提交链路。
- Registry 不再装配 Account Provider Overlay、账号连接 resolver 或 disabled account-auth service；Provider
  Provisioning 只刷新本地 Personal/Built-in Registry，不刷新账号套餐状态。
- 模型 Provider 设置页只展示 API Key/自定义 Provider 与可用 API 模板；账号套餐、权益和购买项目不展示。
- `WorkspaceSidebarFooter` 只保留本地偏好设置入口，不再显示“连接使用”、登录、登出、账号额度、
  升级或官方套餐信息。
- Desktop、Web 和 UI 不再暴露官方账号登录、OAuth 回调、Token 刷新或官方账号登出命令；`apps/zcode-cli`
  按稳定边界保持不改动。
- Desktop、Web 和 UI 不再注册、调度或展示 Off-Peak/闲时任务；已有任务表字段和旧 CLI 协议类型保留为
  历史读取边界，但本地运行时不再读取、派发或向官方闲时端点发请求。
- 删除 `IOffPeakTaskService`、disabled 实现、agent handler 和官方票据/凭据装配；不删除历史
  `off_peak_tasks` 表、任务标记和 shared 兼容 schema。
- Desktop Host、Agent 和使用统计不再解析或发放官方 Server MCP 身份头，也不再请求官方 MCP 额度；
  通用第三方 MCP OAuth 配置保持可用。
- 由于本地运行时不再拥有官方账号身份，分享发布、分享页预览、分享导入及其官方账号依赖代码全部移除；
  本地会话和工作区文件不主动删除，但不再承诺分享数据结构或分享接口兼容。

## 行为规则与不变量

- 首次启动直接进入本地工作区；不读取或恢复 OAuth 会话，不显示欢迎登录页。
- 模型设置中不创建或展示账号型 `zhipu-account` Provider、Start Plan、账号 Coding Plan、账号权益和购买入口。
- 新增供应商目录可以提供 Z.ai、BigModel 的普通 API 与 Coding Plan API Key 模板；这些模板只创建 API Key
  Provider，不触发账号登录。
- 无自定义供应商时显示明确空状态，不显示持续加载。
- 即使没有自定义供应商，模型 Provider 设置左侧仍显示“自定义供应商”分组标题；右侧显示空状态和新增入口。
- 模型选择器中不创建账号 Provider 分组；普通 API Key Provider 的排序、模型名称、视觉能力标识和选择行为不变。
- 旧 OAuth 凭据和账号 Provider 配置不再被运行时读取；本次不主动删除磁盘凭据和历史 schema，但不保留官方账号接口、
  Account Overlay 或兼容服务。
- 删除账号套餐 UI 后，不保留无调用方的套餐身份 hook、额度提醒 store、模型额度显示 helper、Stripe
  支付依赖或二维码依赖。
- 不新增协议命令、远程状态字段或 workspace identity 规则；Desktop、本地 Web 和远程工作区继续使用现有边界。
- 设置页和侧栏的本地语言、主题、界面缩放、工作区及 API Key/自定义 Provider 入口保持可用。
- 设置页始终展示本地会话历史聚合的 App Usage；如果用户配置了
  `zhipu-coding-plan-api-key`，可额外读取该 API Key 对应的套餐额度快照。该查询不读取
  OAuth、账号身份、购买或升级状态。
- API Key 套餐查询由本地 services 层读取 Provider 配置并发起供应商额度请求；只有
  `zhipu-coding-plan-api-key` 且 base URL 属于 `*.z.ai` 或 `*.bigmodel.cn` 时才启用，普通自定义
  API Key 不会被发送到套餐接口。
- 官方套餐购买、支付、企业套餐和升级 UI/服务不再提供；`ICodingPlanSubscriptionService` 如因动态工作流、
  强制更新或旧 channel 仍存在，只能保留与这些非购买能力直接相关的最小兼容面，不得重新创建官方套餐 Provider。
- 无账号状态下不显示分享入口、不发布分享、不加载分享页，也不通过分享 Deep Link 导入远端内容。

## 事件顺序

```text
启动
  ├─ 不读取 OAuth/账号凭据，不启动账号刷新或权益查询
  ├─ 创建或恢复本地工作区
  └─ 进入工作区

模型/设置数据读取
  ├─ 读取普通 Provider 与 API Key 配置
  ├─ 忽略旧账号型 Provider 与账号套餐状态
  └─ 渲染自定义 Provider/API Key 选项
```

## 失败语义

- 本地工作区创建失败时继续使用现有错误处理，不用登录页兜底。
- Provider 或模型读取失败时继续显示原有错误/加载状态；账号 Provider 被移除不应吞掉普通 API Key Provider 的错误。
- 旧 OAuth 会话、账号凭据或账号 Provider 状态不参与启动；不会自动发起登录、刷新、登出或权益请求。
- Off-Peak、官方 MCP 和账号购买链路被移除后，旧任务、额度和订单数据不主动删除，也不承诺旧入口或旧
  官方请求接口继续可用。
- 已选择的历史账号型模型不再作为可执行模型提供；不自动改写用户磁盘配置，需由用户重新选择 API Key Provider。

## 验收场景

1. 即使本机存在旧 OAuth 凭据，首次启动也直接进入本地工作区，不恢复会话，不出现欢迎页、账号连接提示或“连接使用”。
2. 左下角偏好菜单不包含“连接使用”、登录、登出、账号额度、升级或 Start Plan 信息。
3. 模型 Provider 设置不出现账号型 `BigModel`、`Z.ai`、`Start Plan` 或账号 Coding Plan 导航项。
4. 新增供应商目录可以选择 Z.ai、BigModel 的 API Key/Coding Plan API Key 模板并创建自定义 Provider；创建过程不启动 OAuth。
5. 模型选择下拉不出现账号 Provider；已有自定义 Provider/API Key 仍可查看、编辑和选择。
6. Desktop、Web、UI 均不存在官方账号登录/OAuth 启动与回调入口；分享服务、分享协议、分享页和分享导入桥接均不存在；
   `apps/zcode-cli` 不在本次改动范围内。
7. 旧 OAuth/账号配置文件不被自动删除；应用启动、Provider Runtime 和 API Key 模型执行不读取这些配置。
8. 没有任何自定义供应商时，左侧仍显示“自定义供应商”标题，右侧显示空状态；点击新增仍可进入 API Key/自定义供应商创建流程。
9. 打开设置页的“使用统计”始终加载本地 App Usage；配置 Coding Plan API Key 时，额外只按该
   Provider 的 API Key 查询额度，不触发官方账号或 OAuth 请求。
10. Automations 页面仍可创建和管理普通定时任务，但不存在闲时任务 tab、模板、卡片、通知或调度请求；
    旧 `off_peak_tasks` 数据不被主动删除。
11. 官方 Server MCP 额度条和身份头请求不存在；第三方 MCP 的普通 OAuth 授权和配置表单仍可使用。
12. 设置页不再保留官方套餐购买、支付、升级、账号 OAuth 状态和不可达登录入口；自定义 Provider/API Key
    的名称、Logo、模型和连接测试行为不变。
13. `packages/services/src/node.ts` 不注册或公开 Off-Peak Service；旧任务表与 shared 协议类型仍可被迁移/读取，
    但不存在可达的 create/list/调度 handler。`pnpm dep:refs` 不应发现已删除 Account/Off-Peak 运行时实现的调用方。

## 迁移边界

本次移除 UI 入口、分享链路、Desktop/Web OAuth 回调桥接、构建注入的官方 OAuth 配置、Account Provider
Overlay/鉴权服务，并移除 Off-Peak Service、agent handler、官方 Server MCP 认证/额度和官方套餐购买/支付
运行链路。普通 API Key/Coding Plan API Key Provider 不迁移。旧 OAuth 凭据、账号配置、闲时任务数据及少量
shared 协议类型仍保留在磁盘/历史兼容层，不主动删除，也不进入新的 Provider/API Key 运行路径；仅为历史
读取服务且无运行时调用方的 schema 可以保留；`apps/zcode-cli` 保持原样。
