<p align="center">
  <img src="public/logo/icons/512x512.png" alt="NCode 图标" width="128" />
</p>

<h1 align="center"><a href="https://github.com/mewcoder/NCode">NCode</a></h1>

<p align="center">
  基于 ZCode 源码二次开发
</p>

NCode 基于 [ZCode](https://github.com/zai-org/ZCode) 源码二次开发，不代表 ZCode 或 Z.ai 官方产品。

## 功能差异

- 精简官方账号、套餐、权益与额度查询。
- 隐藏营销、奖励、分享、社群和反馈入口。
- 关闭手机远控、远程设备及 SSH/WSL/Docker 远程工作区连接与恢复。
- 停用 Bot、闲时任务、遥测上报及应用内升级。
- 动态工作流通过 `/workflow` 命令启用。
- 提供全局指令编辑和数据导入入口。

功能修改、国际化文案及页面验收统一维护在 [ncode-feature.md](ncode-feature.md)。更新上游后，按该清单适配当前源码。

## 兼容说明

内部包名、`zcode` 命令、`ZCODE_*` 环境变量、`.zcode` 数据目录及 `zcode://` 协议保持兼容。业务数据继续使用 `~/.zcode`；Electron 的 localStorage、Cookie 和缓存使用独立的 NCode profile，不自动迁移旧 ZCode profile。

## CLI 使用指南

模型配置、非交互调用、工具与扩展等用法见 [CLI 使用指南](apps/zcode-cli/docs/usage/README.md)。

## 快速上手

需要 Git、Node.js 24.14.0 和 pnpm 10.33.2，版本以 [mise.toml](mise.toml) 为准。在仓库根目录运行：

```sh
pnpm bootstrap
pnpm dev:desktop
```

## 本地打包

macOS arm64：

```sh
pnpm bundle:desktop -- --os mac --arch arm64
```

Windows x64：

```sh
pnpm bundle:desktop -- --os win --arch x64
```

安装包默认输出到 `packages/desktop/dist/`。

## 来源与许可

本项目基于 [ZCode 上游源码](https://github.com/zai-org/ZCode) 二次开发。许可证、版权归属和第三方声明见 [LICENSE](LICENSE) 与 [NOTICE.md](NOTICE.md)。
