# 历史优先加载：历史显示与执行准备分离（2026-10-30）

## Feature 定位与提交归属

- 用户确认作为独立的 NCode 体验与性能优化 feature；稳定需求以 [ncode-feature.md 第二章第 8 节](../../ncode-feature.md#8-历史优先加载历史显示与执行准备分离) 为准。
- 与 3.17.1 上游适配分开归属，不归入品牌、插件市场或关闭策略提交，也不恢复旧版已撤销的缓存/扫描复用实验。
- 同一提交包含 CLI 只读启动与按需执行资源、Host 配置屏障调整、必要的公共子入口、规范/图谱/用例目录、CLI 回归及桌面 HF01/HF02 E2E；测试与实现不拆成无上下文的尾随提交。
- 实现已独立提交为 `dc125ab1 perf(ncode): decouple history loading from runtime preparation`；后续收尾记录单独归入文档提交，不改写已验证的实现提交。

## 范围与决策

基线为 `ncode-v3.17.1-a60ba6a7` 的 `6f1d1652`。用户确认历史先显示，其他执行准备后置。

- CLI 仍拥有持久历史，Gateway 仍拥有唯一 publisher 与会话初始化状态；不新增缓存、数据库镜像、协议分支或输入队列。
- app-server 直接加载 Bootstrap 的 protocol 公共入口；协议启动与内置插件描述使用 adapter 子入口，不经过全能力 barrel。
- Provider Registry 按需单飞；失败可重试，关闭时中止等待并清理迟到资源。浏览器 broker 就绪屏障移到 App 创建前。
- 已协商 historyFirst 的 Host 订阅不等待 Account Config/Registry 刷新；屏障移到既有 runtime-materialization 偏好应答前，本地与外部 Host 响应均覆盖。旧客户端订阅、执行命令前的配置校验不变。
- 历史/草稿先可读写；运行未 ready 时禁止执行。初始化失败保留历史；停止、重启、workspaceIdentity、continuous/replayable 边界沿用原 owner。

## 原因与证据层级

修改前真实 dev 样本：点击一条 149 行历史至显示 1,538 ms，其中订阅前的生命周期查询 1,152 ms，历史物化 29 ms，runtime-ready 1,707 ms。
这证明该样本的主要等待在历史读取前。进一步核对 CLI 启动日志，Registry 启动约几十毫秒，长等待还包含协议开始处理前的模块加载；不能把 1,152 ms 全部归因于 Provider、插件或磁盘。

前端目前串行查询生命周期后再订阅；本次保留该保护，没有用删查询、加超时或扩大 keep-warm 隐藏等待。实现沿协议启动边界分离执行资源，并保留已有 post-response 首帧顺序。

## 验证

| 检查                         | 结果                                                                                                                                                                         |
| ---------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 根 typecheck                 | 通过                                                                                                                                                                         |
| CLI typecheck                | 32/32 成功                                                                                                                                                                   |
| 根 lint                      | 0 errors / 69 原有 warnings                                                                                                                                                  |
| CLI lint                     | 0 errors / 84 原有 warnings，7 项 pristine upstream 行数诊断接纳                                                                                                             |
| architecture:check --changed | 0 violations / 0 baseline / 0 new                                                                                                                                            |
| CLI 定向 Vitest              | 6 文件 233/233：startup、history-first、cold-resume、Provider runtime、session persistence、plugins                                                                          |
| 启动屏障补验                 | startup 5/5：两种投递模式下阻塞 Provider 时历史已可读，失败保留正文，重复失败可重试，修复本地配置后 ready；另含无 Provider 只读启动、并发单飞与 EOF 迟到释放、存储迁移原回归 |
| CLI 命令选择回归             | app-server/stdio/cwd 等 8/8，未运行 CLI 全量                                                                                                                                 |
| NCode 工程门禁               | 关闭项锚点与 E2E 基线 58/58                                                                                                                                                  |
| 图谱                         | YAML 可解析，415 个唯一 node ID，runtime activation 的 5 个代码种子文件/符号存在；本环境无 codegraph 工具，未声称索引影响分析通过                                            |
| Electron E2E                 | HF01/HF02 2/2，首跑成功、无 retry；已查看初始化中与失败后保留历史/草稿的截图                                                                                                 |

E2E 最终证据：`packages/desktop/.e2e-artifacts/desktop-e2e-20261030062718236-p23297-3f31ebce2bb7991a/summary.md`。
HF01 使用文件事件阻塞 resume hook，历史可见且可编辑草稿，发送禁用；释放后同一草稿可发送。HF02 保留历史/滚动/草稿，修复最终物化错误后重试就绪，hook 不重复运行。

图谱全量端点检查另发现基线已有两个悬空引用：`capability.mcp-oauth-authorization`、`persistence.desktop-user-data-root`。与 HEAD 对照结果完全相同，本次只增加代码种子，没有新增悬空端点；未扩展范围修复原图谱缺陷，不能把全量图谱完整性写成通过。

首轮 E2E 为 1/2：原 HF02 等待重新执行 SessionStart hook，但当前基线 Gateway 与 CLI 单测已明确“纯最终投影对齐失败保留 ready runtime”。未修改 Gateway 生命周期以迁就用例；同步规范并把断言改为 hook 次数不增加、重试后投影/执行就绪。第二轮 2/2，最后收窄 adapter 导入后重建再次 2/2。新增 HF04 的完整手机/远端 UI 场景未实跑，不把 CLI 两种投递模式的验证等同于真机验收。

## 冷进程对比

同一 Electron 44.7.0 内置 Node、同一隔离 SQLite，150 messages / 75 turns / 225 projected rows，首屏窗口 60 行，关闭 compile cache。旧/新各 3 次交替启动，第一份历史 snapshot 到达后关闭进程；不执行模型请求，不读取真实用户数据。

| 版本   | 三次历史首帧耗时（ms） | 中位数 |
| ------ | ---------------------- | ------ |
| 基线   | 975 / 803 / 794        | 803 ms |
| 修改后 | 751 / 762 / 747        | 751 ms |

观察到中位数减少 52 ms，约 6.5%；样本少，不作为所有历史的固定收益。这里测的是**进程启动至协议历史首帧**，不含 React 显示，不与上述真实 dev 点击样本混算。历史物化两组均约 15–16 ms；修改后仍有约 0.7 秒代码/协议冷启动，不能宣称已消除白屏。

- 旧 bundle SHA-256：`6e08b517ed2d0af5c603ac4b700fd5ed861c1acab7ae86d65ead0f17686c8ec4`。
- 新 bundle SHA-256：`dd36a181a17491728237fb1f17b0ac4b8f4cea373c40dbf762a617c6c95d3cb3`。
- 临时采样数据：`/tmp/ncode-history-bench-results.json`。不把测量探针加入产品。

## Dev 与限制

已重建并重启正常数据的 dev；原 Electron PID 40452 已退出，新 PID 35804，Vite 5174、CDP 9229。CLI dist 与 Desktop staged bundle 均与上述新 hash 一致。
新 dev 打开一条 528 行历史：live，runtime ready；Host 前置 2 ms、历史准备 164 ms、CLI 请求 167 ms，ACK 不再带订阅前 Provider 同步耗时。该单次读数不作为冷启动前后对比。

未运行 Windows/Linux、真实 SSH/手机或完整页面矩阵。macOS 正式安装包构建与只读产物审计在下述收尾阶段补齐，不等于实际安装或签名验收。

## 收尾复验

- 用户以“都做完”授权提交、版本快照同步与推送。`dc125ab1` 提交后在干净工作区完整运行 `ZCODE_AFFECTED_TEST_BASE=a60ba6a7e5a06742270ca605f5d2cc2766afa7e1 pnpm verify:pre-push`，通过；engineering affected 选中 159/159 后按合同跳过，未执行整套。
- 收尾重新运行根 typecheck、CLI typecheck（32/32）、根 lint（0 errors / 69 warnings）、CLI lint（0 errors / 84 warnings / 7 项原样上游行数诊断）、关闭项与 E2E 基线定向回归（58/58）、manifest 回归（4/4）和锚点预检（48/48），均通过。
- CLI 六文件补跑首轮为 228 通过 / 5 失败：当时与正式构建前的插件产物重建并行，`prepare-agent-node-bundle.mjs` 会删除并重建插件 dist，失败均为 PDF/Spreadsheets 产物的 ENOENT。停止交叉重建后，未修改源码或放宽断言，完整复跑 6 文件 233/233 通过。最终发布不并行重建这些产物与读取它们的测试。
- production 身份 macOS arm64 DMG/ZIP 已生成，`.app` 审计 25/25 通过，包内 buildCommitId 为 `dc125ab1`；体积与限制见 [3.17.1 收尾记录](ncode-upstream-3.17.1-2026-10-30.md#macos-arm64-正式产物补验)。本机安装的更新 skill 与仓库副本已逐字节同步。
- 发布规则：`ncode` 与 `ncode-v3.17.1-a60ba6a7` 指向同一最终 tip，旧版本分支保留；收尾文档提交后仍须通过干净工作区门禁，推送使用显式 lease 并核对远端引用。不用前一阶段通过结果代替最终推送门禁。
