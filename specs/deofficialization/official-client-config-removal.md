# 移除官方 Client Config 远程控制与产品端点覆盖

## 目标

删除 Desktop、Host 和 UI 对官方 `/api/v1/client/configs` 的依赖。插件展示顺序由本地固定规则
决定；Desktop Context Prompt 保留为本地显式开关，Renderer Action Trace 从产品中移除。桌面端
不再提供 Production/Test/Custom Endpoint 覆盖，服务端请求不再把产品 endpoint 改写为供应商请求，
也不再注入官方来源头。CLI 官方登录仍保留自己的默认 endpoint 解析；供应商模板继续使用各自的
`api.baseUrl`，不通过产品 endpoint 网关。

## 范围与状态所有者

- 删除 `IClientConfigService`、RPC channel、缓存、Host 注册、远程 workspace 转发和 Renderer 代理。
- Provider Runtime 只读取随包 `zcode-builtin.json` 与本地 Personal Provider 配置；删除通过同一
  `/api/v1/client/configs` 接口下载 Built-in Provider Release 的 endpoint-scoped source 和同步器。
- 删除 Plugin Store Order 的远端响应 schema、React 查询 hook 和强制刷新逻辑。
- `pluginStoreOrdering` 是插件展示顺序的唯一所有者，只使用仓库内置分类顺序、文档插件优先级和
  本地化名称兜底，不读取网络或持久化远端快照。
- Desktop Main 只读取启动时环境变量决定 Desktop Context Prompt 是否启用；Renderer 和 Host 不再
  暴露或消费 Renderer Action Trace 配置。
- 删除通用 `singleFeatureRollout`、两个远端 rollout 解析器、轮询定时器和首个 Host 网络等待门。
- 删除 Client Scenes 官方远程目录及其 `/api/v1/client/scenes` 请求；自动化保留手动创建、编辑、运行，
  删除依赖远程目录的定时任务模板。办公模式推荐只使用随包的本地 Prompt 配置。
- 删除 Coding Plan reset/Billing 的 Service、UI、轮询、协议类型和官方 billing URL；普通 Coding Plan
  API Key 的额度查询仍由选中的 Provider `baseUrl` 直接完成。

## 行为规则

- 启动、创建 Host、打开插件商店、打开插件 Picker 或刷新插件目录时，不请求
  `/api/v1/client/configs`。
- Provider 手动刷新只重新读取本地配置和兼容账号源，不下载官方 Built-in Provider Release。
- 插件列表使用本地固定顺序；刷新按钮只刷新实际插件市场内容，不再刷新远端排序配置。
- Desktop Context Prompt 默认关闭；只有本地环境变量
  `ZCODE_DESKTOP_CONTEXT_PROMPT_ENABLED=1|true|yes|on` 时启用。
- 无效或缺失的本地环境变量按关闭处理，不回退到官方 endpoint。
- 新建本地会话和打开 Automations 页面不请求 `/api/v1/client/scenes`；没有远程场景时不显示远程模板，
  不影响手动创建和本地会话。
- Provider 请求直接使用配置中的 `api.baseUrl`；不会经过 `zcode.z.ai` 地址改写、产品来源头或
  Desktop endpoint 菜单。

## 状态与事件顺序

```text
Desktop 启动
  ├─ 读取一次本地环境变量
  ├─ 创建窗口与 Host，不等待网络配置
  └─ Renderer 不再读取 Renderer Action Trace 配置或注册对应 IPC

插件列表 / Picker
  └─ 本地目录数据 → 本地固定排序 → UI
```

本功能没有远端 lease、重放或持久化状态。环境变量在进程启动时确定，运行期间不轮询变化。

## 失败语义

- 本地环境变量缺失或格式无效时 Desktop Context Prompt 保持关闭，不影响窗口、Host、插件和
  普通会话启动。
- 删除远端配置后不存在超时、重试、旧快照或 stale response；官方 endpoint 不可达不再影响这些功能。
- 插件市场更新失败继续使用插件管理服务原有错误处理，与展示排序无关。

## 验收场景

1. 全仓运行时代码中不存在 `/api/v1/client/configs` 请求、`IClientConfigService` 或
   `ServiceChannels.ClientConfig`。
2. 打开插件商店、插件 Mention Picker 和 workspace 插件预览时使用一致的本地排序，不触发配置请求。
3. 点击插件商店刷新只更新 marketplace 内容，不请求远端排序。
4. 默认启动时 Desktop Context Prompt 关闭，首个 Host 创建不等待网络；不存在 Renderer Action
   Trace 的配置读取或上报入口。
5. 显式设置 Desktop Context Prompt 环境变量后，仅该本地能力启用；不存在 Local TTFT 配置或
   上报入口。
6. `pnpm typecheck`、`pnpm lint`、`pnpm fmt:check`、`pnpm architecture:check --changed` 和
   `git diff --check` 通过，并执行本地 feature flag 与插件排序的聚焦测试。
7. Provider Runtime 启动和手动刷新均只读取本地 Built-in/Personal 配置，不创建远端下载定时器。
8. 新建会话和 Automations 页面不创建 Client Scenes 请求；普通编程模式不显示远程推荐模板，办公模式
   仍使用本地随包推荐 Prompt。
9. Coding Plan reset/Billing 没有 Service、UI、轮询或 `/api/v1/zcode-plan/billing/*` 入口；额度快照仍
   可按 Provider 的固定 `baseUrl` 查询，CLI 官方登录保持可用。

## 迁移边界

旧远端响应和内存快照不迁移、不落盘。删除只影响官方远程排序与灰度控制、产品 endpoint 覆盖、
来源头和 Coding Plan reset/Billing；插件市场内容来源、个人 marketplace、插件安装管理、本地
Provider 配置、本地日志和资源管理器的本地实现仍保留；Local TTFT 不迁移、不提供兼容入口。CLI
官方登录使用的默认 endpoint helper 不在本次删除范围内。
官方插件市场与远程 workspace 资源 CDN 属于独立任务，不在本次改动中顺带删除。
