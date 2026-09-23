# NCode 产品显示名与 ZCode 内部兼容边界

## 产品名决定

- 按仓库当前项目身份，用户看到的产品名为 `NCode`；NCode 基于 ZCode，且不是 ZCode 官方发行版。
- 仅修改产品显示层和必须配套的发行身份；`ZCode` 上游/技术名称及代码内部 `zcode` 标识按本 spec 保留。
- 不把内部 `zcode` 命名直接扩散到产品显示层；若产品身份规则以后变更，再单独调整本节和验收范围。

实现者只需要本 spec 与当前 `ncode` 源码；不需要检出或读取其他分支。

## 必须覆盖的显示入口

| 显示入口                                                                           | 预期                                                                                                            | 当前源码位置                                                                                                                                                                                                                                                                                                                                                                                                                                                                           |
| ---------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Desktop renderer 文档标题                                                          | `NCode`                                                                                                         | `packages/desktop/src/renderer/index.html`                                                                                                                                                                                                                                                                                                                                                                                                                                             |
| macOS 应用菜单名、隐藏/退出菜单中的应用名                                          | `NCode`                                                                                                         | `packages/desktop/src/main/desktopApplicationMenu.ts`                                                                                                                                                                                                                                                                                                                                                                                                                                  |
| 系统托盘菜单、Windows 资源管理器“在应用中打开”菜单                                 | `NCode`                                                                                                         | `packages/desktop/src/main/desktopTray.ts`、`packages/desktop/src/main/desktopWindowsOpenFolderContextMenu.ts`                                                                                                                                                                                                                                                                                                                                                                         |
| `zcode://` 外部链接确认对话框中的应用名                                            | `NCode`；协议 scheme 保持 `zcode`                                                                               | `packages/desktop/src/main/desktopOAuthDeepLink.ts`                                                                                                                                                                                                                                                                                                                                                                                                                                    |
| 关于窗口标题、应用名及图标                                                         | 显示 `NCode` 和 NCode 标志；版权/法定归属继续使用准确的上游来源信息，不借改名声称新版权                         | `packages/desktop/src/main/about.ts`、`packages/desktop/src/main/aboutWindow.ts`                                                                                                                                                                                                                                                                                                                                                                                                       |
| Desktop 标题栏、顶层浮层、欢迎/引导页、侧栏和新建会话空状态中的应用标志/无障碍名称 | NCode 标志和名称                                                                                                | `packages/ui/src/App.tsx`、`packages/ui/src/DesktopTopOverlay.tsx`、`packages/ui/src/WelcomeScreen.tsx`、`packages/ui/src/onboarding/OnboardingWelcomeView.tsx`、`packages/ui/src/WindowsTopLeftLogo.tsx`、`packages/ui/src/WorkspaceSidebar/WorkspaceSidebarCollapsedRail.tsx`、`packages/ui/src/WorkspaceSidebarFooter.tsx`、`packages/ui/src/root/RootStartupLoading.tsx`、`packages/ui/src/v4/ConversationDraftEmptyState.tsx`、`packages/ui/src/components/ui/ZCodeAboutLogo.tsx` |
| Web 标签页标题、favicon、启动页标志                                                | `NCode` 与 NCode 标志；运行时路由不得再覆盖成 ZCode                                                             | `packages/web/index.html`、`packages/web/src/main.tsx`、`packages/web/public/favicon.ico`                                                                                                                                                                                                                                                                                                                                                                                              |
| Web 登录回调页品牌名                                                               | `NCode`；登录流程及 Z.AI 身份文案保持原样                                                                       | `packages/web/src/auth/webAuthLocale.ts`                                                                                                                                                                                                                                                                                                                                                                                                                                               |
| 电脑控制权限提示窗标题和应用名                                                     | `NCode Computer Use`                                                                                            | `packages/desktop/src/renderer/cua-permission-panel.html`                                                                                                                                                                                                                                                                                                                                                                                                                              |
| Linux 深链桌面项                                                                   | `Name=NCode`；`StartupWMClass` 跟随运行时 `app.name`；保留 `zcode.desktop`、`zcode://`、`Icon=zcode` 等兼容标识 | `packages/desktop/src/main/desktopLinuxDeepLinkRegistration.ts`                                                                                                                                                                                                                                                                                                                                                                                                                        |
| Desktop 正式版和 Preview 安装/产物名称                                             | `NCode` / `NCode Preview`                                                                                       | `packages/desktop/package.json`、`packages/desktop/scripts/desktop-product-identity.mjs`、`packages/desktop/electron-builder.config.js`                                                                                                                                                                                                                                                                                                                                                |
| Windows 任务栏和快捷方式身份                                                       | NCode 独立身份                                                                                                  | `packages/desktop/scripts/desktop-product-identity.mjs`、`packages/desktop/src/main/index.ts`、`packages/desktop/electron-builder.config.js`                                                                                                                                                                                                                                                                                                                                           |
| 应用图标和安装器图标                                                               | NCode 标志                                                                                                      | `packages/desktop/build/`、`public/logo/icons/`                                                                                                                                                                                                                                                                                                                                                                                                                                        |
| 项目名和安装说明                                                                   | `NCode`；README 记录项目目标和已完成的精简；CLI 命令仍为 `zcode`                                                | `README.md`                                                                                                                                                                                                                                                                                                                                                                                                                                                                            |
| 应用级中英文文案                                                                   | 任何把宿主应用作为产品名的显示值都使用 `NCode`                                                                  | `packages/ui/src/i18n/locales/zh-CN.ts`、`packages/ui/src/i18n/locales/en-US.ts`                                                                                                                                                                                                                                                                                                                                                                                                       |

