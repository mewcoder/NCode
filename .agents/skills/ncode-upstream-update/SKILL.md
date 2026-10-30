---
name: ncode-upstream-update
description: 更新 NCode 的 ZCode 上游源码，每个版本使用独立干净分支，按 ncode-feature.md 适配、按特性提交并验证。用于用户要求更新上游或重新适配 NCode；普通功能修改不需要完整更新流程。
---

# NCode 上游更新

## 唯一需求来源

先读取目标仓库的 `AGENTS.md`，再读取 `ncode` 分支的最新 `ncode-feature.md`。默认仓库为 `/Users/mew/code/ZCode`；用户指定仓库或工作区时以用户为准。

**分支策略（2026-10-24 收敛）**：仓库只保留 `main`、`ncode` 与各 `ncode-v<版本号>` 版本分支；临时、备份与 `codex/` 前缀分支在版本验收后清理。`main` 专用于**同步官方上游源码**（每版随上游重置，不放 NCode 改动）；远端默认分支为 `ncode`。`ncode` 是最新已验收快照：每版验收完成后**覆盖式**指向该版 `ncode-v<版本号>` 的 tip（`git branch -f ncode ncode-v<版本号>`），不产生合并提交、不保留旧 `ncode` 上的提交——更新流程永远从官方源码建新分支，`ncode` 不承担合并基线职责，版本间大改动做真合并只会制造无意义冲突。其 tip 始终拥有最新的 `ncode-feature.md`、本 skill 与源码，下一版更新以它为需求与流程来源。旧版本分支（如 `ncode-v3.15.1`）保留，专用于更新工作流演练与版本间 diff，不参与日常开发。需求或流程调整先在当前版本分支完成，随验收以覆盖式进入 `ncode`；本机安装的 skill 是副本，随版本同步。

可用 `git show ncode:<文件路径>` 读取已提交原版；若 `ncode` 的工作区存在未提交修改，读取实际文件并保留这些修改。通过 `git worktree list` 定位已有工作区，必要时使用独立 worktree，避免切换或覆盖带改动的版本工作区。

`ncode-feature.md` 统一保存关闭项、定制项、国际化目标和页面验收。Skill 只规定更新流程，不另存功能清单，不根据旧分支新增关闭项。用户修改需求时，同步更新这份清单的相关条目。

后续 NCode 版本更新统一使用本 skill；版本分支保存该版实现，特性提交供下一版查阅。普通修复仍遵循对应模块的开发流程。

## 教训登记表（三轮实测沉淀，2026-10-24）

每条教训都来自真实事故现场（有当时的工作区/门禁输出为证），非理论推演。遇到同类症状先查本表；新教训按同格式追加。

| #   | 症状                                                              | 根因                                                                           | 修复与防范                                                                                                                                  | 实证                                     |
| --- | ----------------------------------------------------------------- | ------------------------------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------- |
| 1   | manifest 清单与实际文件漂移未被 CLI 发现                          | 最初只有 vitest 测试做双向校验，无 CLI 入口                                    | manifest 增加双向校验测试；后续补 CLI                                                                                                       | 3.15.1 首轮演练                          |
| 2   | impact 工具在无 policy.js 的老树直接崩溃                          | 动态 import policy 无守卫                                                      | 缺失时报差距项并继续；回归测试覆盖                                                                                                          | 3.14.3/3.15.1 老树实测                   |
| 3   | 锚点在旧版本树报大量假差距（37 锚点 31 FAIL）                     | registry 锚点钉新版文件布局，未考虑「机制尚未引入」                            | 锚点新增 `upstreamIntroducedIn`（文件级）与 `requiresPattern`（机制级前置条件）                                                             | 3.14.3：无 Highspeed、无启动重连批次     |
| 4   | CLI `--check` 与 vitest 检查面不一致                              | script 条目检查只写在测试里                                                    | CLI 与测试同检查面（文件/目录/script 条目/反向漂移）                                                                                        | 3.14.3 压测发现                          |
| 5   | `manifest --check` exit 0 假阳性                                  | 纯数据模块被 node 执行即 exit 0，**无 CLI 实现**                               | 实现真 CLI（失败 exit 1）；上线即在 3.15.1 抓到目录清单不符                                                                                 | 修复前 commit 无 process.argv            |
| 6   | 同步工具链后目标分支 `pnpm install` ENOENT；pnpm 裸 `--` 透传误判 | 整拷根 package.json（版本专属依赖/patch 引用）；脚本未兼容 `--`                | 只字段级同步 `ncode:*` script 条目；解析器跳过裸 `--`                                                                                       | 3.15.1 树缺 vitest patch 文件            |
| 7   | 嫁接 217 个测试文件到无测试体系的旧树                             | 官方 3.14.3 无 vitest/wdio 体系（仅 4 个孤立 .test.ts）                        | 移植前核实目标版本测试基建；无体系时删净嫁接测试、门禁降为 CLI 形态                                                                         | 官方 3.14.3 全树 .test. 文件 = 4         |
| 8   | 历史手术后 share 关闭静默回退 + 局部重放多次失败留下半重放状态    | 整文件 cp 到旧提交再重放后续提交（同文件 pick 静默失配）；失败 rebase 反复重试 | 禁止 cp+重放；改用 `--fixup` + `--autosquash`；**rebase 连续失败 2 次即停**，改「已知好 tip 硬重置 + 前向 cherry-pick」；手术后必 diff 审计 | forbid 锚点拦截 4 处真实构造（252a0a50） |

