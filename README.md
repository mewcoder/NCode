<p align="center">
  <img src="public/logo/icons/512x512.png" alt="NCode 图标" width="128" />
</p>

<h1 align="center"><a href="https://github.com/mewcoder/NCode">NCode</a></h1>

<p align="center">
  基于 ZCode 源码二次开发
</p>

## 功能差异

- 🪪 精简官方登录、订阅等入口及相关权益查询。
- 🫥 隐藏分享、社区、反馈等相关入口。
- 📴 停用遥测上报、应用内更新检查及更新入口。
- 🧩 支持通过设置开启动态工作流

## 兼容说明

为兼容上游和既有数据，内部包名、`zcode` 命令、`ZCODE_*` 环境变量、`.zcode` 数据目录及 `zcode://` 协议保持不变。NCode 不迁移既有 ZCode 数据。

## 快速上手

需要 Git、Node.js 24 或更高版本，以及 pnpm 10.33.2。在仓库根目录运行：

```bash
pnpm bootstrap  # 安装依赖并准备桌面运行资源
pnpm dev:desktop  # 启动桌面版
```

## 本地打包

macOS arm64：

```bash
pnpm bundle:desktop -- --os mac --arch arm64
```

Windows x64：

```bash
pnpm bundle:desktop -- --os win --arch x64
```

安装包输出到 `packages/desktop/dist/`。

## 来源与许可

本项目基于 [ZCode 上游源码](https://github.com/zai-org/ZCode) 二次开发。许可证、版权归属和第三方声明见 [LICENSE](LICENSE) 与 [NOTICE.md](NOTICE.md)。
