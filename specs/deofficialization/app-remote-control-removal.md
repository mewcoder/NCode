# 移除官方 APP 远程控制

## 目标

移除依赖官方账号/官方配对链路的 APP（手机 Web）远程控制入口和服务端桥接，避免去掉官方登录后仍保留一个看起来可用、实际无法完成认证的远控功能。

## 范围与边界

- Web 启动入口不再接受 `?remote=<id>`，不再连接 `/ws/remote/:id`。
- 通用 HTTP Server 不再注册 `/api/connect-remote` 和 `/ws/remote/:id`，不再为浏览器临时保存远程连接。
- 清理只属于 APP 远控的构建环境声明、加载提示、手机设备指纹命名、任务激活标记和窄屏远控专用参数。
- 协议握手和会话创建埋点不再声明只属于 APP 远控的 mobile client kind。
- 普通本地 Web 模式（`/ws`）、Host attachment、任务实时协议和 `apps/zcode-cli` 均不在本次删除范围内；Desktop 的 SSH/WSL/Docker 远程工作区由去官方化裁剪项单独关闭。
- 不删除已有远程工作区数据，不改写共享远程工作区协议，不新增官方账号或远控兼容层。

## 行为规则与不变量

- 无论是否携带历史 `remote` 查询参数，Web 客户端都不能进入 APP 远控桥接；普通 Web 启动只连接本地 Server 的 `/ws`。
- Server 不再创建或持有浏览器远控临时连接；旧 `/api/connect-remote`、`/ws/remote/:id` 请求不再命中本项目的远控处理器。
- Web 的浏览器身份仍可用于本地 Web 会话和本地统计，但不再以“手机远程控制”命名或作为 APP 配对能力。
- Desktop 保留远程协议兼容代码，但个人版 UI 不再调用 `IPlatformService.connectRemote`，也不恢复历史远程 workspace。

## 事件顺序

```text
Web 启动
  ├─ 忽略/拒绝历史 APP remote 参数
  ├─ 连接本地 Web Server 的 /ws
  └─ 进入本地 Web workspace

Desktop 远程开发
  └─ UI → IPlatformService.connectRemote → Desktop Host → SSH/WSL/Docker
```

## 失败语义

- 历史 APP 远控 URL 不再建立远程连接；不会回退到一个隐藏的官方账号登录或官方 relay。
- 普通 Web 本地连接失败仍使用现有 Web 启动错误页。
- Desktop 远程工作区连接失败继续沿用现有连接向导和重连错误处理。

## 验收场景

1. Web 源码中不再有 `?remote=<id>` 到 `/ws/remote/:id` 的启动分支。
2. Server 源码中不再注册 `/api/connect-remote` 与 `/ws/remote/:id`，普通 `/ws` 和 `/api/server-info` 仍可用。
3. UI 与共享协议中不再保留无调用方的 APP 远控任务标记、窄屏远控参数和 mobile client kind。
4. `pnpm typecheck`、`pnpm lint` 和 `pnpm architecture:check --changed` 通过，且不影响 Desktop SSH/WSL/Docker 远程工作区类型与入口。
5. `apps/zcode-cli` 不发生变更。
