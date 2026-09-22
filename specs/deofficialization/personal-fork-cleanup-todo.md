# NCode 个人版去官方化与功能裁剪 TODO

## 目标

把 NCode 收敛为个人使用的本地开发工具：不依赖 ZCode/Z.ai 的账号、运营、远程配置和
文档入口，同时保留聊天、API Key/自定义 Provider、本地工作区、MCP、Skills、本地日志等
通用能力。官方插件 CDN 可以作为可关闭、可替换的上游第三方来源继续使用。

本文只记录待办，不修改现有行为。调查基于 `dev` 分支当前提交 `7ad5895`；执行前必须先
重新运行 `node scripts/check-workspace-freshness.mjs`，并在基线更新后复核路径与调用关系。

## 执行顺序

- [ ] P0：切断仍在运行的官方远程依赖。
- [ ] P1：清理已经失效但仍占用类型、协议、依赖和素材的兼容壳。
- [ ] P2：根据个人实际使用习惯决定外部插件源和大型独立能力。
- [ ] 每个行为改动先补对应 spec 和验收场景，再实现、测试和提交。
- [ ] `apps/zcode-cli` 仍是稳定边界；涉及其官方插件、协议或运行时时，先单独确认授权。

## P0：优先移除的官方依赖

### 1. `/api/v1/client/configs` 官方远程配置

Desktop 和 Host 仍会默认请求 `https://zcode.z.ai/api/v1/client/configs`，用于插件排序、
Desktop Context Prompt 和 Renderer Action Trace 灰度。个人版应由本地配置或编译期默认值决定。

- [ ] 为 Desktop Context Prompt 明确本地默认值或本地设置项。
- [ ] Renderer Action Trace 改为本地显式 opt-in，默认关闭。
- [ ] 删除 `IClientConfigService`、对应 channel、缓存和远程 Host 代理。
- [ ] 删除通用 `singleFeatureRollout`；若仍有本地消费者，改为本地配置读取。
- [ ] 删除官方 endpoint source headers 中仅服务远程配置的设备字段。

主要证据：

- `packages/services/src/client-config/clientConfigService.ts`
- `packages/shared/src/clientConfig.ts`
- `packages/desktop/src/main/desktopContextPromptRollout.ts`
- `packages/desktop/src/main/rendererActionTraceRollout.ts`
- `packages/desktop/src/main/singleFeatureRollout.ts`

验收：正常启动、打开插件页和创建首个 Host 时均不请求 `/api/v1/client/configs`；功能开关只由
本地事实决定。

### 2. 官方文档、更新说明与产品 endpoint

- [x] 移除指向 ZCode 官方站点的“产品文档”入口。
- [ ] 将 changelog 入口改为仓库/GitHub Release，不再打开 `zcode.z.ai`。
- [ ] 删除开发菜单中的官方 production/test endpoint 选择；如需调试，只保留显式自定义 endpoint。
- [ ] 重新评估 `DEFAULT_ZCODE_ENDPOINT_ORIGIN`：通用 Provider 不应需要产品后端默认值。
- [ ] 清理 `electron-builder.config.js` 中仍显示的官方 homepage。

主要证据：

- `packages/ui/src/lib/productDocs.ts`
- `packages/ui/src/lib/helpMenuActions.ts`
- `packages/desktop/src/main/desktopCommandHandlers.ts`
- `packages/shared/src/zcodeEndpoint.ts`
- `packages/desktop/electron-builder.config.js`

验收：帮助菜单、命令面板、应用菜单和默认运行环境都不会打开或请求 `zcode.z.ai`。

### 3. 官方远程工作区资源 CDN

SSH/WSL/Docker 远程工作区在生产环境仍从 `cdn-zcode.z.ai/zcode/electron/releases/...`
下载远端运行资源。

- [x] 个人版桌面安装包暂时关闭 SSH/WSL/Docker 远程 workspace 入口。
- [ ] 后续如恢复远程 workspace，必须先把经过 hash 校验的资源随 NCode Release 或安装包发布。
- [ ] 未完成资源发布前，不重新打开远程 workspace UI，也不把 CDN URL 换个名字继续使用。

主要证据：

- `packages/desktop/src/main/remoteCdn.ts`
- `packages/desktop/src/main/desktopRuntimeEnv.ts`
- `packages/server/src/remote/remoteAssetCdn.ts`
- `packages/server/src/remote/deploy.ts`

验收：当前安装包不展示或恢复远程 workspace；未来恢复前必须具备可复现的 NCode 资源来源，
不能回退到官方 CDN。

## P1：确定可清理的残留

### 4. 支付与套餐死资源

静态引用扫描确认 Stripe 依赖和支付图片没有源码调用；账号购买功能已经移除。

- [ ] 删除 `@stripe/react-stripe-js`、`@stripe/stripe-js`。
- [ ] 删除 `packages/ui/src/assets/payment-icons/`。
- [ ] 用仓库脚本重新生成 lockfile、第三方 inventory 和 notices。
- [ ] 删除无引用的套餐 UI 文件：
      `usePlanIdentitySnapshot.ts`、`startPlanQuotaReminderStore.ts`、
      `sessionQuotaBannerDismissalStore.ts`、`quotaModelDisplayName.ts`。