## 更新流程的自动化工具链

流程各阶段使用以下入口，数据登记与规则见 [closure spec](../../docs/ncode-closure-regression.spec.md) 与 [audit spec](../../docs/ncode-artifact-audit.spec.md)：

- `pnpm ncode:closure:impact --validate --ref <git-ref>`：对任意 ref（官方基线、上一版快照）重放全部关闭项锚点与策略值，产出按章节的差距清单，作为适配工作清单；不带 `--ref` 时校验当前工作区。
- `pnpm ncode:closure:impact --base <上一版快照 ref> [--head <ref>]`：把版本间 diff 映射到关闭项章节、E2E 基线、品牌资源与关键事实源，输出本版需要重点核对的关闭面。
- `pnpm test:engineering packages/desktop/test/ncode-closure-anchors.test.ts packages/desktop/test/ncode-e2e-baseline.test.ts`：3.17.1 的锚点与 E2E 基线属于工程门禁，登记在 `scripts/engineering-test-files.json`；上游移动/改名文件导致锚点失效时，沿当前调用链更新登记后重跑。旧版本按当版实际测试入口执行。
- `pnpm ncode:artifact:audit -- --app <产物路径>`：打包后审计关闭承诺（遥测依赖、端点、升级 feed、image-search、品牌、关键运行时依赖）。
- `pnpm ncode:upstream:check`：**上游新鲜度检查**。对比官方 main/tag 与本地 sync 基线，输出 CURRENT（无需动作）/ TAGGED（可更新，直接打印 port:plan 命令行）/ DRIFTED（main 领先未打 tag）。用户问"上游有新版本吗"先跑它；只读 ls-remote 无副作用。
- `pnpm ncode:port:plan -- --from <上一版分支> --target <官方 ref>`：**移植计划生成器**（2026-10-24 新增）。对上一版序列逐提交用 `git merge-tree` 模拟 cherry-pick 到目标官方树，输出每提交的冲突文件清单、目标树已漂移文件（需按意图移植）与新增文件（确认目标版本是否存在同名模块），全程无副作用。两轮实测校准基线：逐版本移植（3.16→3.15 结构）乐观冲突 ~63 文件次、跨版本（3.16→3.14）~162；输出显著偏离基线时先查 merge-base 解析再开工。**跳版本移植被 3.14.3 压测证伪（冲突 2.5 倍 + 3.15 新模块网状缺失），每次更新必须从上一个已验收版本分支的序列移植。**
- `node scripts/ncode-workflow-manifest.mjs --check`：工作流清单真实自检（文件/目录/script 条目/反向漂移，失败 exit 1）。此前该命令是假阳性（纯数据模块被 node 执行直接 exit 0），2026-10-24 修复；vitest 测试 `scripts/test/ncode-workflow-manifest.test.mjs` 与 CLI 同检查面，两者都跑。
- **测试处置登记表**：[docs/ncode-test-dispositions.md](../../docs/ncode-test-dispositions.md) 登记官方测试文件 ↔ 关闭项 ↔ 处置（删除/替换/改写）。移植时按表机械处置；遇到未登记且与关闭项冲突的官方测试，决策后回填本表。
- **测试体系存在性按版本核实（2026-10-24 第 7 发现，v3.14.3 实证）**：官方 3.14.3 完全没有 vitest/wdio 测试体系（仅 4 个孤立 .test.ts；整套 1900+ 测试为 3.15 引入）。移植前先核实目标版本测试基建：无体系时删净嫁接测试文件、验收门禁降为 CLI 形态（锚点 `--validate` CLI + node:test 工具测试 + typecheck/lint/architecture），"全量单测 N/A"是当版事实而非缺漏；有体系时才跑 vitest 全量。锚点 vitest 文件（ncode-closure-anchors.test.ts 等）在无体系版本不适用，锚点验收走 CLI。
- **同步边界（2026-10-24 第 6 缺陷实证）**：工具链在版本分支间同步时，根 `package.json` **只同步 `ncode:*` script 条目**（JSON 字段级合并），绝不整文件拷贝——它携带版本专属依赖、patchedDependencies 引用与版本号，整拷会让目标分支 `pnpm install` 直接 ENOENT（目标树 patches/ 没有对应补丁文件）。同理，在 worktree 里跑过 install/typecheck 后提交前检查 `config/provider/*.lock/` 等运行时产物未被 `git add -A` 卷入。pnpm 传参不需要 `--` 分隔符，且会把裸 `--` 原样透传给脚本——脚本侧已兼容，但新工具的 usage 守卫要按此约定测试两种形式。
- 锚点数据在 `packages/desktop/scripts/ncode-closure-registry.mjs`（单一事实源，锚点支持 `upstreamIntroducedIn`（上游新版新增的文件，旧树跳过）与 `requiresPattern`（机制级前置条件，机制引入后才校验）两个版本化条件），E2E 排除清单在 `packages/desktop/scripts/ncode-e2e-baseline.mjs`；新增或调整关闭项时随 ncode-feature.md 同步登记。

