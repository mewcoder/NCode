# NCode 3.17.1 适配记录

## 基线与工作区

- 官方来源：https://github.com/zai-org/ZCode ，main `a60ba6a7e5a06742270ca605f5d2cc2766afa7e1`，提交日期 2026-10-30，package.json 版本 3.17.1；上游已发布 tag v3.17.1，指向该 commit。
- 工作分支：`ncode-v3.17.1`，从上述官方 commit 创建。
- 需求、工作流与品牌来源：`ncode` / `ncode-v3.16.2` 的 `89f9a67215feb2ac0a361a8ebce6300abe0f47f9`，上版官方基线 `3c5b227649371507ddc4eb46ac5133afe6db1cab`。
- 开始时工作区干净；freshness 与 origin 同步检查通过。旧版 19 个特性提交按序以 no-commit 方式移植，逐项处理结构漂移；适配已按特性整理为下述 4 个提交，未推送、未移动 main/ncode 或旧版本分支。
- 根与 CLI 依赖按新版 lockfile 安装；Electron 44.7.0 已用于本轮隔离桌面 E2E。后续应用户要求启动正常数据 dev，并在历史优先加载实现后重建重启，见该 feature 的独立记录。

## 适配决策

| 范围                                       | 处置                                                                                                                                                            |
| ------------------------------------------ | --------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 上游通用能力                               | 以 3.17.1 原始树为源码基线，保留新版会话、输入、MCP、Provider、预览和远程协议实现；仅重施 NCode 已明确的产品边界                                                |
| 官方账号、营销、套餐、分享、遥测、远程入口 | 保留旧版关闭承诺；新增 Server MID 与手机推送启动边界纳入门禁                                                                                                    |
| ZCode Sites                                | 依赖官方账号与云部署，不内置、不默认启用、不播种；同步 SEA、Desktop staging 与远端资产表。保留插件及官方命令代理的上游源码，生产不装配身份端口或命令代理环境    |
| 官方 MCP                                   | 关闭点收敛到协议入口不注入 authHeadersPort 与 Host 不装配解析器；恢复通用 adapter 原实现，保留其 origin/保留头/401 回归。增加无端口的真实 loopback 匿名请求回归 |
| 个性化                                     | 上游已有 ISettingService + PersonalizationSection，直接复用；不恢复旧平行编辑器、hook 或 settings-sync 读写接口                                                 |
| 数据同步、导入                             | 跨设备 dataSync 随 remoteDevices 隐藏，历史深链回落 general；本机 migration 分区继续打开上游无参 requestOnboardingDialog                                        |
| 插件市场与面板                             | 保留 CDN 首选、Pages 一次回退、Claude 市场可删、inventory-only 侧栏面板；不带回已撤销的缓存、扫描复用或冷开实验                                                 |
| 测试体系                                   | 尊重上游 App 业务单测退役，不恢复旧 App test/spec/contract.test.ts；NCode 关闭项与 E2E 基线为显式 engineering 门禁，CLI、浏览器与桌面 E2E 继续独立验证          |
| E2E 基线                                   | 逐项审阅并登记上游新增的 17 个关闭能力正向场景，不排除普通会话、通用工具或关闭态断言。NHELP-01 增加远程/数据同步隐藏、深链回落、单一个性化与导入入口断言        |

产品规则仍以根 ncode-feature.md 为准；旧版页面勾选不继承到 3.17.1，历史记录保留但不充当本轮证据。

## 验证