- [ ] 删除不再使用的 Start Plan logo、测试 ID 和 i18n 文案。

验收：`rg` 不再发现支付 UI/Stripe 运行时代码；Provider API Key 配置和本地使用统计保持可用。

### 5. 账号 Provider、Start Plan 与 Off-Peak 配置规则

`config/provider/zcode-builtin.json` 仍包含多个 `zhipu-account`、Start Plan、Off-Peak provider
和 `zcode-plan` URL。Resolver 当前会过滤它们，但个人版不需要继续携带可重新激活的规则。

Off-Peak 是官方账号的闲时任务：任务由官方服务在低峰时段调度并回传结果。它依赖官方账号、
额度和服务端队列，与本地 `Automations/Cron` 定时任务不是同一能力。

- [ ] 删除所有 `access.type = zhipu-account` 的 provider 规则。
- [ ] 删除 Start Plan/Off-Peak 专用模型规则和 endpoint 匹配规则。
- [ ] 保留 Z.ai/BigModel 的普通 API Key 与 Coding Plan API Key 模板，除非个人明确不用 GLM。
- [ ] 删除账号 credential key、连接选择和 availability 代码；历史数据只读迁移另行评估。
- [ ] 删除 Off-Peak 新建/列表/调度协议入口；保留数据库迁移所需的最小历史读取能力。

验收：新配置无法产生账号型 Provider 或 Off-Peak 任务；旧数据不会被重新激活；普通 API Key
Provider 仍可用。

### 6. Disabled Coding Plan Service 兼容壳

`ICodingPlanSubscriptionService` 仍暴露支付、企业套餐、Off-Peak、强制更新等大量方法，实际实现
全部拒绝或返回本地默认值。

- [ ] 将动态工作流可用性改为独立本地配置，不再借用套餐 service。
- [ ] 将模型 context budget 默认值放回实际 owner。
- [ ] 删除 `ICodingPlanSubscriptionService`、ServiceChannel、Desktop/Web 代理和 disabled factory。
- [ ] 删除共享支付/订单 schema；仅保留仍被 API Key 额度查询使用的类型。

验收：ServiceCollection 和远程 Host 不再注册套餐 service；动态工作流与模型选择不回归。

### 7. 已 retired 的旧插件 service/store

新插件管理使用 `IPluginManagementService`；旧 `IPluginsService` 只注册一个会抛错的实现，旧
`usePluginStore` 没有静态调用方。

- [ ] 删除 `packages/ui/src/store/pluginStore.ts` 与 `packages/ui/src/hooks/usePlugins.ts`。
- [ ] 删除 `IPluginsService`、`createPluginsService`、client proxy 和 remote Host 注册。
- [ ] 确认所有插件页面只依赖 `IPluginManagementService` 与 `pluginManagementStore`。

验收：插件列表、个人来源、安装、启停、更新、卸载仍走唯一管理路径；不存在运行时抛出
“Legacy plugin management has been retired”的可达 channel。

### 8. 分享功能遗留文件

- [ ] 删除无引用的 `packages/web/src/share/shareHeaderLayout.ts`。
- [ ] 再次搜索 share route、协议、locale 和构建入口，避免保留空目录或失效测试。

验收：分享功能相关源码无可达入口，普通本地 Web 启动不受影响。

### 9. 其他已确认无引用文件

- [ ] 删除 `packages/ui/src/v4/ConversationBottomDockTransition.tsx`。
- [ ] 逐项复核 `pnpm knip` 报告中的未使用文件；动态加载、构建脚本和生成入口不得直接按报告删除。
- [ ] 对待删除的 TypeScript export 使用 `pnpm dep:refs <file>:<symbol>` 做全仓确认。

## P2：按个人使用习惯决定的大功能

这些能力不是官方绑定，只有确认自己不用时才删除。每项都应独立成一个 feature/refactor，不能
混在 P0/P1 的去官方化提交里。

### 10. 官方插件市场与 CDN

当前默认市场指向
`https://cdn-zcode.z.ai/zcode/official-plugin/marketplace.json`。该 CDN 可以继续作为上游
第三方插件源使用，不属于必须删除项；但 NCode 不应把它描述为自己的官方市场。

- [ ] 决策：继续默认启用、改为用户手动启用，或替换为自有镜像。
- [ ] UI 明确标注为“ZCode 上游市场”或其他不暗示 NCode 官方背书的名称。
- [ ] 提供禁用或移除该来源的能力；CDN 不可达不能影响本地会话和随包插件。
- [ ] 保留 Personal Source、安装/启停/卸载和本地恢复能力。
- [ ] 若以后替换市场 ID，评估历史已安装插件和建议提示词的兼容映射。
- [ ] 远端 `pluginStoreOrder` 是否保留，跟随 P0 的官方远程配置清理单独决定。

主要证据：

