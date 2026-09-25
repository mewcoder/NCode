# 桌面端 GitHub Release 更新

> 当前状态：暂缓实施。本分支只屏蔽应用内更新；NCode 由用户自行编译和打包。本文保留为未来方案参考。

## 目标与范围

- NCode Desktop 的正式版从公开 GitHub 仓库 `mewcoder/NCode` 获取稳定版更新。
- 将桌面端更新源从 ZCode 官方 manifest 切换到 GitHub Releases；不请求官方更新清单或远程最低版本强更配置。
- 保留现有更新入口、状态展示、手动检查、下载进度、取消下载、跳过版本、安装和更新后说明流程。
- 本次发布流水线构建 macOS arm64 与 Windows x64；Linux 和其他架构暂不在发布范围内。未签名的 macOS 构建不支持应用内更新。
- 本功能不改变 CLI 更新行为。

## 产品行为

### 更新检查

- 只有 `ZCODE_PRODUCT_FLAVOR === "production"` 的桌面产品显示更新入口并启动更新器；Preview 产品不启动更新器。
- 正式版只接受稳定 Release：关闭 prerelease，并忽略设置中遗留的 `receivePreviewUpdates` 值。
- 应用启动后在后台检查，不得等待更新请求完成才显示主界面；自动轮询间隔为 1 小时。
- 用户仍可通过现有菜单和更新对话框手动检查更新。
- 找不到 Release、缺少平台更新清单、网络错误或下载失败时，只报告更新失败并恢复可重试状态，不得阻断应用启动或普通使用。

### 更新状态与设置

- Desktop 主进程 `packages/desktop/src/main/autoUpdater.ts` 是检查、下载、取消、跳过版本、待安装状态和安装的唯一所有者。
- Renderer 继续通过现有 IPC 获取状态与发起操作；不新增平行状态或第二条更新写入路径。
- 保留当前 `autoDownloadAndInstallUpdates` 设置和行为；隐藏只适用于官方 Preview 渠道的设置项。
- 保留更新中断后的待安装版本与更新说明恢复逻辑。
- NCode 不使用官方远程强制升级门；更新服务不可用时不强制退出或阻断启动。

### 更新源边界

- 正式包使用 `provider: github`、owner `mewcoder`、repo `NCode`，并在打包配置中显式写入仓库身份。
- 应用检查更新时不携带 GitHub 写入凭据；GitHub Actions 使用仓库提供的 `GITHUB_TOKEN` 创建及更新 Release。
- 未打包开发构建须显式启用 `ZCODE_AUTO_UPDATE_DEV=1` 或 `--zcode-auto-update-dev`，并可用 generic feed 覆盖进行联调；仅提供 feed 地址不会启用更新器。已打包应用忽略 `ZCODE_UPDATE_FEED_URL` 和 `--zcode-update-feed-url` 覆盖。
- electron-builder 构建只生成安装包与 `latest*.yml` 元数据，不直接发布；发布动作由 GitHub Actions 管理。

## 发布流程

1. 推送 `vX.Y.Z` 标签，或手动运行 `Release desktop` 工作流并指定已存在的标签。
2. 工作流校验标签格式，并要求标签版本与根目录 `package.json` 的版本完全一致。
3. 为标签创建 Draft Release；构建 job 从该标签检出源码，避免构建工作区中未打标签的其他改动。
4. macOS job 构建 arm64 DMG、ZIP、blockmap 与 `latest-mac.yml`；Windows job 构建 x64 EXE、blockmap 与 `latest.yml`。
5. 各平台先验证本地产物，再上传到同一个 Draft Release。任一 job 失败时不得发布 Release。
6. 发布前再次核对两份平台元数据和安装包资产；标签触发时自动发布，手动运行默认保留 Draft，只有显式选择发布才公开。
7. 发布版本只包含上述 macOS 与 Windows 资产；工作流不生成 Linux 更新元数据。

## 签名与兼容性

- macOS 自动更新要求应用使用有效的 Apple Developer ID 签名。配置证书及公证凭据时，工作流启用签名与公证；当前工作流在缺少签名凭据时仍允许生成未签名 macOS 包，但该包不支持应用内更新。签名和更新安装验证完成前，不将 macOS 应用内更新视为已支持能力。
- 当前流水线未配置 Windows 签名证书；安装包会以未签名状态发布。若后续启用签名，更新包与客户端的发布者身份必须一致。
- 现有已安装版本不能被假定会自动迁移更新源；首次安装 GitHub 更新版本需要通过当前既有分发方式提供安装包。
- Linux 及未覆盖架构目前没有配套 Release 资产。当前入口和更新器按产品身份而非操作系统启用，因此这些平台会尝试检查但无法获得对应更新清单；这是本次明确接受的范围限制，现阶段保留行为，不做隐藏或关闭。未来若要正式支持这些平台，需补齐对应资产；调整入口或检查行为前先与用户确认。

## 验收场景

1. 正式版打包后读取的更新目标为 `mewcoder/NCode`，并且不调用 ZCode 更新 manifest 或强更接口。
2. Preview 产品不显示更新入口，也不启动更新检查。
3. 已打包应用忽略 generic feed 覆盖；未打包且显式启用开发更新的构建可以使用覆盖源。
4. GitHub 无新版本、请求失败或平台元数据缺失时，应用仍正常启动，用户可以稍后重试。
5. 手动检查、Release 说明展示、下载进度、下载取消、跳过版本、待安装状态恢复和安装继续走现有 IPC 与状态流。
6. 自动下载偏好仍可在设置中查看与更改；Preview 渠道选择项不显示。
7. 标签版本不匹配、产物缺失、上传失败或清单校验失败时，Release 保持 Draft，不会被工作流公开。
8. Windows 更新能读取 `latest.yml`；macOS 只有在签名和更新安装验证通过后才视为支持应用内更新，未签名构建不纳入可用更新能力。
