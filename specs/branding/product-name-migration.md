# NCode 桌面页面显示名

## 目标

让桌面端页面在已有 N 形 logo 的基础上显示 `NCode`，不进行仓库、命令、发行包或运行时身份迁移。

## 范围

- 只修改 `packages/desktop/src/renderer/index.html` 的页面标题。
- 只修改 `packages/desktop/src/main/about.ts` 的关于窗口名称、标题和版权显示文本。
- 侧边栏 footer 的本地标识和折叠侧边栏 logo 无障碍名称显示 `NCode`。
- Windows 打包显式使用 `packages/desktop/build/icon.ico`，避免 exe 沿用旧默认图标来源。
- logo 资源旋转由 `specs/branding/logo-rotation.md` 单独约束。

## 不变量

- CLI 命令仍为 `zcode`，workspace 包名仍为 `@zcode/*`。
- `ZCODE_*` 环境变量、`.zcode` 数据目录、`zcode://` 深链、协议、App ID、可执行文件名和发行脚本不变。
- 不修改 Web 页面、CLI 文案、README 正文、许可证、NOTICE 或原始归属信息；英文 README 的删除是单独的文档决定。

## 验收场景

1. Desktop renderer 的页面标题显示 `NCode`。
2. Desktop 关于窗口的中英文标题、应用名称和版权显示 `NCode`。
3. 侧边栏 footer 显示 `NCode`，折叠侧边栏 logo 的无障碍名称为 `NCode`。
4. Windows exe/安装包使用 N 形 `build/icon.ico`，不回退到历史 Z 形图标。
5. `zcode` 命令、包名、路径、协议和许可证相关内容保持原样。
