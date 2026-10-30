# NCode 3.17.1 适配记录

## 基线与工作区

- 官方来源：https://github.com/zai-org/ZCode ，main `a60ba6a7e5a06742270ca605f5d2cc2766afa7e1`，提交日期 2026-10-30，package.json 版本 3.17.1；官方最新 tag 仍为 v3.15.1，按未打 tag 源码快照命名分支。
- 工作分支：`ncode-v3.17.1-a60ba6a7`，从上述官方 commit 创建。
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
- 随后新增的“历史优先加载”是独立优化 feature，不属于上述已提交适配；实现、规范和测试仍在工作区。范围、冷启动测量、HF01/HF02 证据与未验证项见 [独立记录](session-history-readiness-2026-10-30.md)。

## 未验证与收尾边界

- 未构建 DMG/ZIP 或执行实际安装包审计；本轮审计脚本回归使用合成 asar，不等于新版本安装包审计。
- Windows/Linux、真实手机/SSH/WSL/Docker 连接、完整页面与重启矩阵、真实外部 API Key/MCP OAuth、插件市场公网下载与独立插件端到端功能未在本轮复验。
- 不把确定性模型 replay 当作真实供应商可用性或线上请求证明，不把静态门禁当作完整产品验收。
- 历史优先加载 feature 尚未提交，也未运行包含该 feature 的提交后 `verify:pre-push`；此前适配的通过结果不覆盖这批新增改动。版本分支尚未推送，`ncode` 仍为 `89f9a672`，本机安装的 skill 副本尚未同步本版。后续按授权、验收和干净工作区门禁完成版本收尾，不把文档同步视为发布完成。