## 更新流程

### 1. 确认现状与目标

- 执行仓库 freshness 检查；分别检查 staged、unstaged、untracked、当前分支、HEAD 和 remotes。保留无关改动，不为更新自行 reset、clean 或覆盖文件。
- 确认官方来源 `https://github.com/zai-org/ZCode`。`origin` 可能指向 NCode，不能把 NCode 的最新提交当作官方最新源码。
- 用户指定 tag、版本或 commit 时使用该目标；只说“最新”时查询并拉取官方默认分支，记录官方 URL、实际 tag/分支和 commit。freshness 通过只表示其检查的远端基线满足要求，不能代替核实官方目标。不要假定 remote 名称、默认分支名或本地缓存已是最新。
- 建分支前核对本地 `ncode` 与对应远端的差异，记录原版 skill、清单所在的 `ncode` commit，以及品牌资源的独立来源。原版 skill 或清单尚未提交时保留 `ncode` 工作区内容，不能只读取提交而丢失最新修改；版本分支快照不默认视为最新原版。

### 2. 从官方代码建立干净基线

- 每个上游版本使用独立的 `ncode-v<版本号>` 分支，例如 `ncode-v3.16.3`，不加 `codex/` 前缀。首次适配从已确认的官方目标创建；同版本的修复和定制继续使用该分支，旧版本分支保留供参考。只有用户明确要求从干净基线重做同版本适配时，才使用递增后缀，例如 `ncode-v3.16.3-r2`。用户明确指定名称时使用指定名称。
- 版本号从目标 tag 或目标提交的版本文件核实，不用 NCode 旧版本推测；若跟随的是尚未发布的官方默认分支，使用已核实版本号并附目标短 commit，以区分同版本下的源码快照。
- 在干净 checkout 或适合的隔离 worktree 中实施，避免把旧分支源码及无关工作区改动带入新基线；不删除原分支或改写历史。
- 从已核对的 `ncode` 分支原版带入**工作流文件全集**（新分支从官方源码建立，缺任何一项工具链都无法运行本流程）。全集以 `scripts/ncode-workflow-manifest.mjs` 为机器可校验清单（含需求流程、工具链、测试、spec、根 package.json 命令入口与 `packages/desktop/test/e2e/ncode/` E2E 目录），不在此另抄文件列表防止漂移；新增工作流文件时同步登记清单。`.agents/skills/ncode-upstream-update/` 只复制这个 NCode skill，保留新上游其他 skills 的实现。
- 复制后自检两步：`node scripts/ncode-workflow-manifest.mjs --check`（真实 CLI：文件/目录/script 条目/反向漂移，失败 exit 1）+ `node --test scripts/test/ncode-workflow-manifest.test.mjs`；`pnpm ncode:closure:impact --validate` 应全绿（对官方基线跑 `--ref` 预期全红，属正常差距清单，见第 3 节首步）。清单里目录/script 条目与目标树不符时（如旧版本没有 e2e fixtures 目录），按实际树裁剪清单并登记说明，不要为凑清单创建空目录。上游结构变化导致清单文件引用的路径失效时，先更新锚点登记再继续。
- **生成移植计划**：`pnpm ncode:port:plan -- --from <上一版分支> --target <官方 ref>`，输出逐提交冲突预判与需按意图移植的漂移文件清单，作为第 3 节的核对表。手写 rebase todo 已实测出过错（提交顺序写反、lockfile 重排冲突），顺序一律以工具输出为准。
- NCode 专属 E2E 场景统一放 `packages/desktop/test/e2e/ncode/`（命名 `ncode-*.test.ts`，manual-review 流程与其他领域一致）；覆盖被整份排除的 spec 中保留的行为（如 help 菜单）及关闭态断言（如零官方请求）。
- 版本源码基线仍是已确认的官方目标，工作流文件是唯一从 `ncode` 带入的内容；品牌资源按第 3 节从其独立来源提取。
- 上一版本的适配分支及其特性提交用于查阅实现、定位和回归依据；更早的 `ncode` 分支仍可用于查需求依据、交互和提取品牌资源。不要整批 cherry-pick 旧补丁，也不要复制旧版实现覆盖新上游结构。
- 后续明确要在本次适配分支继续工作时复用它，不重复创建分支。