## 标志资源规则

- 以当前 `packages/ui/src/assets/Z.svg` 的几何图形顺时针旋转 90°，形成 NCode 的 N 形标志；新增独立的 `packages/ui/src/assets/app-logo.svg` 供应用身份使用。
- Desktop 的 HTML/React 启动标志、关于窗口标志、Web 的启动页标志和内嵌 favicon 都必须使用同一 NCode 标志。Web 的 favicon 既有内嵌 Base64 数据，也有 `packages/web/public/favicon.ico`；两处都要更新。
- 同步更新 `public/logo/icons/` 和 `packages/desktop/build/` 中现有的 PNG、ICO、ICNS、安装器和多尺寸图标。主窗口、托盘、关于窗口、权限提示及 Linux AppImage 使用这些资源，需确认实际打包后均是新标志。已停用的更新提示不作为本次品牌入口处理。
- 只替换被当作应用标志使用的引用。保留 `packages/ui/src/assets/provider-icons/logo-zai.svg` 和其他模型 Provider 图标，不改变它们的外观或用途。
- 只改图形资源和应用显示引用；`ZCodeAboutLogo`、`ZCodeStartupLogo` 等代码符号名及 CSS/DOM 标识不顺带重命名。Linux 图标安装键 `zcode` 保持原样，只更换图像内容。

## 文案规则

- 中英文 locale 只改显示值，不改 message key。只替换可达界面中直接把宿主应用称为 `ZCode` 的文案；未消费的 locale key 和已停用界面的文案不作为品牌入口处理。保留明确指代上游 Agent、上游产品、协议、服务或数据格式的 `ZCode` 文案。菜单、托盘和错误对话框中的硬编码应用名也一并检查。
- 保留 `ZCode Agent`、上游服务/组件、Provider 名称、协议名、错误码及明确说明上游来源的文本。禁止全局替换 `ZCode`。
- `README.md` 使用中文记录 NCode 项目目标、保留能力和已完成的精简，并明确说明它基于 ZCode、不是官方发行版；不维护英文 README。CLI 命令、参数、示例路径和源码/help 输出保持原样。
- Web 公开分享路由继续保持停用并重定向首页；不可达的 Landing Page 不作为本次用户可见品牌入口，也不恢复分享入口。NCode 不提供应用内更新检查、更新下载、安装或自动更新入口，也不新增下载/更新发布流程。
- Desktop 包 `description` 和 `productName` 使用 NCode；npm `name`、上游作者/许可证及第三方来源归属保留。构建发布元数据中的产品主页使用本仓库地址 `https://github.com/mewcoder/NCode`。Linux deb 还要求 `author.email` 和 `maintainer`；当前值是上游 `dev@zcode.z.ai`，不得把它标成 NCode 联系地址或擅自编造新地址。若要替换这两个字段，需先确定 NCode 联系邮箱；在此之前保留为上游来源元数据，不将其呈现为 NCode 支持渠道，也不阻塞其余品牌改动。

## 平台身份与兼容边界

