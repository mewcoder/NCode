# NCode：ZCode v3.15.1 选择性适配

## 源码范围与边界

- 来源：`zai-org/ZCode`，`29628c9`（v3.14.3）→ `aac4755`（v3.15.1）。
- 手动迁移现有能力的兼容与稳定性变化，不合并、rebase 或 cherry-pick。
- 保留 API Key、自定义 Provider、通用 MCP OAuth、官方插件市场，以及 SSH/WSL/Docker 的 identity、Host 路由与恢复链路。
- 不恢复官方账号、套餐、高速卡、营销、分享、反馈、Off-Peak 或手机远控。
- 本轮在已适配的稳定性修复之外，接入插件 UI/GenUI、Bot 群会话协作、输出风格和工作流运行时语义；独立 Server 保留底层协议与 Host 适配，但连接方式选择页不开放新入口。
- 不迁入上游开发文档站、测试基础设施、生成产物和纯格式/测试导出变化；不覆盖 NCode 已更新的模型目录。
- 保留本轮适配开工前已存在于工作区、尚未提交的 `useV4SessionQuotaBanner.ts` 改动；它独立于本轮上游适配。新增工作流能力仍遵守 NCode 对动态 `CreateWorkflow` 的确认要求；Server 连接不得改变 SSH/WSL/Docker 的 identity、Host 路由与恢复语义。无需运行模型或真实远程任务。

## 所有者与不变量

1. Provider 同步：Source 读取 Personal 配置与 OAuth allowlist；Target 持文件锁接纳 `syncId`，写正式配置并记录结果。保留 NCode 的 CAS 回滚防护。v2 不转发账号请求期 API Key，v1 仅作旧协议兼容。新增阶段错误码同步到共享 schema；成功结果不携带错误码。
2. Agent：Stdio transport 单独拥有未完成帧，按换行合并分片，结束时只刷新一次 UTF-8 decoder。Protocol client 拥有 pending 请求，关闭时统一拒绝；增加 rejection observation 不改变调用者收到的错误。进程清理失败始终被观察，静默关闭只抑制日志。
3. 文件搜索：忽略规则由已有文件或运行时模板派生，普通搜索不自动创建 `.zcodeignore`；只有用户的编辑、同步和恢复命令写入文件。
4. 会话：共享类型和运行时枚举接受上游新增权限模式并保留旧值；现有 Task adapter 保留 `guarded` 映射。无静态引用的 `sessionModeOptions.ts` 恢复至开工基线，不扩写或删除历史模块。Timeline 拥有虚拟行测高和吸底状态，窗口/侧栏尺寸变化时同步提交测高结果后吸底，用户上滚意图优先；保留既有滚动记忆和无动画的会话切换。跳过上游没有调用链的滚动记忆迁移助手。
5. Subagent：现有服务写队列统一串行化 CRUD 和开关/模型覆盖，读取错误不伪装成空配置。保留普通用户目录与插件目录的递归扫描，匹配当前 CLI `bootstrap/src/subagents.ts` 的加载规则；跳过依赖上游新 runtime config cache 的扫描深度变化。
6. 工作流：默认并发是起点，用户并发界可以高于或低于默认值；引擎 scheduler、seat gate、governor 与投影同步。run 启动时冻结 actor 模型绑定和权限模式，恢复从 journal 读取。holes、fills、streams 和产物分页贯通运行、存储与 UI；CreateWorkflow 仍强制审批，确认窗调整应用到真实入参。显式关闭优先于 workspace 缓存。保留 NCode 现有工作流设置入口，不增加第二个用户开关。
7. 工具展示：失败的原始文本输出作为错误展示；AskUserQuestion 兼容 Claude 文本答案格式，仍由既有读函数派生 UI。

## Review 修复