### 3. 按清单适配当前结构

**移植方式与冲突处置（2026-10-24 两轮实证沉淀）**：把上一版序列提交逐个 `git cherry-pick` 到新版本分支——cherry-pick 是真 3-way（用提交 parent 树做 merge base），冲突以标准 `<<<<<<< HEAD / >>>>>>>` 标记落盘；`git apply -3` 在缺 index blob、pathspec 排除（zsh 不做变量分词，需 `${=VAR}`）等场景不可靠，不用。逐提交流程：cherry-pick → 按下述模式解决冲突 → `git cherry-pick --continue` → `git commit --amend` 恢复原提交消息。cherry-pick 过程中源文件若与序列 version 不符，以「3.14.3/3.15.1 官方两版本 diff ≤110 行 → 直接取上一版 NCode 同名文件（typecheck 兜底）；漂移大 → 取 ours 结构 + 按意图外科手术」判定。高频冲突处置模板：

- **locale**（`i18n/locales/*.ts`）：取 ours（当版键全集，防止 formatMessage 落 key 名），叠加品牌串 `ZCode→NCode` 与关键文案替换（如 `chat.error.noAvailableModel` 改 BYO key 表述）；不取 theirs（会带入未来版本的键）。
- **Provider 包裹层**（Root/App 的 MarketingTouchProvider、RewardsProvider、OccupationOnboarding、BotGroupDeliveryProvider 等）：取 ours 结构 + 正则摘除包裹标签保留子内容；同步删除对应 import。
- **登录/账户 handler**：删 `handleOpenLoginEntry`/`handleWelcomeScreenComplete`、shell 的 `onLogin` 透传；**props 契约保留**（`onLogin?: () => void` 留在中间层类型上，只有叶子组件不渲染入口），否则调用链连锁报错。
- **市场源**：以本版 `ncode-feature.md` 的“插件商店来源与分类”为准，核对默认来源、迁移与回退、自动补种和可删除边界；不照搬上游默认市场及不可删保护。
- **3.15+ 新模块依赖**（bots 装配导出、highspeed、cloudContent、desktop-telemetry 等）在更老树上不存在：相关关闭实现改为「恢复原版 + 仅补 policy import/门禁」，不要平移上一版文件。

