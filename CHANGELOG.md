# Changelog

## 3.14.1 - 2026-09-22

NCode 的首个发布版本，基于 ZCode 3.14.0 进行个人学习与二次开发，不是 ZCode、Z.ai
或智谱官方发行版。

### 品牌与发布

- `7fbb741`：桌面应用、Web 页面、通用 UI 和安装包视觉更新为 NCode 名称与 N 形产品标志。
- `a24310e`：桌面更新迁移到 NCode GitHub Releases，并提供 macOS arm64、Windows x64
  自动发布流程；保留检查更新、下载进度、取消下载和安装更新能力。

### 去官方服务与功能精简

- `b078877`：应用不再要求官方账号登录；移除官方 OAuth、套餐购买、权益设置和相关账号界面，
  普通 API Key、Coding Plan API Key 与自定义 Provider 保持可用。
- `be024a7`：移除会话发布、分享链接预览和分享内容导入。
- `604b29b`：移除官方反馈工单、功能建议和用户社群入口；会话消息的本地点赞、点踩仍然保留。
- `022d7b8`：移除依赖官方账号和配对服务的手机 APP 远程控制；普通 Web 本地连接及 Desktop
  的 SSH、WSL、Docker 远程工作区保持可用。
- `fe3aec6`：移除官方账号套餐、购买升级、官方 MCP 额度，以及闲时任务（Off-Peak）的创建、
  调度和展示；不主动删除已有本地历史数据。
- `bcfe243`：移除 Desktop、Web 和 UI 的官方远程遥测、ARMS/RUM、稳定性与资源上报；保留本地日志、
  Local TTFT 和 Renderer Action Trace，CLI OTLP telemetry 仅在显式启用并配置 endpoint 时工作。
- `792f3ad`：停止官方 Client Config 与 Built-in Provider 远程更新，插件改用本地固定排序；清理官方产品
  文档入口，以及已退役的账号套餐、支付、闲时任务和旧插件管理兼容代码。
- `c36c11b`：安装包和桌面外链统一使用 NCode/GitHub Releases；测试菜单不再提供官方 endpoint 选择，
  Renderer Action Trace 的本地采样限制与配置校验保持一致。
- `28c58a7`：关闭依赖未随安装包发布跨平台运行资源的 SSH、WSL、Docker 远程 workspace 入口，
  不恢复旧远程会话；本地 workspace、Web 本地 Server 和 API Key 使用不受影响。

### 已知限制

- `a24310e`：当前只发布 macOS arm64 和 Windows x64 安装包；macOS 安装包暂未签名或公证，
  生产环境只检查稳定版 Release。
- `28c58a7`：远程 workspace 暂停提供；如果未来恢复，必须先建立 NCode 自有资源发布和校验流程，
  不回退到官方 CDN。