- `guarded` 同步到入站 Session schema、模式投影、Submission 和旧配置适配器使用的模式切换 command schema，已有远端会话读取/恢复/续发均保留真实权限模式。固定本地模式目录保持不变；Composer 仅在当前草稿已为 `guarded` 时展示该模式，避免对旧本地 CLI 宣称新能力。
- AskUserQuestion 的单一读取函数先识别 `answered` / `answered_custom` 输出，再解析 Claude 文本容器；自由文本中的 `"mode"="fast"` 等内容保持原样并映射到原问题。递归读取使用同一原始问题上下文。
- 明确类型解析失败时继续读取结构化 `answers` 与嵌套结果，但不把该记录的 `text` 再当作 Claude 格式解析。`guarded` 使用中英文消息映射，菜单能力边界保持不变。
- 旧远端返回 `unsupported` 且没有合法阶段码时，使用 `capability-unavailable`，与本地能力缺失的诊断一致；真实失败仍使用 `target-apply-failed`。
- `guarded` 作为已有远端会话的兼容态，沿用默认颜色，仅保留 `yolo` 的风险着色。`session-unavailable` / `host-execution-failed` 保留在上游共享错误码枚举中，供远端合法诊断透传；本轮未迁入它们的本地产生点。

## 验证

- `pnpm typecheck`、`pnpm lint`、`pnpm architecture:check --changed` 与 `git diff --check`。
- 格式检查限定本轮修改文件；`zh-CN.ts` 只新增消息，保留其既有格式问题，它同时属于改动文件和全仓格式失败文件，不能用集合无交集证明问题来源。全仓 `pnpm fmt:check` 仍失败，数量取决于检查时的工作区，不宣称全仓格式通过。
- 不新增或运行测试。静态检查不能证明完整 GUI、真实 SSH/WSL/Docker 或打包后的运行行为。
- 不提交、不 push、不创建 PR。

## 新能力接入与复核

- 独立 Server：保留上游类型、共享校验、专用 connector、Host 服务归属、凭据恢复及 Bot 反向资源通道；按产品定位不在连接方式选择页开放入口。显示名不参与 identity，规范 endpoint 保留 basePath，authority 无损编码避免同名或字符替换碰撞。SSH/WSL/Docker identity 规则不变。
- MCP App：工具 metadata/插件面板清单、资源读取与订阅、连接代际、sampling、页面工具和模型登记工具完整接入。审批复用原工具链，审批后再次验证连接身份；取消、关闭和失效释放调用及资源。Main 持有沙箱，preload 只暴露窄端口。
- GenUI：Host 输出目录、模型上下文、Visualize 技能及构建资源、正文与侧栏接入；保留 NCode 无布局动画的会话切换。插件图片进入既有附件上传与移交链；来源与上下文随持久输入恢复。
- Bots：恢复第三方渠道与群会话服务，独立设置入口保留 workspace identity；群来源、话题材料、准备状态、中断、投递重试与成员名接入 Timeline。Main 处理远程状态、重连和 runtime port；HTTP Webhook 与 stdio/Server 资源 relay 接入。重连失败不遗留未观察 rejection。
- 输出风格：按上游真实范围恢复服务、RPC 注册和 `.claude` 文件管理。上游本身没有 UI 消费者或 Bootstrap 模型上下文接线，本轮不将其表述成新的模型运行时能力。
- 三个只读 subagent 分别复核 UI、协议/远程与 CLI 运行链，确认上述修复；未让 review agent 编辑共享工作区。
- 提交边界：将开工时已有的 26 个暂存修复与本轮上游适配、README 和本 spec 汇总为一个 `sync(upstream)` 提交。quota banner、review 文档和 `.workbuddy` 工作日志属于独立内容，不纳入该提交。当前只整理暂存区，尚未提交或 push。

## 检查记录

- 根 `pnpm typecheck`、CLI Bootstrap（含 core/adapters/contracts/workflow）的编译、根 lint 与 architecture 检查按最终状态重跑。
- 桌面 tsup（Main/Host/Preload/Scheduler/沙箱 alias）及 Vite renderer 构建检查覆盖新入口和资源拷贝。
- 额外直接全量 Desktop TypeScript 检查未通过：既有 main rootDir/DOM、浏览器接口及 renderer Window 全局声明问题仍在；不以打包通过替代该检查。额外绕过忽略规则的 CLI lint 扫描暴露 legacy 大文件上限等问题，根仓库配置的 lint 结果单独报告。
- 不新增或运行测试，未进行 GUI、真实 Bot 渠道、模型任务或真实远程连接验证。

### 最终遗漏复核补齐