- 建立基线后先跑 `pnpm ncode:closure:impact --validate --ref <官方基线 commit>`：产出全部关闭项的按章节差距清单，作为本版适配的工作清单；适配过程中可用不带 `--ref` 的工作区模式跟踪收敛进度（期望差距逐步降为 0）。再用 `--base <上一版快照 ref> --head <官方基线>` 输出上游版本间 diff 命中的关闭面，作为重点核对范围。
- 先检查新源码、当前 scripts、架构策略和相关测试，沿调用链定位每个清单项。清单路径是导航线索，文件移动后重新定位。
- 结合上一版本相对其官方基线的 diff，按特性查阅相关提交的说明、代码与测试，再核对新上游对应调用链。历史实现帮助缩小阅读范围；已由新上游满足的规则经验证后沿用，仍需适配的部分按当前结构实现。执行记录保留本次官方基线及参考的 NCode 分支/commit，便于下一版继续比较。
- 按仓库要求使用 architecture-governance，修改行为前更新清单中的规则和验收。需要记录所有者或异步事件顺序时写在清单相关条目，不创建平行需求文档。
- 优先核实现有 `enabled`、模式、注入参数及构建开关能否完整覆盖目标行为，能覆盖就复用；已有统一本地策略时只集中维护取值。没有开关或覆盖不全时，才在最窄入口/装配边界补控制。入口已阻止触发的功能保留上游实现；仍会自行运行的专属后台再停用初始化、订阅、请求或调度。不要增加远端配置、动态覆盖或新的运行时开关框架。
- 最小修改原则追溯本轮适配的全部提交：从官方基线之后第一笔 NCode 提交开始，逐特性比较原始适配、后续补漏和未提交 diff，不能只查最新提交。对能改为现有开关控制的旧改动评估收敛，结论写回清单；不因此自动恢复用户已移除的模块或依赖。
- 只改必要的调用参数、入口和专属副作用，不顺带做 hook/文件改名、格式重排或整套测试重写；保留有效回归，在原用例上局部适配。治理登记遵守实际架构要求，不以绕过规则减少 diff。
- 按清单逐项恢复品牌资源及其当前引用，核对浅色和深色显示；保留数据、协议及内部命名兼容性。
- 复用已确认来源分支的 `scripts/ncode-branding.mjs`（连同测试和 package.json 的两个命令入口）；在隔离适配分支执行 `pnpm ncode:branding:sync --source-ref <品牌来源 commit/ref>`，再执行 `pnpm ncode:branding:check --source-ref <同一来源>`。脚本只同步资源与现有内联 favicon，组件引用按当前结构适配；不复制旧组件，也不用旧 ref 覆盖来源工作区中尚未提交的资源。
- 成对适配中英文文案；检查隐藏入口后的默认选中、空态、加载和错误状态，不能仅隐藏菜单留下空白详情或永久加载。
- README 参考清单指定的旧版结构，命令、版本、链接与输出路径按当前仓库核对。
- 每个关闭项沿“入口 → 实际组件挂载 → hook/Provider → 服务装配 → 独立调用入口”核对。菜单不可见不代表组件停止查询；统一初始化关闭后仍需查手动 IPC、数据库报告、独立 CLI 和构建配置。具体检查点写回清单对应条目。
- 本地 Main 的关闭判断不能代表远端 Server 或独立 CLI 已关闭；逐进程核对状态文件、设备身份、定时器和网络出口。关闭态回归使用实际策略/构建值；通用请求、协议校验和本地配置一致性仍要保留验证，必要时使用隔离的显式启用夹具，不能只把原有断言改成零调用。
- 新上游改变路径、所有者或测试契约时，更新清单的定位和验收；按当前调用链重新实施，不机械照搬旧路径或旧补丁。
- 适配清单中的市场来源时，对照源码目录与发布目录的差别，核对展示字段、相对资源路径和编译产物是否仍满足原消费链路；规则及验收只写回 `ncode-feature.md`，不把“目录可下载”等同于商店功能完整。