- Desktop 正式版显示名为 `NCode`，Preview 为 `NCode Preview`；本地构建的安装器、应用显示名和产物文件名跟随对应显示名。
- Windows 正式版 AppId 为 `dev.ncode.app`，Preview 为 `dev.ncode.app.preview`。打包配置与运行时 `app.setAppUserModelId` 必须使用同一值。
- macOS 的 `.app` 与主可执行文件名改为 `NCode` / `NCode Preview`，既有 bundle ID 保持不变；Linux 的既有 AppId、可执行文件名、包名和开发态身份保持不变，launcher 的底层 `zcode` 标识保持不变，显示名称跟随 NCode/NCode Preview。
- `runtimeApplicationName`、`app.setName`、`process.title` 和既有 userData/sessionData 路径保持不变，尤其不得把 `.zcode` 数据迁到新目录。macOS 可见应用菜单单独使用 NCode 显示名，不得借修改 `app.setName` 改变数据位置。
- 保持 updater 实现代码不动，只确保用户入口和运行路径处于停用状态；不删除或重构 updater 模块，不新增更新检查、下载、安装、启动请求、轮询、定时器、配置开关或其他运行时开销。
- 安装后，Windows 旧 ZCode 固定项可能仍显示旧图标；用户需取消固定旧项，再固定 NCode。应用数据不迁移。

## 明确不改

- `@zcode/*` 包名、`apps/zcode-cli` 路径、`zcode` 命令、脚本名、命令参数和 CLI 行为/help 文案。
- `ZCODE_*` 环境变量、`.zcode` 数据目录、`zcode://` 深链 scheme、协议字段、数据库、持久化键和运行时身份。
- 登录、Provider、服务端点、业务状态或与显示名无关的代码。
- updater 内部实现、更新 feed 和服务端点；只隐藏下载/更新入口并保持更新运行路径停用。
- 上游来源说明、原始作者归属、许可证、NOTICE 和第三方归属信息。
- 为了统一命名而重命名组件、函数、CSS class、DOM 属性、测试 ID 或内部模块路径。

## 验收场景

1. Desktop 的标题、启动页、About、标题栏和侧栏显示 NCode；macOS 应用菜单的应用名、隐藏和退出文案也显示 NCode。
2. Web 标签页显示 NCode；内嵌 favicon、静态 `favicon.ico` 和启动页标志使用同一 NCode 图形。
3. Desktop 正式版/Preview 本地安装包显示 NCode/NCode Preview；Windows 运行时与安装器 AppId 一致；macOS 主可执行文件分别为 `NCode` / `NCode Preview`，Linux launcher 显示对应产品名且可执行文件名保持不变。
4. 所有列出的应用图标变体一致；Provider 图标保持原样。
5. 应用级中英文提示称本应用为 NCode；上游和技术名称仍准确保留。
6. 欢迎/引导页、系统托盘、Windows 文件夹菜单、深链确认和电脑控制权限提示窗都显示正确的应用名；已停用的分享链接仍重定向到首页。应用内没有更新检查、下载或安装入口及运行路径。
7. `README.md` 以中文说明 NCode 基于 ZCode、不是官方发行版，并记录已完成的功能精简；CLI 命令仍为 `zcode`。
8. 既有命令、环境变量、深链 scheme、协议和用户数据目录不变；原有数据无需迁移。
9. NCode 发布主页指向本仓库，不出现被误认为 NCode 联系方式的 Z.ai 地址。
10. 本地构建的安装包仍可按 NCode 名称产出；NCode 不提供应用下载和更新服务，品牌调整不引入新的运行时工作或网络活动。

## 实现验证

- 人工检查 Desktop、Web、About、macOS 菜单、托盘、Windows 文件夹菜单、深链确认、侧栏、启动态、空状态、locale 文案及中文 README 中的产品显示名；确认已停用的分享路由仍重定向首页，下载/更新入口不可见且 updater 没有运行路径。
- 检查生产版/Preview 本地打包结果、所有图标变体及 Windows 打包/运行时 AppId 配对。
- 检查 NCode 产品主页与 Linux 包的上游来源/联系元数据没有混淆。
- 验证 `runtimeApplicationName` 和 userData/sessionData 路径不变，CLI 命令与内部兼容标识不变。
- 执行 `pnpm typecheck`、`pnpm lint`，并运行当前 Desktop/Web 包提供的相关构建或验证；未执行的检查如实记录。