- Bot 定时任务回推由当前 turn 注入可信目标，automation repo 单独持久化；Host 在发送 prompt 前订阅终态，避免快速完成漏回推。目标不进入展示模型，脏历史目标按未配置处理。
- Server renderer 使用独立服务集合，保持 Server 对 settings/runtime/provider 的单一所有权。
- 设置初始化、本窗口更新与跨窗口广播同步后台 Bot runtime 的运行时偏好。
- GenUI 文档读取透传 SSH/Server executor 服务；状态及 sandbox 继续由桌面 base service 管理。
- 编辑、重试与分叉 admission 保留群来源、引用及输入 source；projection 的实时/队列 canonical edit target 一并提供这些字段，显式空引用数组保持清空语义。
- 本轮补齐后的 CLI typecheck（27/27）、lint（0 error / 68 warning）、架构检查（0 violation）、桌面及 renderer 构建、diff/freshness 检查通过。GUI、实际 Bot 回推及真实远程联调未验证。
- 主仓库 `pnpm typecheck` 在最终补丁状态通过；subagent 对 cold restore → canonical target → edit/retry 的实际赋值链复核通过。暂存区完成单一提交范围整理，未执行 commit/push。

### 本轮复核修复

- `guarded` 可作为既有会话的运行时读值，但仍不进入 CLI 可选择的权限模式目录；TUI 类型应能准确表示该读值。
- Webhook 回调在任何业务处理前验证启用中的 Bot、密钥引用、已读取的非空密钥和配置的入站请求头；任何缺失或不匹配都拒绝。配置的 `webhookAuthHeaderName` 同时用于入站与出站；入站消息处理与 HTTP callback handlers 均从通用 RPC 视图隐藏（Server WebSocket、Server CLI Core WebSocket、Desktop Host MessagePort 和 stdio），避免调用方伪造消息或请求头绕过鉴权。
- Output-style 服务仍保留上游能力；自定义 style 文件名和更新/删除 ID 必须是单一安全文件名，并限制在 styles 目录内，内置 style 不可由自定义写接口覆盖。读取目录路径不再隐式创建目录。
- 畸形的已保存 Server URL 只跳过对应远程标签恢复，不中断其他 SSH/WSL/Docker 或 Server 标签。Server fallback endpoint identity 复用同一规范化器；连接表单拒绝 URL userinfo，认证继续使用 token 字段。
- 保留上游动态工作流并发语义：默认值是起点、provider 级 429 治理负责反馈；AmendWorkflow 的并发设置不打开脚本确认窗，不恢复 NCode 旧的 CPU 硬顶。
- GenUI 声明的外部资源域名和本地打包的 Visualize 默认启用行为保留，作为已确认接入上游能力的一部分。
- 全仓确认的四个通用 RPC 暴露点共用 Bot 内部方法过滤视图；最终补丁后主仓 typecheck、lint（0 error / 68 warning）、架构检查、受影响文件格式检查均通过。实际 GUI、Bot HTTP 回调和远端 RPC 联调未执行。

### 漏搬接线补齐（对照 `aac4755` 复核）

- 插件沙箱 guest 接线补回：`desktopWindowChrome.ts` 的 `will-attach-webview` 增加 `isPluginSandboxSrc` 独立分支，委派 `configureGuest` 做 sandboxId / partition / owner 三重校验与 webPreferences 硬化，decision 非 ok 即 `preventDefault`；`did-attach-webview` 从同一队列取身份调 `attachGuest`。该分支不走内嵌浏览器的 preload 替换、`allowpopups` 与协议白名单——白名单不含 `zcode-sandbox:`，此前沙箱 webview 一律被拦，MCP App / GenUI 面板不可达且 guest 硬化全不执行。pending 队列由布尔改为可辨识联合，保持 will/did 成对。
- 插件 UI 资源通知改用 `delta.pluginId` 建键，与登记侧同一命名空间。`serverName` 是 MCP server 名（`plugin:<name>:<server>`），此前查表永不命中，`resources/updated` 等静默丢失。此项属上游缺陷的本地修复，下次 sync 需注意分歧点。
- 权限服务的 owner 免确认规则接上 `FillWorkflowHole`：`isOwnedWorkflowAmend` 按工具名分派到 `isAmendWorkflowOwnedPredecessor(input.predecessor)` / `isFillWorkflowHoleOwnedRun(input.hole)`，兑现 handler `alwaysAsk` 注释的承诺；此前每次留白补全都弹确认。
- 补齐 `chat.message.sentByScheduledTask` 与 `chat.topicPreparation.{preparing,waitingStop,failed}` 的 en-US / zh-CN 文案（上游另有 `retry` 键，两边都无消费者，不迁）；此前界面回退显示原始 message id。
- 撤回前一轮 review 的两条误报：`resolveDynamicWorkflowClientConfig` 的 `userMode` 无生产点、策略同步不发 `mode`。NCode 的工作流设置入口只有布尔开关，`useDynamicWorkflowAvailability` 直接合成 `alwaysOn` / `disabled`，CLI 侧 `resolveDynamicWorkflowRuntimeGate` 在 mode 缺席时回落 `alwaysOn`，Host / UI / CLI 三处一致，不存在 `onDemand` 被静默降级；Host 也未接入 `/client/configs` 的灰度读取。`applyDynamicWorkflowUserMode` 保持与上游同形，减少下次 sync 冲突。

