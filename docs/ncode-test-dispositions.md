# NCode 官方测试处置登记表

移植（更新/建新版本分支）时，官方测试文件按本表机械处置。每次更新遇到表中未登记的
官方测试且其断言与关闭项冲突时，处置决策须回填本表（文件 ↔ 关闭项 ↔ 处置理由），
下版本不再重复人工判断。与 `ncode-feature.md`「一、关闭功能」章节对应。

处置类别：

- **删除**：断言官方功能行为，该功能在 NCode 已关闭，无可断言面。
- **替换**：改用 NCode 的取代实现测试（原文件删除，新文件由 NCode 提交带入）。
- **改写**：保留文件，断言改为 NCode 语义（通常 = 取 NCode 上一版本的该测试文件）。

## 删除（官方功能随关闭项移除）

| 测试文件 | 关闭项 | 说明 |
| --- | --- | --- |
| `packages/shared/test/pluginMarketplaces.test.ts` | 14 插件商店 | 由 `pluginStoreOrder.test.ts` 取代 |
| `packages/services/test/clientScenesService.test.ts` | 远程配置·场景推荐 | 由 `clientScenesPolicy.test.ts` 取代 |
| `packages/ui/test/modelConfigHelpCopy.test.ts` | 1 官方账号/套餐 | 断言套餐帮助文案 |
| `packages/ui/test/remoteConnectionEntryVisibility.test.ts` | 11 远程设备入口 | 3.16.2 NCode 亦删除 |
| `packages/ui/test/onboardingWelcomeI18n.test.ts` | 12 设置页新手引导 | OccupationOnboarding 关闭 |
| `packages/ui/test/offPeakFigmaLayout.test.ts` | 3 闲时任务 | Off-Peak 关闭 |
| `packages/ui/test/occupationOnboardingWindowControls.test.ts` | 12 设置页新手引导 | 同 onboarding |
| `packages/ui/test/feedbackBaseServiceBoundary.test.ts` | 4/9 营销·反馈 | FeedbackHost 随营销关闭移除（3.16.2 同步清理） |
| `packages/ui/test/chatErrorBannerFeedbackDraft.test.ts` | 9 反馈与社群 | 反馈草稿无可断言面；3.16.2 重写为「复制+重连」前提是 3.16 横幅有 onReconnect |
| `packages/services/test/client-config/contract.test.ts`、`packages/shared/src/ncode-feature-policy/contract.test.ts` | 工作流 | 仅当目标包无 vitest devDep（如 3.14 的 shared/services）时随包结构删除 |

## 改写（取 NCode 上一版本同名文件即可收敛）

| 测试文件 | 关闭项/定制 | 改写要点 |
| --- | --- | --- |
| `packages/ui/test/modelProviderCodingPlan.test.ts` | 1 官方账号/套餐 | 换 NCode 精简骨架版（官方版 93+ 断言全部失效） |
| `packages/ui/test/modelProviderNavigationLoading.test.ts` | 1 官方账号/套餐 | 同上 |
| `packages/ui/test/chatContextUsageBreakdown.test.ts` | 1 官方账号/套餐 | 同上 |
| `packages/ui/test/workspaceHeaderActionSection.test.ts` | 4/7 营销·分享 | 分享/奖励菜单断言移除 |
| `packages/ui/test/workspaceHelpMenuButton.test.ts` | 4/9 营销·反馈 | 帮助菜单仅保留本地动作 |
| `packages/ui/test/quickPickCommands.test.ts` | 4 营销 | 快捷指令里的官方入口断言 |
| `packages/ui/test/rewardsMenuIcon.test.ts` | 4 营销·奖励 | 奖励入口移除 |
| `packages/ui/test/windowsCaptionMenuButton.test.ts` | 5 应用内升级 | 「生产版保留更新入口」改为「NCode 不展示任何更新入口」 |
| `packages/ui/test/useDesktopUpdateMenu.test.ts` | 5 应用内升级 | 同上 |
| `packages/desktop/test/hostRemoteWorkspaceServices.test.ts` | 10 Bot/群聊 + 1 账号 | Bot 装配断言改 `getOptional(IBotsService)` 为 undefined；远程 Token 用量用例删除 |
| `packages/desktop/test/about.test.ts` | 品牌 | NCode 关于内容断言（viewBox 等随品牌资产走） |
| `packages/shared/test/dynamicWorkflowFeature.test.ts` | 二、2 动态工作流 | NCode 固定 onDemand 矩阵**按当版语义适配**（3.14/3.15 的 disabled=未提供，3.16 的 DWG-18 disabled=合法默认值） |
| `packages/ui/test/settingsNavigation.test.ts` | 11 远程设备 | 原版 + 追加「remoteDevices 隐藏且回落 general」用例 |
| `packages/ui/test/settingsPageConfig.test.ts` | 11 远程设备 + 定制分区 | 原版 + 登记实际分区顺序（remoteDevices 隐藏、personalization/migration 归组） |
| `packages/ui/test/savedWorkflowsSection.test.ts` | 二、2 动态工作流 | 「工作流设置」入口删除断言 |
| `packages/ui/test/workspaceSidebarFooterWebRemoteControlTooltip.test.ts` | 8 手机远控 | tooltip/入口断言按当版结构 |

## 保留原样

其余官方测试不触碰关闭面，原样随源码走。若移植中出现未登记测试失败，先判定其断言
对象是否属于 `ncode-feature.md` 某关闭项；是则登记处置，否则修复移植引入的回归。
