# 桌面应用 GitHub Release 更新

## 目标

NCode 桌面应用基于当前仓库 `mewcoder/NCode` 的 GitHub Releases 提供应用更新。生产包只检查正式稳定版，不再依赖旧的服务端 Electron manifest，也不使用远端最低版本配置阻塞启动。

## 范围

保留桌面应用已有的：

- 启动和周期检查更新；
- 手动检查、下载、取消下载和重启安装；
- 更新进度、版本说明、跳过当前版本和待安装状态恢复。

调整为：

- 生产包使用 `electron-updater` 的 GitHub provider，目标为 `mewcoder/NCode`；
- 只接受 GitHub Release 的稳定版本，设置页不再暴露 preview 更新开关；
- 未打包开发构建仍可通过专用启动参数或环境变量接入 generic feed 做联调，打包生产包忽略该覆盖；
- 删除旧服务 manifest provider、设备标识和后端 endpoint 解析在更新链路中的依赖；
- 删除基于远端 `minimalVersion` 的桌面启动强制升级 gate，普通更新仍由用户确认下载和安装。

## 状态所有者与边界

- `packages/desktop/src/main/autoUpdater.ts` 是更新状态、检查互斥、下载队列和安装动作的唯一所有者。
- Renderer 只通过已有 IPC 读取状态和发起检查、下载、取消、安装、跳过版本操作。
- `electron-builder` 负责声明 GitHub 发布目标；每个 GitHub Release 必须包含 electron-builder 生成的安装包、`latest*.yml` 和 blockmap 等更新资产。
- GitHub Release 的发布和资产上传由 GitHub Actions 自动完成，不在运行时访问 NCode/ZCode 服务端更新接口。

## 发布自动化

- 生产发布只构建 macOS arm64 和 Windows x64；Linux 与其他 CPU 架构不属于本次发布范围。
- `pnpm release` 负责更新版本、生成变更日志并推送 `v<version>` tag；tag 推送后由 `.github/workflows/release-desktop.yml` 触发发布流水线。
- 流水线先创建 Draft Release，再并行构建两个平台并上传安装包、blockmap 与平台对应的 `latest*.yml`，全部资产校验通过后才公开 Release。
- 发布工作流显式使用 `ZCODE_ENV=production`，公开资产不得出现 `Preview` 或 `_TEST`；测试构建不进入公开 Release。
- Draft Release 的正文从 `CHANGELOG.md` 提取对应版本段，使用中文描述并附带可点击的完整变更记录链接，不使用 GitHub 默认英文生成说明。
- 桌面打包脚本显式使用 `--publish=never`；构建器只生成产物，GitHub Actions 是唯一的 Release 上传路径。
- 手动触发流水线默认只保留 Draft，适用于验证指定 tag 的构建；只有显式选择发布才会公开 Release。
- 由于每个平台只构建一个架构，不需要像多架构发布那样合并同名更新清单。
- 当前公开发布允许 macOS 未签名/未公证，不要求 Apple Secrets；构建阶段仍使用 `--publish=never`，避免 electron-builder 重复上传。
- electron-builder 保留可选的 macOS 签名和公证配置；未来配置 Apple Secrets 后可直接启用，不改变 Release 资产结构。

## 兼容性规则

- 已保存的 `receivePreviewUpdates` 字段保留 schema 兼容性，但当前版本不再读取它来选择更新源或渠道。
- 已有的稳定版跳过版本记录继续生效。
- 公开 GitHub 仓库不在客户端内置 token；私有仓库或私有 Release 需要单独设计凭据和分发策略，不作为本次范围。

## 验收场景

1. 打包生产应用初始化后，`autoUpdater` 使用 GitHub provider，目标为 `mewcoder/NCode`，且 `allowPrerelease` 为 false。
2. 自动或手动检查更新时，不请求旧的服务 manifest、`/api/v1/releases/electron/manifest` 或远端最低版本配置。
3. GitHub Release 缺少更新清单或没有可用稳定版本时，更新器回到可继续使用的 idle/up-to-date 状态，不阻塞启动。
4. 设置页不显示 preview 更新开关；普通检查、下载、进度、取消和重启安装行为保持可用。
5. 即使远端曾返回最低版本要求，桌面应用仍能创建主窗口；普通 GitHub Release 更新不会变成强制升级。
6. 发布资产包含 electron-builder 生成的 `latest*.yml`、安装包和 blockmap，另一台安装旧版本的桌面应用可以发现该 Release；macOS 当前为未签名包。
7. 插件市场、模型服务和其他远程配置行为不受本次更新链路迁移影响。

## 验证

- `pnpm typecheck`
- `pnpm lint`
- `pnpm fmt:check`
- `pnpm architecture:check --changed`
- 检查桌面更新相关现有测试；若当前仓库没有对应测试，需在结果中明确记录。
