# 本轮改动的特性提交归属

当前版本：`ncode-v3.16.2`，官方基线 `3c5b2276`，整理前 HEAD/已核实远端均为 `06ad1605`。用户已选择归并到原始特性提交，授权仅重排本地历史、暂不推送。本文保留整理前归属，完成后的映射记录在文末。

## 归属与提交说明

| 特性                         | 原始职责提交                                     | 本轮范围                                                                                                                                             | 提交说明应补充的最终行为                                                                                                                                                                    |
| ---------------------------- | ------------------------------------------------ | ---------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 统一本地策略                 | 新增设计                                         | `packages/shared/src/ncode-feature-policy/`、shared 公开导出及该模块的架构登记                                                                       | `feat(config): centralize NCode local feature policy`。不可变本地值统一提供已有开关/模式/构建参数，不读取远端或用户动态覆盖。                                                               |
| 官方账号与 Provider 启动精简 | `21b8e85d`                                       | Setting 旧团队迁移门禁与测试；SettingsPage 套餐查询；Sidebar/ModelProvider 的策略接入；node Account Source 策略接入；CLI Provider runtime 旧下载测试 | 保留原特性标题，正文补充旧配置迁移及 Usage 企业查询均不触发官方请求；Provider 测试验证本地配置、Account revision 与 Worker 一致，零下载。                                                   |
| 营销与场景推荐               | `9541f661`                                       | `clientScenesService.ts`、关闭态测试、Local Services transport 集成用例                                                                              | 保留原标题，正文补充 `/api/v1/client/scenes` 返回成功空列表、停用远端推荐模板；transport 仍验证通用请求和释放。                                                                             |
| 应用内更新                   | `ae0ea836`                                       | Main `initAutoUpdater.enabled` 与帮助菜单的策略接入                                                                                                  | 保留原标题，正文说明复用本地构建值与既有入口参数，默认继续关闭，不能只隐藏菜单。Main 与其他特性共享，按修改块归属。                                                                         |
| 工作流与 Off-Peak            | `0878d77c`                                       | CodingPlanSubscriptionService 的 Off-Peak 关闭态、动态模式；node 的模式 resolver；客户端配置兼容回归                                                 | 保留原标题，正文补充快照/运行模式同源为 `onDemand`；Off-Peak 配置读取不再请求官方灰度，不加载模型视图；普通 Cron 保留。                                                                     |
| 遥测关闭与协议回归           | `a824647d`                                       | `desktopHostProcess.test.ts` 的 PRT-010                                                                                                              | 保留原标题，正文补充合法完成事实继续校验/转发，默认不发 ARMS；显式启用的资源映射回归仍保留。                                                                                                |
| 关闭态设备身份               | `528127d4`                                       | 远端 `stdioDeviceMid.ts`、启动注释、Server MID 测试及规则                                                                                            | `fix(telemetry): skip device identity when reporting is disabled`。说明覆盖 Desktop Main 与远端 stdio Server；空端点不初始化、不写状态，旧环境变量不能重开；启用夹具仍覆盖原成功/失败路径。 |
| 客户端远程配置退出           | 新增跨特性设计                                   | Main 灰度/帮助/预热/首 Host 等待，公共 ClientConfigService 及模块登记，Web 帮助配置，构建脚本，以及对应测试/历史说明                                 | `feat(config): replace remote client configs with local defaults`。不请求 `/api/v1/client/configs`，桌面提示固定开启，插件默认排序；公共读取、并发和强刷都使用独立本地快照。                |
| 已安装插件面板               | 用户新确定的展示规则                             | Installed hook、Launcher、对应 UT/浏览器用例、CONTEXT、plugin-ui 合同及市场交互文档                                                                  | `feat(plugins): show installed UI panels in launcher`。从现有 store 派生当前工作区面板，多面板去重；暂停可启用，入口不安装/恢复插件，异步目标切换隔离。                                     |
| 规则与流程记录               | 原版工作流；版本文档职责 `81fc2871` / `c6e170ef` | `ncode-feature.md`、skill、spec、审查和本归属记录；原版 ncode 另有 AGENTS 同步                                                                       | `docs(ncode): align feature workflow and review evidence`。规则随对应实现归属，跨特性审查记录单独记录真实验证及限制，不把“已关闭”写成整机/安装包验收。                                      |

以上是职责归属，不是缺陷引入归因。不把本轮全部内容合到最新的搜图移除提交，也不把新策略和新面板规则塞进最早的账号精简提交。

## 已选择的历史组织方式

在本地重排已发布适配历史，将补漏归并到对应原始特性提交。纯策略模块先于账号等消费方引入；共享的 Main/node/架构登记/文档按修改块拆分，检查中间提交依赖完整性。整理前历史和完整工作区快照保留在备份引用中；本次不推送。

原版 `ncode` 分支的清单/skill/spec/AGENTS 作为规则文档提交；当前版本保存同步快照，本机 skill 保持一致。提交信息以最终实现和实际验证为准，不填计划中的成功结果。

## 验证与收尾

- 整理后执行 547 项定向验证全部通过；类型及预推送检查通过，Lint 为 0 errors、87 warnings。affected 选中整个根套件时按约定跳过全量 UT，未执行全量测试。详情见 [审查记录](ncode-feature-gates-review-2026-10-23.md)。未执行安装包重建或完整桌面验收。
- 已按组审查 staged diff 并完成提交归并；16 个中间提交的策略依赖顺序与新增相对导入检查无遗漏，不代表每个中间提交都执行完整测试。保留备份，不推送。

## 整理完成记录

已按授权完成本地历史重排；不推送。紧密相关的遥测关闭与 MID 修复合并为一个提交，页面验收与本轮审查合并为一个文档提交。基线之后共 16 个提交，包含独立的纯策略前置模块、客户端配置退出和已安装插件面板。

| 整理前职责提交            | 整理后提交                                                                 |
| ------------------------- | -------------------------------------------------------------------------- |
| `81fc2871`                | `2285d38a`                                                                 |
| `b829a272`                | `e8bb5b07`                                                                 |
| `21b8e85d`                | `7bf98669`                                                                 |
| `9541f661`                | `16475750`                                                                 |
| `ae0ea836`                | `fcbae1a6`                                                                 |
| `a534505c`                | `1883d24d`                                                                 |
| `0878d77c`                | `07b151b1`                                                                 |
| `c26fc3e9`                | `e41f5237`                                                                 |
| `9a54e6db`                | `73e926d8`                                                                 |
| `da88b039`                | `81183db1`                                                                 |
| `a824647d`                | `ac53de96`                                                                 |
| `528127d4`                | `ac53de96`                                                                 |
| `06ad1605`                | `9f83cf48`                                                                 |
| `c6e170ef` 及本轮审查记录 | 当前 HEAD 的 `docs(ncode): record page acceptance and feature gate review` |

备份引用：

- 原始历史：`codex/backup-ncode-history-1792738631`。
- 整理前完整工作区：`codex/backup-ncode-worktree-1792738631`。

两次重排后的完整 Git tree 均与保存的工作区快照完全一致；本段映射及状态更新仅修改审查文档。未因整理恢复已移除功能或改变实现。