- `packages/shared/src/plugin-marketplaces.ts`
- `packages/ui/src/settings/officialMarketplaceAutoRefresh.ts`
- `packages/ui/src/hooks/usePluginStoreOrder.ts`
- `packages/ui/src/settings/PluginStorePage.tsx`
- `packages/ui/src/v4/featureSuggestedPrompts.ts`

验收：使用 CDN 时清楚显示其上游来源；关闭或断网时仍可使用本地会话、随包插件和个人插件。

### 11. Web + Local Server

- [ ] 决策：是否只使用 Desktop。
- [ ] 若是：删除 `packages/web` 的普通 Web 客户端、HTTP Server 入口和 `dev:web`。
- [ ] 保留 Desktop stdio Host 所需的 server 代码；先证明包级边界可拆，不能直接删整个
      `packages/server`。

删除收益：减少一套启动、WebSocket、移动布局和 Web/Desktop 双端验收。

### 12. SSH / WSL / Docker 远程工作区

- [x] 当前个人版不启用远程机器、WSL 或容器 workspace；Desktop UI 不展示入口，也不恢复旧远程会话。
- [ ] 若从不使用：删除连接向导、target 解析、资源部署、Host attachment、重连与缓存。
- [ ] 保留 `workspaceIdentity?.trim() || workspacePath`，直到所有远程持久数据和协议迁移完成。

删除收益：去掉当前最重的跨平台部署、远端资源发布和双链路恢复负担。

### 13. Computer Use（桌面系统控制）

当前 `@zcode/zcode-cua` 描述为“不可用的兼容占位包”，但 Desktop/UI 仍保留权限引导、Helper、
PiP、设置页和插件入口。

- [ ] 决策：是否需要控制 macOS/Windows 桌面应用。
- [ ] 若不需要：删除 Computer Use 设置、composer 入口、权限 broker、Helper、PiP 和 CUA 专用协议。
- [ ] 保留 Embedded Browser / Browser Use；它与桌面系统控制不是同一能力。

删除收益：大幅减少原生权限、平台 Helper 和窗口协调代码。

### 14. 自动化与动态工作流

- [ ] 决策：是否使用定时任务（Automations/Cron）。
- [ ] 决策：是否使用多代理动态工作流、时间线和保存的 workflow。
- [ ] 不使用时分别删除，不能把普通会话队列或 Subagent 一起误删。

删除收益：减少 scheduler、cron run 生命周期、workflow 图和恢复状态。

### 15. 插件商店 UI

- [ ] 若只使用随包插件：保留插件运行时，删除市场浏览、个人市场源和在线安装 UI。
- [ ] 若会使用上游或开发个人插件：保留上游市场、Personal Source 与本地安装，并明确来源归属。
- [ ] 不建议删除整个插件运行时；Browser Use、文档/表格能力和技能扩展依赖它。

### 16. 首次启动迁移向导

- [ ] 若安装目标永远只有当前个人环境：删除欢迎页、职业选择、Claude 会话/Skills/MCP/命令迁移。
- [ ] 若需要重装恢复或给其他设备使用：保留迁移能力，但把 ZCode 文案改为 NCode。

### 17. 本地诊断与资源管理

- [ ] 可选删除 Renderer Action Trace、Local TTFT 和资源管理器 UI。
- [ ] 建议保留本地日志、导出日志和崩溃诊断；它们没有官方远程出口，排错价值高。
- [ ] 不要仅因类名包含 `telemetry` 就删除本地进程资源采样。

## 建议保留

- [ ] 保留普通 API Key、Coding Plan API Key、自定义 Provider 和模型选择。
- [ ] 保留本地会话、任务索引、Git、终端、文件搜索、diff 和权限确认。
- [ ] 保留通用 MCP OAuth；它不等于已删除的官方账号 OAuth。
- [ ] 保留 Browser Use / Embedded Browser，除非确认完全不用网页自动化。
- [ ] 保留消息点赞/点踩的本地 metadata；它不会提交官方反馈。
- [ ] 保留 NCode GitHub Releases 自动更新；它已经脱离官方更新源。

## 每个清理任务的统一验收

- [ ] 先更新对应 spec，写明状态 owner、接口、持久化和失败语义。
- [ ] 删除前用 `rg` 搜索源码、测试、文档、脚本、技能、配置和 locale 的全部引用。
- [ ] 行为改动补测试；交互改动补可执行 E2E 场景。
- [ ] 运行目标包测试、`pnpm typecheck`、`pnpm lint`、`pnpm fmt:check`。
- [ ] 运行 `pnpm architecture:check --changed` 与 `git diff --check`。
- [ ] 依赖变化通过仓库脚本更新 lockfile、第三方 inventory 和 notices。
- [ ] 只报告实际执行结果；已有失败、warning 和未执行项单独列出。
- [ ] 用户明确要求后才 commit；commit 完成后再更新根 `CHANGELOG.md` 并写入 hash。

## 推荐拆分

1. `refactor(deofficialization): remove official client config and product links`
2. `refactor(plugins): clarify and isolate upstream marketplace ownership`
3. `refactor(account): remove remaining plan and payment compatibility surfaces`
4. `refactor(plugins): remove retired plugin management path`
5. 按 P2 的每个独立决策分别提交，不做一次性大删除。