### guarded 危险命令单次确认（以上游为准补齐）

- 迁入 `core/src/tool/handlers/guarded/`（8 个文件：命令文法分析、rm / rsync / git / find / Windows 删除规则表、`env`/`sudo`/`time` 剥壳）。`bash-command-parser.ts` 同步为上游版本——新增 `words: CommandWord[]` 与 `time` 关键字还原；已用 diff 确认 NCode 原文件是上游的严格子集（零独有行），不丢本地改动。
- 生产点：`bash.ts` 在 `mode === "guarded"` 时按 session shell dialect 匹配（selection 缺失退回 posix，不静默退回 YOLO），命中则产出 `userApprovalRule`；`permission/service.ts` 补 capability 字段、guarded 危险命令的 `ask` + `approvalMode: "user-once"`，并把 guarded 并入 YOLO 基底放行分支。Plan 仍优先于 guarded，`alwaysAsk`（CreateWorkflow / AmendWorkflow / SaveWorkflow）仍不被模式分支绕过。
- `call-runner.ts` 补上游的 preparedContext：guarded 下用 `snapshotPermissionInput` 冻结 input、并固定 cwd 快照，审批与执行读同一份；`bashShellSelection` 上移到判权之前，消掉内层重复声明。
- 传播链：`executor/events.ts`（含 user-once 时不声明 `fullAccessSupported`）、`contracts/session.port.ts`、`event-reducer.ts`、`bootstrap/permission-options.ts`（user-once 只留 allow_once / deny）、`session-mapper.ts`、`interaction-broker.ts`（user-once 不提供 fullAccess）、`zcode-protocol-v4/product-projection.ts`、`tui/app-approval.ts` 与 `app-approval-panel.tsx`。已按 `approvalMode` / `userApprovalRule` / `matchDangerousCommand` / `guardedWorkingDirectory` / `snapshotPermissionInput` / `decisionsForApproval` 六个符号做穷举对照，与上游非测试站点齐平（仅剩换行差异）。
- NCode 适配点：guarded 仍不进入本地可选模式目录（`sessionModeOptions.ts` 未改），只有恢复的旧会话或远端 CLI 传来的 guarded 会触发这条链。
- 共享 schema：`zcodePermissionRequestedEventPayloadSchema` 增加 optional `approvalMode`，与上游同形。旧桌面遇该字段会 strict 解析失败——上游同样的取舍，仅在「旧桌面 + 新远端 CLI + guarded 会话」同时成立时才可能触发。
- `unsupported` 语义按上游保留：解释器包装（`bash -c` / `python` / `eval` 等）与超 10k 字符命令返回 `unsupported`，而 `bash.ts` 只对 `matched` 产出 `userApprovalRule`，因此这类命令在 guarded 下走 YOLO 基底放行。这是上游有测试断言的既定设计，本轮未在本地收紧。
- 上游另有 7 个 guarded 测试文件与 `guarded-deletion-oracle.mjs` fixture，按「不迁入测试基础设施」未搬。本轮改以一次性 tsx 冒烟脚本验证：matcher 6 项、capability 3 项、权限服务 7 项、选项与 TUI 决策集 4 项，共 22 项断言全通过后删除脚本。matcher 属安全相关逻辑，长期缺回归覆盖是已知风险。