| 检查                         | 结果                                                                                                                                                                        |
| ---------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| pnpm typecheck               | 通过，包含根项目与桌面 E2E 类型检查                                                                                                                                         |
| CLI typecheck                | Turbo 32/32 成功；本机子 workspace 的 PATH 缺少根 turbo，通过显式加入根 node_modules/.bin 运行原入口                                                                        |
| pnpm lint                    | 0 errors / 69 warnings                                                                                                                                                      |
| CLI lint                     | 0 errors / 84 warnings，7 项 pristine upstream 行数诊断接纳。原脚本把本机原生 pnpm 当作 JS 执行会失败，使用同版本 pnpm.cjs 作为 npm_execpath 后原脚本通过，未修改 lint 规则 |
| architecture:check --changed | 0 violations / 0 baseline / 0 new                                                                                                                                           |
| test:architecture            | 51/51                                                                                                                                                                       |
| db:schema:check              | Node 8/8；两个 SQLite schema baseline 兼容                                                                                                                                  |
| NCode 工程回归               | 锚点、E2E 基线、fixture resolver、打包依赖策略 91/91；Windows E2E runner 与产品身份 33/33                                                                                   |
| CLI 针对性回归               | adapters 插件、官方市场与官方 MCP 136/136；marketplace listing 5/5；bootstrap 插件、官方身份 port 与命令端点 72/72；引用协议、Provider 刷新与遥测 bootstrap 17/17           |
| NCode Node 工具              | 工作流工具初次完整复跑 32/32；最终关闭项、工作流清单、产物审计及构建配置回归 22/22（含新增审计场景）                                                                        |
| 国际化                       | --base a60ba6a7：NCode 新增 en/zh 各 8 键，删除各 0，检查通过                                                                                                               |
| 品牌                         | 同来源 ncode，30 个资源、9 个消费文件检查通过                                                                                                                               |
| 侧栏面板浏览器               | 5/5，桌面英文浅色与窄屏中文深色、inventory-only 与启用后打开                                                                                                                |
| 用户菜单浏览器               | 18/18，中英文、主题、宽窄屏、使用统计跳转、匿名菜单及复制失败                                                                                                               |
| engineering affected         | 官方依赖图选中 159/159，按仓库合同跳过整套，未执行，不能视为 159 项通过；关键回归已按上表独立执行                                                                           |
| 远程目标清单                 | 私有队列不存在，工具明确跳过，不代表真实远端验收通过                                                                                                                        |
| docs:stale-phrases:check     | 通过                                                                                                                                                                        |

### Electron E2E

命令：

```sh
pnpm --filter @zcode/desktop test:e2e -- --spec './test/e2e/ncode/ncode-help-menu-retained.test.ts,./test/e2e/ncode/ncode-workflow-policy.test.ts,./test/e2e/settings/settings-personalization.test.ts'
```

本机运行前显式把根 node_modules/.bin 加入 PATH；runner 重建 Desktop、受影响 CLI 依赖与最终 Agent bundle，使用隔离 HOME/storage 和确定性 provider replay。

- 3/3 spec、9/9 用例通过：NHELP-01、NWF-01、PZ-00 至 PZ-06。
- 运行标识：`desktop-e2e-20261030045726412-p96011-2961ecbf544cf5ea`。
- 证据目录：`packages/desktop/.e2e-artifacts/desktop-e2e-20261030045726412-p96011-2961ecbf544cf5ea/`，包含 summary.json、test-results.ndjson、provider capture 与截图。
- 已查看 ncode-help-menu.png、ncode-about.png：保留三个本地菜单项、无孤立分隔线；关于窗口为 NCode 3.17.1 / N 图标。
- PZ 验证隔离 AGENTS.md 的首次保存、取消与回显、清空、100 KB 上限、跨分区草稿存活、持锁保存失败后恢复重试。

### 首轮失败及收敛

- 根类型检查首先暴露新版依赖补丁未安装，以及旧补丁移除新 Main 所需 import、迁移入口签名变化；更新依赖并按新版调用链修复，最终根检查通过。
- 通用官方 MCP 测试暴露旧版 adapter 删除解析逻辑会破坏显式启用夹具；将关闭收敛到装配点，保留通用实现与正向/匿名安全回归，136/136 通过。
- 侧栏面板浏览器首轮因冷依赖编译造成第一个 page.goto 超时，后续四项通过；未放宽超时或断言，完整复跑 5/5。
- 用户菜单浏览器首轮 17/18，旧 helper 仍等待已关闭的“连接使用”；对齐既有 NCode 匿名菜单名称后 18/18。
- 静态锚点随当前导航所有者及格式化后的表达式更新，保留 remoteDevices/dataSync 的独立关闭断言；最终工程回归通过。

