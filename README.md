<p align="center">
  <img src="public/logo/icons/512x512.png" alt="NCode 图标" width="128" />
</p>

<h1 align="center"><a href="https://github.com/mewcoder/NCode">NCode</a></h1>

<p align="center">
  精简 BYO Key 的 AI 编程工作台 — 基于 ZCode 二次开发
</p>

NCode 是一个精简定制的 AI 编程工作台，基于 [ZCode](https://github.com/zai-org/ZCode) 源码二次开发。自带你的 API Key（BYO），保留会话、终端、浏览器控制、自动化与插件能力；移除官方账号体系、遥测上报和营销推广，空闲时零出站请求。不代表 ZCode 或 Z.ai 官方产品。

**适合谁**：只想用自己的 API Key / 自定义供应商，不需要官方账号、套餐权益和社区功能，在意隐私（无遥测）、体积与后台进程的开发者。

## 与 ZCode 的功能差异

**移除的官方功能**

- 官方账号、套餐、权益与额度查询，企业商品请求不再发起。
- 营销、邀请奖励、会话分享、社群与问题反馈入口。
- 手机远控、远程设备及 SSH/WSL/Docker 远程工作区连接与自动恢复。
- Bot / 群聊、闲时任务（Off-Peak）、高速卡、应用内升级与遥测上报。
- 内置插件：搜图（image-search）、Android/iOS 模拟器不随包分发。

**保留并定制的能力**

- 动态工作流通过 `/workflow` 命令启用（固定 onDemand 模式）。
- 个性化设置：全局指令编辑；数据导入走独立入口。
- 插件市场使用 GitHub 官方源（`zai-org/zcode-plugins`）；Claude 插件市场按个人市场对待、可删除。
- 搜索结果过滤金融分类插件。
- 全应用 NCode 品牌与图标。

**架构收益**

- 移除飞书 SDK：安装包体积 -11M，Bot 构建依赖不再进打包图。
- 空闲常驻出站请求为 0，关闭功能的专属后台进程为 0。
- 移除 Android/iOS 模拟器插件：市场目录更精简，会话不再注入无关工具声明。

功能修改、国际化文案及页面验收统一维护在 [ncode-feature.md](ncode-feature.md)；更新流程（三版实测的工作流工具链）见 `.agents/skills/ncode-upstream-update/`。更新上游后，按该清单适配当前源码。

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
