## 核心原则

- 本仓库基于 ZCode 开发，仅用于个人学习与开发；不代表官方 ZCode 或 Z.ai，也不得在新功能、文档或示例中暗示官方背书。
- 本项目持续推进“去 Z.ai 化”：新增或修改功能时，优先识别并移除、隔离或替换对官方品牌、服务端点、账号体系、域名、遥测、远程配置、更新下载和默认产品配置的绑定；保留通用能力，避免无明确替代方案时直接破坏本地开发流程。
- `CHANGELOG.md` 在 commit 完成后更新；每条记录用中文说明本次修改内容，并写入最终 commit hash，面向人阅读，不展开逐文件清单、验收步骤或并行任务细节。
- 官方更新不得直接通过 `merge`、`rebase` 或 `cherry-pick` 合入本分支；只允许获取官方提交作为参考，由 AI 阅读 commit、diff、测试和当前源码后，在本仓库中重新实现需要的行为，并保留本项目的去官方绑定边界。
- 新增或修改行为前，先更新对应 spec；目录不存在时按需创建。先明确产品规则、状态所有者、接口和验收场景，再实现代码。
- 以当前检出的源码、`package.json` 和架构策略为准。说明中只保留当前仓库提供的功能、命令和文件；删除功能时同步清理指令和技能中的引用。
- 定位问题时，未明确要求修改代码就先调查原因。结合源码、日志和运行时证据，区分已确认原因与待验证假设。
- 保留与任务无关的本地改动，不自行恢复已移除的模块或内部依赖。

## 改动规则

- 开始任务前先检查当前分支、`git status --short` 和工作区基线；保留与当前任务无关的本地改动，不覆盖、不回滚、不代替用户清理。
- 只修改用户明确授权的范围。发现需要扩大范围、改变产品方向或删除现有能力时，先说明影响并与用户确认。
- `apps/zcode-cli` 默认视为稳定边界：除非用户明确点名要求，否则不修改其中的命令、登录流程、运行时和文案；去官方化优先在 Desktop、Web、UI、Services 和 Provider Runtime 处理。
- 行为、协议、状态、时序或接口改动：先更新对应 spec，再实现、补测试并记录验收场景。
- 配置、依赖、构建、品牌和文档改动：同步更新受影响的说明、锁文件或生成文件；commit 完成后再更新根目录 `CHANGELOG.md`。
- 删除或替换功能前先搜索所有引用；同时清理文档、脚本、测试、技能和配置中的失效引用，不留下“看起来还能用”的旧入口。
- 生成文件只通过仓库已有脚本生成；不要手工修改构建产物、锁文件生成区或许可证清单来掩盖校验失败。
- 每次改动完成后只报告实际执行过的检查；检查失败、已有失败和未执行项目必须明确写出，不得把 warning 或失败写成通过。

## Commit 规则

- 默认只修改工作区，不按每次文件改动或工具调用自动创建 commit；`git commit`、`git push`、创建 PR 或发布都必须得到用户明确要求。
- 当前项目默认在 `dev` 分支提交；除非用户明确指定，不直接向 `main` 或官方分支提交。
- commit 以一个完整 feature、bugfix、refactor 或 docs 任务为单位；同一 feature 的代码、spec、测试和文档放在同一个 commit，无关 feature 分开提交，不按文件或零碎改动拆分。
- 提交前使用 `git status --short`、`git diff --check` 和 `git diff --cached` 检查范围；使用明确文件路径暂存，不使用 `git add -A` 把无关改动一并加入。
- 提交必须同时包含对应的 spec、测试和文档改动（适用时）；`CHANGELOG.md` 在 commit 完成后补写中文修改摘要和 commit hash。如果验证未通过，除非用户明确接受并要求提交，否则不提交。
- commit message 使用简洁的 Conventional Commits 风格：`type(scope): summary`。允许的 type 包括 `feat`、`fix`、`refactor`、`build`、`docs`、`test` 和 `chore`；例如 `build(node): keep Node 24 runtime baseline`。
- 不擅自执行 `reset --hard`、`checkout --`、历史重写、`commit --amend` 或强制推送；需要这些操作时必须得到用户明确指令。
- 提交完成后报告 commit hash、实际包含的文件范围和验证结果；不默认 push，官方更新仍按“阅读 commit/diff 后由 AI 重新适配”的规则处理。

## 命令与仓库结构

开工前运行 `node scripts/check-workspace-freshness.mjs` 检查基线。Node 版本以 `mise.toml` 为准。

以下命令从仓库根目录执行：

| 用途             | 命令                                      |
| ---------------- | ----------------------------------------- |
| 类型检查         | `pnpm typecheck`                          |
| Lint             | `pnpm lint` / `pnpm lint:fix`             |
| 格式检查         | `pnpm fmt:check`                          |
| 桌面开发         | `pnpm dev:desktop`                        |
| Web 开发         | `pnpm dev:web`                            |
| 提交前检查       | `pnpm verify:pre-push`（Lint 与架构检查） |
| 架构检查         | `pnpm architecture:check --changed`       |
| 模块阅读包       | `pnpm architecture:context <module-id>`   |
| 未使用依赖与导出 | `pnpm knip`                               |
| 导出引用查询     | `pnpm dep:refs --list-exports <file>`     |

测试入口以目标包当前的 `package.json` 和实际测试文件为准，不假定存在统一的单测或 E2E 命令。