### 4. 静态与页面验证

- **3.17.1 测试体系**：App 业务单测已退役，不恢复旧补丁中的 App test/spec 或 `contract.test.ts`。工程静态锚点与 E2E 工具测试显式注册到 engineering 清单；CLI/CUA、浏览器与桌面 E2E 按当前各包入口验证。根 `test:unit` / `test:unit:affected` 不再存在，不从旧分支恢复。上游已实现的个性化统一复用 `ISettingService` 与 `settings/PersonalizationSection.tsx`，不恢复旧平行模块及读写接口。
- 国际化对称验收用 `pnpm ncode:locale:check`：NCode 相对官方基线新增/删除的 locale 键必须 en/zh 对称（上游自带键差不计入）；改过任一语言文件后必跑。
- 运行 `pnpm typecheck`、`pnpm lint`、`pnpm architecture:check --changed`，执行受影响测试；测试入口以当前 package.json 为准，不擅自跑全量套件。
- 关闭项回归跑锚点与 E2E 基线测试（见「更新流程的自动化工具链」）：锚点全绿表示关闭接线完整，E2E 基线漂移检测提示上游新增的同类 spec；`pnpm --filter @zcode/desktop test:e2e` 默认集合已排除登记的关闭项 spec。打包后执行 `pnpm ncode:artifact:audit -- --app <产物>` 并记录结果。
- 对行为变化同步维护相关测试：已关闭入口断言不出现、专属副作用断言不触发，保留共用能力的测试；测试夹具满足新版必填参数。不用跳过测试、批量删除失败断言或放松规则代替适配。旧账号/权益、隐藏选中项、旧工作流模式及远程重连值按清单覆盖。
- 根目录检查与 CLI 子包检查分别确认，根类型检查不能代替 CLI/Renderer 验证；构建配置变更运行脚本测试，品牌资源检查实际引用及第三方图标。命令和测试文件从当前源码定位，不固定上次测试数量。
- 已知陷阱（2026-10-24 实证）：`typecheck:e2e` 可能读取 `packages/*/dist` 下的**陈旧声明**而非源码——改了 services 源码但 e2e 类型仍报旧符号时，先跑根 `pnpm typecheck` 重建 dist 声明再排查；同理验证依赖包改动的链路时，先重建受影响包再跑下游检查。删除生产依赖后若 E2E spec 类型断链，优先为测试补公开入口或 devDependencies 类型（不回退关闭项）。
- CLI 改动做桌面验证前，确认实际启动参数和 Agent 产物路径，按当前构建链重新编译受影响依赖并重打包 Agent。只运行 typecheck、只打包 CLI 或只重启 Electron，可能仍引用旧的依赖 `dist`；确认最终运行包确实包含改动。
- 写入测试数据前分别核实桌面 profile、业务数据根、CLI storage 和插件目录的实际路径；桌面 profile 隔离不代表 CLI 插件数据隔离。优先使用隔离测试目录；若现有实例共享安装版数据，先说明影响范围，不把它当作完全隔离环境。
- 使用 `pnpm dev:desktop`，按 `ncode-feature.md` 的页面清单逐页审查。覆盖中英文、主题、加载/空态/失败、有旧配置、返回和重启；用测试数据执行保存、删除和导入。
- 检查界面时保留可核对的截图或运行证据；后台停用另查初始化、网络与日志。开发模式无请求不能单独证明打包后的更新或遥测已关闭。
- 只勾选真实实测通过的条目，失败、未测和环境受限分别说明。运行记录不要混入稳定需求文字。

### 5. 按特性提交与收尾