## 已提交适配与独立优化

- 3.17.1 适配已获授权并提交：`d627d6db` 本地策略、`7edbbae1` 插件市场与面板、`5ffff9bf` 品牌、`6f1d1652` 更新工具与回归门禁。
- 上述提交后的干净工作区已执行 `ZCODE_AFFECTED_TEST_BASE=a60ba6a7e5a06742270ca605f5d2cc2766afa7e1 pnpm verify:pre-push`，通过；受影响 engineering 测试选中 159/159 后按合同跳过，不能记为执行通过。
- 随后新增的“历史优先加载”已独立提交为 `dc125ab1 perf(ncode): decouple history loading from runtime preparation`，实现、规范和测试在同一提交中；不是品牌、市场或关闭策略的补漏。范围、冷启动测量、HF01/HF02 证据与未验证项见 [独立记录](session-history-readiness-2026-10-30.md)。
- `dc125ab1` 提交后的完整 `verify:pre-push` 已通过，使用同一官方基线；后续收尾文档提交与推送继续执行门禁，不沿用此前适配的通过结论。收尾额外复跑根/CLI 类型检查与 lint、CLI 定向回归 233/233、关闭项与 E2E 基线 58/58、manifest 4/4 和锚点预检 48/48，均通过；CLI 首轮并行构建冲突与复跑过程见独立记录。

### macOS arm64 正式产物补验

- 首次未指定环境的命令产出 Preview 测试包；正式包另用 `ZCODE_ENV=production ZCODE_PREVIEW_IDENTITY=0 pnpm bundle:desktop -- --os mac --arch arm64 --skip-prepare` 构建成功。此处 `--skip-prepare` 只省掉 bundle 入口重复的一次准备，后续 `pnpm build` 仍完整执行 `prepare:runtime-assets`，没有跳过产物生成或校验。
- 产物：`packages/desktop/dist/NCode-3.17.1-mac-arm64.dmg`（163.5 MiB）、`packages/desktop/dist/NCode-3.17.1-mac-arm64.zip`（157.7 MiB）及 `packages/desktop/dist/mac-arm64/NCode.app`。包内 buildCommitId 为 `dc125ab1`、appVersion 为 3.17.1；后续收尾只改文档，不把文档提交号冒充产物构建号。
- 正式 `.app` 的 `pnpm ncode:artifact:audit` 25/25 通过：无遥测/飞书运行时包、上报端点或远端升级 feed；asar 和 13 个 glm staging 包均无四个已关闭内置插件；N 品牌及关键外置运行时依赖在位。包内 `icon.icns` 与源码字节一致，Info.plist 产品名为 NCode。
- 构建日志明确跳过 macOS code signing；本地包未签名、未公证、未实际安装。不把构建/静态审计等同于 Gatekeeper 放行、安装后的视觉验收或全平台验收。安装包保留在本机，未上传 GitHub Releases。

## 未验证与收尾边界

- macOS 正式 DMG/ZIP 与真实 `.app` 审计已补齐；实际安装、签名/公证与完整安装后页面验收尚未执行。
- Windows/Linux、真实手机/SSH/WSL/Docker 连接、完整页面与重启矩阵、真实外部 API Key/MCP OAuth、插件市场公网下载与独立插件端到端功能未在本轮复验。
- 不把确定性模型 replay 当作真实供应商可用性或线上请求证明，不把静态门禁当作完整产品验收。
- 用户已授权版本收尾；本机安装的更新 skill 与仓库副本已逐字节同步。按 workflow 将 `ncode` 与本版本分支同步为同一最终 tip，保留旧版本分支，显式 lease 原子推送后核对远端引用；最终推送门禁及远端核对结果由执行输出确认，不把本记录中的发布步骤当作已发生的推送证明。