- `packages/desktop`：Electron main、host、renderer。
- `packages/web`、`packages/server`：Web 客户端与服务端。
- `packages/ui`：共享 React 组件、hooks 与 Zustand store。
- `packages/services`：业务服务；`packages/rpc`：RPC 框架。
- `packages/shared`：共享协议与类型；`packages/client`：Agent 客户端 SDK。
- `apps/zcode-cli`：Agent CLI 与运行时。
- `CONTEXT.md`：插件商店领域词汇；修改相关 UI 前阅读。
- `DESIGN.md`：UI 设计规范；修改 UI 前阅读。

## 实现与验证

- 代码改动使用 `.agents/skills/architecture-governance/SKILL.md`，先运行架构检查，再读取目标模块的受控上下文。
- 避免重复状态和多条写入路径。明确唯一所有者、接口、依赖方向、事件顺序与幂等边界，不能用超时掩盖同步问题。
- 有行为改动时先补充对应测试；交互改动需要 E2E 场景。检查测试与实现是否一致，并实际执行可用的验证。未执行或环境受限时如实说明。
- 修复 bug 时用中文注释说明原因和修复依据。发现设计缺陷时先与用户对齐，不不断增加兜底分支。
- 涉及状态、时序、远端或异步同步的方案，用图展示所有者及事件顺序。
- 必须执行 `pnpm typecheck` 和 `pnpm lint`，报告真实结果，不将已有失败写成通过。
- 使用异步文件和网络 IO；跨包导入使用公开入口，遵守现有路径别名。
- 禁止 UI 直接调用 Repo、Service 引用 Runtime 具体实现、跨域导入实现细节及循环依赖。

## UI 与平台边界

- 遵守 `DESIGN.md`，复用已有组件，兼顾桌面与手机 Web 的布局、交互、主题和国际化。
- 组件通过 `packages/ui/src/hooks/` 访问服务；平台操作通过 `IPlatformService`（`packages/shared/src/platform.ts`），不直接调用 `window.zcode`。
- 通过依赖注入处理 Desktop、Web、本地和远程环境的差异，并兼顾 Windows、macOS 和 Linux。
- Zustand 状态位于 `packages/ui/src/store/`。广播同步的主题、语言等字段需要防止回环；UI 局部状态不应被误当作服务端事实。
- hooks 中含 JSX 的文件使用 `.tsx`。

## 进程、协议与远程控制

- Desktop app 通过 stdio 与 Agent 通信。协议改动同步更新 `packages/shared/src/zcode-protocol/index.ts`，提供严格类型与运行时校验。
- Main 负责窗口、原生操作、进程调度和消息转发，不承载 task/session 业务状态。
- 每个窗口使用一个 window-scoped Local Host；本地 workspace 共享该 Host。远程 workspace 由窗口内的连接注册表管理，不另建 Desktop Remote Host。
- 手机远控连接桌面已有 Host attachment，复用会话运行时；不为手机另起 Agent、Local Host 或远程会话。
- Desktop 的 `desktop-continuous` 实时链路与手机的 `web-remote-replayable` 恢复链路必须明确区分。修改 stream、snapshot、queue 或重连时，同时验证两种语义。
- 外部 relay 与 Main 只做鉴权、配对、心跳、转发及 attachment 调度，不保存任务队列、快照等业务状态。
- 已接受的 busy/running 输入由 CLI/runtime `CommandInbox` 串行 admission；Renderer 只保留未提交草稿与 pending optimistic overlay，Host owner/lease 负责路由。
- 保留 owner/lease、跨 Host 路由和 stale run 防护，不能仅根据单一路径删除边界判断。

## Workspace Identity

- `workspaceIdentity` 用于身份隔离，`workspacePath` 用于文件操作、命令 cwd、Git 和路径展示。
- 身份 key 统一为 `workspaceIdentity?.trim() || workspacePath`，适用于去重、绑定、缓存、队列、持久化和请求关联。
- 远程链路贯穿传递 `workspaceIdentity` 与 `remoteSessionId`，不得仅按路径匹配。
- 新接口保留本地路径 fallback；远程 identity 复用现有构造和解析工具，不在业务代码中手写格式。

## 日志

- UI 使用 `packages/ui/src/logger.ts`，不直接使用 `console.log` 或 `window.zcode?.log`。
- Agent/session/runtime 相关服务日志使用 `createServiceLogger(scope)`（`packages/services/src/logger/serviceLogger.ts`）。
- `debug` 用于协议原始数据、流式 chunk 和逐条工具更新等高频诊断，生产环境不落盘。
- `info` 用于进程和会话生命周期、权限结果、一次性初始化等生产可用事件。
- `warn` 用于可恢复异常；`error` 用于崩溃、握手失败、鉴权丢失等不可恢复错误。
- 不在日志、示例或提交中写入凭据、真实用户数据和内部服务地址。

## 官方更新适配

- 使用 `git fetch` 获取官方对象和提交记录，但不把官方分支合入当前分支。
- 先阅读目标 commit 的上下文、相关 diff、测试和依赖提交，提炼产品行为、接口变化、边界条件和需要保留的本地差异。
- 再在当前源码上实现适配；官方代码是参考，不是可直接套用的补丁。不得为了减少冲突而覆盖本地去 Z.ai 化改动。
- 适配完成后执行与改动范围匹配的测试、类型检查、Lint 和格式检查；commit 完成后再在 `CHANGELOG.md` 记录官方来源、中文修改摘要和 commit hash。