- 版本验收完成、提交与推送获得授权后，把 `ncode` 覆盖式指向本版 tip（`git branch -f ncode ncode-v<版本号>`，推送为 `git push --force-with-lease origin ncode`），使其始终是最新需求、流程与源码；不合并、不保留旧 `ncode` 上的提交。旧版本分支保留供演练，临时/备份分支此时清理，仓库回到 `main` / `ncode` / 各 `ncode-v<版本号>` 的目标形态。
- 功能、定位或验收补充先落在当前版本分支的 `ncode-feature.md`，随覆盖式同步进入 `ncode`；流程修订同样先改本分支 skill 再同步。核对同步内容一致，逐项确认本轮审查发现已有对应约束。
- 获得提交授权后，按可独立理解和验证的特性组织提交。同一特性的入口、专属后台、接口、文案、规范及测试一起提交；紧密耦合的运行时代码与依赖调整放在同一提交。范围小且紧密相关的改动可合并，提交数量随本版实际特性决定。
- 遗留补漏先用原始特性提交的代码、说明和当前调用链确认职责归属，再评估与该特性归并；不能只查看上一笔提交，也不能因为“已推送”就把新增修复提交当成唯一组织方式。记录候选原始 commit、补漏内容、新增设计与验证结果；职责归属不等于确认了缺陷引入提交。跨特性的统一本地策略作为独立设计评估，不机械塞进最早提交。
- 整理前列出每组的目标特性、原始 commit、文件/共享修改块、依赖及最终提交说明。共用策略先于其消费方可用，保证整理后的中间提交也有完整依赖；验证描述对应最终代码和实际执行结果。原特性补漏的实现、测试及规则一起归属，不把测试同步再拆成无上下文的尾随提交。
- 在尚未授权改写历史时，只完成可审查的归属分析和工作区改动，不执行 amend/rebase/squash/fixup 或强推。得到相应授权后，未发布的同特性补漏可归并到原始提交；已发布历史是否重排按用户选择执行，并核对后续提交与远端影响。
- **历史手术后必须 diff 审计**（2026-10-24 share 回退事故沉淀）：任何 fixup/rebase/cherry-pick 重建完成后，先 `git diff <旧 tip> <新 tip> --stat` 逐文件核对——差异文件与行数必须能对应本次意图，不能只看门禁通过（锚点只覆盖关闭面，非锚点文件如 wdio/SettingsPage 的漂移只有 diff 能发现）。**禁止把整文件 cp 到旧提交再重放后续提交**：后续提交对同一文件的 pick 会静默失配，产生关闭项回退类回归（该事故由 forbid 锚点拦截，无锚点时静默上线）；同文件的历史归属调整只用 `git commit --fixup <目标>` + `git rebase -i --autosquash <基点>`。
- 每个提交使用明确的特性标题，说明对应清单项、修改前后行为及验证结果；初始化提交或整轮说明记录官方基线 commit。共享文件按修改块暂存，审查每组 diff；无关草稿和生成产物保留在原处。下次更新可用 `git log` / `git show` 按特性追溯，需求仍以最新 `ncode-feature.md` 为准。
- 推送范围检查前确认基线：本仓库无跟踪分支且无 `origin/staging` 时，用本次已记录的官方基线设置 `ZCODE_AFFECTED_TEST_BASE=<官方 commit>`，不创建虚假远端引用或改检查规则。
- 完成已授权的提交并满足干净工作区等前置条件后，执行当前仓库要求的 `pnpm verify:pre-push`；若因前置条件停止，明确记录停止位置，满足条件后重跑，不能按前面阶段通过推断整体通过。受影响测试选中全量而跳过 UT 时，报告为未执行，已有的 NCode 关键回归仍需按实际入口运行。
- 对照官方基线检查最终 diff，逐项确认差异能对应清单，排除旧补丁残留、生成噪声和无关重构。
- 报告官方来源及 commit、工作分支、主要适配、验证结果和未验证项；已有失败不能写成通过。
- 提交、推送和历史修改遵循用户本次授权；创建 skill 或要求更新源码本身不表示要求发布。
