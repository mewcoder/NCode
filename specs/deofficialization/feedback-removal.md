# 移除官方反馈与社群入口

## 目标

移除"问题上报"整套工单反馈能力，以及官方社群外链和"给产品提需求"入口，使 Desktop、Web 和
Host 不再向官方 ZCode 服务提交工单、设备快照或日志附件，也不再请求帮助配置或打开官方社群地址。
保留会话内 assistant 消息的点赞/点踩，因为它只写本地会话 metadata，不涉及任何远端端点。

## 范围与状态所有者

- `FeedbackHttpClient`、`FeedbackLocalTicketStore`、`compactLogArchive`、`feedbackLogArchive` 及其
  `IFeedbackService` 契约整体删除；服务集合、`IServiceAccessor` 和远程代理不再包含 `feedbackService`。
- `useFeedbackStore` 是工单反馈 UI 的唯一状态所有者，随 `packages/ui/src/feedback/` 一并删除；
  删除后不存在第二处工单草稿、提交任务或上传进度状态。
- `App` 不再注册反馈对话框与反馈中心，`platform.openFeedback()` 命令、
  `PlatformChannels.OpenFeedbackDialog` 事件和 Desktop 应用菜单"问题上报"项全部移除。
- Host 与 Main 之间的 `FeedbackLogArchiveRequest`/`FeedbackLogArchiveResult` 协议消息删除；
  Main 的通用导出日志能力保留，只去掉为反馈归档服务的包装函数。
- 帮助配置读取链路整体删除：`community_urls`、`feedback_url`、`feedback_api_base`、
  `feedback_use_external_form` 及官方响应信封字段 `data.configs.feedbackUrl` 不再解析；
  内置配置不再保存官方社群地址，也不再请求 `/api/v1/client/configs`。
- `redactFeedbackText` 与其脱敏规则表只服务工单载荷，随之删除；日志导出与诊断链路不再引用它。
- 数据目录不再创建或登记 `feedback/`（工单镜像、附件、日志归档）；已有磁盘目录不主动删除。
- 错误横幅的"复制报错"是本地剪贴板能力，保留；其文案从 `feedback.submit.template.section.*`
  改名为 `chat.error.copy.*`，`feedback.*` 命名空间在两份 locale 中清零。
- 窗口截图 IPC 链路（`captureWindowScreenshot`、`PlatformChannels.CaptureWindowScreenshot`、
  `WindowScreenshotResult` 与 main 侧 `desktopMainIpcHelpers.captureWindowScreenshot`）随之删除：
  它在反馈截图选择器移除后没有任何调用方，属于纯死代码，不保留"以后可能用到"的空通道。

## 行为规则与不变量

- 帮助菜单、命令面板、任务右键菜单、Header 更多菜单、错误横幅、会话订阅错误面板和远程连接面板
  均不出现"反馈""问题上报""功能建议""我的工单""用户社群"入口，也不保留禁用态入口。
- 会话消息的点赞/点踩保持可用：`setAssistantFeedback` 协议命令、`ZCodeAssistantMessageFeedback`
  类型、`setAssistantMessageFeedback` 服务和 v4 行内按钮不变。
- `zcode-cli` 不改动：本次不涉及命令、登录流程、运行时和文案。
- 点击任何已删除入口不应产生请求；不允许保留"打开后报错"或"点了没反应"的中间态。
- 通用日志导出、诊断信息查看和社区插件分类等本地能力行为不变；"社区插件"不是官方社群外链，
  不在本次删除范围内。

## 事件顺序

```text
用户打开帮助菜单 / 命令面板 / 任务右键
  ├─ 不渲染反馈、功能建议与用户社群项
  ├─ 不请求 client/configs 帮助配置
  └─ 不建立任何到官方反馈或社群端点的连接

assistant 消息点赞/点踩（保留路径）
  └─ UI 命令 → setAssistantFeedback → 本地会话 metadata
```

## 失败语义

- 反馈端点不可达不再是本项目的失败场景：不存在提交、上传、取消提交或工单列表加载的错误文案路径。
- 官方帮助配置不可达不再是本项目的失败场景：不存在帮助配置读取或社群链接打开的重试路径。
- 删除后仍引用 `feedbackService` 的调用点视为编译期缺陷，必须由类型检查暴露，不用运行时兜底。
- 已存在的 `feedback/` 数据目录与 `tickets.json` 成为未读取的历史数据；不迁移、不承诺兼容。

## 验收场景

1. 全局搜索工单反馈与官方社群符号（`IFeedbackService`、`useFeedbackStore`、`FeedbackCenter`、
   `openFeedback`、`feedback_url`、`openCommunity`、`community_urls`、`CanOpenCommunity`）在
   `packages/` 与 `apps/` 的源码中无残留引用（构建产物除外）。
2. 帮助菜单、命令面板、任务右键菜单、错误横幅和远程连接面板均无反馈、需求或社群入口，
   其余菜单项位置和行为不变。
3. 会话内对 assistant 消息点赞/点踩仍可写入并在重新打开会话后回显。
4. Desktop 应用菜单不再包含"问题上报"或"用户社群"，且启动和菜单操作不请求帮助配置。
5. 导出日志功能仍产出可用归档，且不再依赖 `feedback/` 输出目录。
6. `pnpm typecheck` 与 `pnpm lint` 不引入相对基线的新增错误。
7. 两份 locale 不再包含 `feedback.*` 键或用户社群/产品需求入口文案，且源码中没有引用任何
   本次删除的 i18n 键。

## 迁移边界

本次删除工单反馈与官方社群入口的 UI、服务实现、RPC channel、协议消息、平台命令、帮助配置读取、
默认社群地址、数据目录登记和文案。不保留官方端点的兼容层，也不提供本地替代后端；后续若接入
自建 issue 收集或自建社区入口，需要按新的 spec 重新设计状态所有者与协议，而不是恢复这批代码。
会话消息 like/dislike、社区插件分类与通用日志导出不在迁移范围内。
