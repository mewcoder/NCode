# 移除官方远程遥测

## 目标

移除 Desktop/Web/UI 到官方遥测、ARMS/RUM 和官方稳定性/资源观测后端的远程上报链路，
避免本地 API Key/自定义 Provider 运行时继续发送设备、用户、界面、会话、崩溃或性能数据。

## 范围与边界

- 删除应用事件上报（启动、日活、界面操作、会话创建和远程连接使用统计）的 Desktop Main
  `TelemetryCore`、Renderer IPC bridge、运行时端点配置和退出 flush。
- 删除 Desktop 的 `@arms/rum-electron` 初始化、浏览器采集、ARMS 自定义事件、稳定性、资源、
  网络、MCP、远程连接和数据目录上报模块及其 IPC/E2E 观测桥。
- 删除 UI 中只用于上述远程出口的 ARMS/应用埋点调用；不改变聊天发送、模型请求、API Key、
  自定义 Provider、远程开发连接、任务实时协议和本地使用统计聚合。
- `apps/zcode-cli` 不删除 CLI telemetry 实现、运行时事实和本地诊断协议；但 OTLP 远程上报改为
  默认关闭，只有显式设置 `ZCODE_MODEL_TELEMETRY_ENABLED=1`（或 `true`/`on`/`enabled`）且配置
  OTLP endpoint 时才启用。
- Desktop 本地 OpenTelemetry trace/metric（例如 Local TTFT、Renderer Action Trace）和本地日志
  诊断保持可用；它们不属于官方遥测出口。
- `deviceMid` 仍可作为本地数据隔离、Provider 请求 header、引导记录和流式 client id 使用，
  但不再因为遥测生成或上报。

## 行为规则与不变量

- 启动时不读取或创建官方遥测端点，不初始化 ARMS SDK，不注入浏览器采集器，不启动遥测定时器。
- CLI 即使继承了 OTLP endpoint，也不会默认初始化 exporter；未显式开启时只走 no-op telemetry
  路径，不创建或更新 telemetry device identity。
- Desktop preload 不暴露遥测/ARMS IPC channel；Web platform 不保留对应 no-op 方法。
- 普通模型请求、额度查询、使用统计本地聚合和自定义 Provider 行为不依赖遥测模块。
- 远程 SSH/WSL/Docker workspace 的连接、重连、attachment、Host 生命周期不因删除连接埋点而改变。
- 旧的 `telemetry-state.json`、本地日志和已有用户数据不主动删除。

## 事件顺序

```text
应用启动
  ├─ 创建本地工作区、Provider、Host 和窗口
  ├─ 不创建官方遥测 Core，不启动 ARMS/RUM
  └─ 仅保留本地日志、Local TTFT 和本地 trace/metric（若已配置）

模型/会话/远程 workspace 操作
  └─ 直接执行原业务路径，不经过远程遥测 IPC 或官方观测出口
```

## 失败语义

- 官方遥测端点不可达不再是应用运行时失败场景；不会重试、flush 或输出遥测网络告警。
- 删除遥测 IPC 后，旧 renderer 不会获得兼容的远程上报入口；当前 Desktop/Web 代码必须在编译期
  清理所有调用方，不保留点击无效或运行时兜底。
- 本地 trace/metric 或日志写入失败仍按各自既有旁路语义处理，不影响模型、会话和工作区主链路。

## 验收场景

1. `packages/desktop`、`packages/services`、`packages/shared`、`packages/ui` 中不存在
   `@arms/rum-electron`、`ZCODE_ARMS_RUM_ENDPOINT`、`ZCODE_TELEMETRY_REPORT_ENDPOINT` 或
   `TelemetryCore` 的运行时引用。
2. Desktop 启动不注册 ARMS/RUM、应用遥测、稳定性/资源/网络/MCP/远程使用上报；普通窗口、Host、
   SSH/WSL/Docker workspace 和自动更新仍可启动。
3. 自定义 API Key Provider 可以发起模型请求；使用统计仍显示本地会话聚合和允许的 API Key 额度
   查询，不因没有遥测模块而进入加载或错误状态。
4. Local TTFT、Renderer Action Trace 和 CLI telemetry 实现不被本次改动删除；CLI 默认不初始化
   OTLP exporter，显式 opt-in 后仍可使用原有 telemetry 能力。
5. `pnpm typecheck`、`pnpm lint`、`pnpm architecture:check --changed` 和 `git diff --check` 通过；
   如存在本次之前的格式检查失败，必须单独说明。

## 迁移边界

本次移除官方远程遥测的配置、上报 Core、ARMS SDK、Desktop/UI IPC 和远程观测专用实现；不迁移
历史遥测事件、不提供兼容端点、不主动清理磁盘状态。后续如果需要自建匿名诊断服务，应按新的
产品规则重新设计同意、数据字段、状态所有者和传输协议，而不是恢复官方遥测链路。
