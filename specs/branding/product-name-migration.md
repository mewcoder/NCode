# NCode 桌面页面显示名

## 目标

让桌面端页面和 Windows Shell 在已有 N 形 logo 的基础上使用 `NCode` 视觉身份，同时保留
ZCode 内核兼容边界。

## 范围

- 只修改 `packages/desktop/src/renderer/index.html` 的页面标题。
- 只修改 `packages/desktop/src/main/about.ts` 的关于窗口名称、标题和版权显示文本。
- 侧边栏 footer 的本地标识和折叠侧边栏 logo 无障碍名称显示 `NCode`。
- 正式 Desktop 打包产物使用 `NCode`，测试构建才使用 `NCode Preview` 和 `_TEST` 后缀。
- Windows 打包显式使用 `packages/desktop/build/icon.ico`，避免 exe 沿用旧默认图标来源。
- Windows 打包和运行时使用 NCode 专用 AUMID，避免 Windows 复用旧 ZCode 的任务栏快捷方式和图标缓存。
- logo 资源旋转由 `specs/branding/logo-rotation.md` 单独约束。

## 不变量

- CLI 命令仍为 `zcode`，workspace 包名仍为 `@zcode/*`。
- `ZCODE_*` 环境变量、`.zcode` 数据目录、`zcode://` 深链、协议、可执行文件名和发行脚本不变。
- `runtimeApplicationName` 及现有用户数据路径保持兼容；NCode 产品名只作用于正式打包元数据和视觉展示，不改变 `.zcode` 数据目录。
- macOS/Linux 继续沿用现有平台身份；Windows 使用 `dev.ncode.app` / `dev.ncode.app.preview`，运行时
  `app.setAppUserModelId` 与 electron-builder 的 Windows `appId` 必须一致。
- 不修改 Web 页面、CLI 文案、README 正文、许可证、NOTICE 或原始归属信息；英文 README 的删除是单独的文档决定。

## 验收场景

1. Desktop renderer 的页面标题显示 `NCode`。
2. Desktop 关于窗口的中英文标题、应用名称和版权显示 `NCode`。
3. 侧边栏 footer 显示 `NCode`，折叠侧边栏 logo 的无障碍名称为 `NCode`。
4. Windows exe/安装包使用 N 形 `build/icon.ico`，不回退到历史 Z 形图标。
5. 正式构建的安装包和更新资产名称以 `NCode-<version>-...` 开头，不包含 `Preview` 或 `_TEST`。
6. Windows 安装包和运行中进程都使用 NCode AUMID；旧 ZCode 固定在任务栏的快捷方式不会被复用。
7. `zcode` 命令、包名、路径、协议和许可证相关内容保持原样。

## 迁移边界

现有 ZCode Windows 安装的任务栏固定项可能仍保留旧图标；安装 NCode 新包后需要将旧 ZCode 固定项取消固定，再固定新的 NCode 项。
本次只隔离 Windows Shell 应用身份，不迁移 `.zcode` 数据、CLI、协议、后端端点或 GitHub 更新地址。
