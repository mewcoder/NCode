# NCode

NCode 是基于上游 ZCode 源码二次开发的 AI 编程工作台，目标是精简不需要的官方功能，同时保留通用开发能力和上游兼容。项目由个人维护，不代表 ZCode 或 Z.ai 官方产品。

[NCode 源代码仓库](https://github.com/mewcoder/NCode)

本仓库不提供预编译安装包或应用内更新；请自行构建、打包和使用。

## 已完成的精简

- 隐藏官方登录、账号、套餐和升级入口；不再用 OAuth 登录态查套餐权益或团队套餐价。API Key 和自定义 Provider 仍可用。
- 隐藏分享、文档、社群、反馈、功能建议和手机远控入口。
- 停用官方 MCP 授权与额度请求、Off-Peak 同步和任务排期。
- 停用 ARMS、应用事件、资源指标和动作轨迹等监控/遥测上报。
- 停用应用内更新检查与更新入口；不提供下载、安装或自动更新流程。
- 使用随包 Provider 配置，停用 CLI 内置 Provider 远程刷新。
- 应用名称和图标使用 NCode。

## 保留能力

- API Key、自定义 Provider 和本地 Automations/Cron。
- 插件市场，包括官方源。
- 通用 MCP OAuth。
- SSH、WSL、Docker 远程工作区。
- CLI 仍使用 `zcode` 命令。

## 开发

准备 Git、Node.js 和 pnpm；版本以 [mise.toml](mise.toml) 为准。在仓库根目录初始化：

```bash
pnpm bootstrap
```

`pnpm bootstrap` 安装依赖并准备本地桌面运行资源。远程工作区需要额外资源时，运行 `pnpm bootstrap:with-remote`。

| 用途                       | 命令                           |
| -------------------------- | ------------------------------ |
| 启动桌面版                 | `pnpm dev:desktop`             |
| 使用测试服务配置启动桌面版 | `pnpm dev:desktop:test`        |
| 启动 Web 与本地后端        | `pnpm dev:web`                 |
| 开发 CLI 源码              | `pnpm --filter @zcode/cli dev` |

`pnpm dev:desktop` 默认使用生产服务配置。Web 开发服务器默认地址为 `http://localhost:5173`；后端默认监听 `http://localhost:3030`。

## 本地打包

```bash
# 按当前主机的默认目标打包
pnpm bundle:desktop

# 指定平台和架构
pnpm bundle:desktop -- --os win --arch x64
```

`--os` 支持 `mac`、`win`、`linux`；`--arch` 支持 `x64`、`arm64`。默认输出目录为 `packages/desktop/dist/`。签名使用本机配置；NCode 不提供应用内更新。

## 兼容说明

为兼容上游和既有数据，内部包名、`zcode` 命令、`ZCODE_*` 环境变量、`.zcode` 数据目录及 `zcode://` 协议保持不变。CLI 源码位于 [apps/zcode-cli/](apps/zcode-cli/)，本项目尽量不修改该目录。

## 来源与许可

本项目基于 ZCode 上游源码二次开发。许可证、版权归属和第三方声明见 [LICENSE](LICENSE) 与 [NOTICE.md](NOTICE.md)。
