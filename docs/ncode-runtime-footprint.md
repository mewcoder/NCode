# NCode 运行时基线与四减计划

定位（2026-10-24 收敛）：精简官方功能之外，围绕**网络请求、运行时进程、安装体积、官方残留**四个维度持续做减法；每版更新通过 ncode-upstream-update 工作流落地。本文记录当前基线（macOS arm64，`NCode-3.16.2-mac-arm64`）、已执行的优化与候选清单；数字随产物变化复测更新，不作为硬性预算。

## 体积基线（2026-10-24 实测，飞书 SDK 移除后复测）

| 分解                        | 大小                   | 说明                             |
| --------------------------- | ---------------------- | -------------------------------- |
| NCode.app 总计              | 408MB（移除前 424MB）  | zip 138.6MiB、DMG 同步下降       |
| Electron Frameworks         | 227MB                  | Electron 41 运行时本体，非可控项 |
| app.asar                    | 88.8MB（移除前 100MB） | 见下表内部分解                   |
| glm（Agent 运行时）         | 65MB                   | zcode.cjs 14MB + packages 50MB   |
| licenses + notices + 图标等 | ~21MB                  | third-party 与安装资源           |
| tools                       | 9.6MB                  | ripgrep/搜索工具等               |

app.asar 内部：renderer assets 44.1MB（最大单件 styles 6.1MB、xlsx wasm 4.1MB）、node_modules 约 28MB、main/host/scheduler 15.4MB。

### 已执行

- **移除飞书 SDK（2026-10-24，实测 asar -11.2MB / .app -16MB）**：`@larksuiteoapi/node-sdk` 以 lib+es 双份打包在生产 asar，仅服务已关闭的 Bot provider（动态 import，经 `node.ts` 的 re-export 进入打包图）。处置共四处：删除 node.ts 导出、Desktop 移出生产依赖、services 降级为 devDependencies（仅编译期类型）、`electron-builder.config.js` 注入清单与 `bundle.mjs` 校验清单同步移除；产物审计新增「禁止打包的关闭项依赖」规则（@arms/@opentelemetry/@larksuiteoapi），关闭项锚点升级为 `createBotsService` 全量 forbid。复测：asar 内 larksuite 条目 0，审计 19/19 通过。见 ncode-feature.md 一、10。

### 候选（按预期收益排序，执行需单独评估）

| 候选                                                                                                           | 预期收益                         | 约束                                                                                 |
| -------------------------------------------------------------------------------------------------------------- | -------------------------------- | ------------------------------------------------------------------------------------ |
| Office 插件按需安装（pdf 16M + spreadsheets 13M + presentations 6M + documents 5.5M，另有 renderer wasm ~9MB） | glm/packages -40MB，asar -9MB    | 产品功能（验收含 Office 预览）；改为「首次使用时下载安装」需要插件分发与离线降级设计 |
| Cron scheduler 懒启动                                                                                          | 空闲时 -1 进程（utilityProcess） | 无自动化任务时不 spawn，创建首个任务时再启动；需处理创建路径的唤醒（见进程基线）     |
| zcode-guide-plugin 移除                                                                                        | 76KB + 官方内容残留              | 官方内置插件，移除影响内置指南能力，需产品决策                                       |
| 渲染器大资产治理（styles 6.1MB、shiki 语言包、mermaid 图表包）                                                 | 数 MB 级                         | 上游共享能力（代码高亮/图表），按需加载属上游优化，NCode 不单独分叉                  |
| mock-cdn 本地磁盘占用（releases 历史版本 + components，2026-10-25 实测 1.23GB，git-ignored）                   | 释放本地磁盘（不进安装包）       | 已提供 `pnpm ncode:mock-cdn:clean`（默认 dry-run，--apply 真删，默认保留当前版本）   |

## 进程基线

Main 进程通过 `utilityProcess.fork` 创建两类子进程：Host（每窗口一个，架构规定，见 AGENTS.md）与 Cron scheduler（`desktopCronScheduler.ts`，`onLocalDatabaseStartupReady` 后**无条件启动**一个）。其余子进程均按需：Agent CLI（会话运行时）、node-pty 终端、浏览器 guest、插件沙箱、MCP server、CUA helper。

- 已关闭功能的专属进程为 0（Bot/远控 relay/Off-Peak 派发均不装配；scheduler 中仅余协议类型）。
- 唯一结构性候选：scheduler 懒启动——启动时若 tasks-index 的 automations 为空则不 spawn，创建首个自动化任务时再启动；spawn 点集中在 `main/index.ts` 的 `onLocalDatabaseStartupReady` 回调，唤醒路径为自动化创建入口。

## 网络基线

关闭项落地后，NCode 常驻（空闲两分钟以上）出站请求为 **0**（2026-10-23 验收实测；锚点套件保证不回归）。剩余出站均为用户主动触发：

| 出站                                                 | 触发                    | 状态                             |
| ---------------------------------------------------- | ----------------------- | -------------------------------- |
| 用户 Provider API（含 bigmodel/zai/gemini 预设端点） | 会话/模型调用           | 合法保留（BYO Key 核心）         |
| `github.com/zai-org/zcode-plugins` 及 raw 资源       | 打开插件市场/安装/刷新  | 合法保留（默认市场源）           |
| `cdn-zcode.z.ai`（remoteCdn）                        | 远程运行时资产按需下载  | 保留；无自动触发                 |
| `zcode.z.ai` 默认 origin 常量                        | provider 默认端点等构造 | 常量保留，请求与否取决于用户配置 |
| telegram / feishu / larksuite 端点常量               | 已关闭 Bot 源码内       | 源码保留不触发；打包不含飞书 SDK |

## 官方残留盘点

| 项                                     | 现状                                         | 处置                           |
| -------------------------------------- | -------------------------------------------- | ------------------------------ |
| 飞书 SDK                               | 2026-10-24 已移出生产包                      | 完成，审计规则守护             |
| Bot/telegram 源码模块                  | 源码保留（上游结构），不装配不打包 SDK       | 锚点 forbid 守护               |
| zcode-guide-plugin                     | 内置官方指南插件（76KB）                     | 待产品决策                     |
| 官方 Provider 预设（bigmodel/zai/GLM） | BYO Key 用户的可选预设                       | 保留                           |
| `ZCode Agent`/`~/.zcode` 等兼容身份    | 兼容性设计                                   | 保留（README 兼容说明）        |
| `zcode.z.ai` 端点常量                  | 关闭项消费方已停用；常量供 provider 预设使用 | 保留，审计守护无上报端点字面量 |

## 复测命令

```sh
ZCODE_ENV=production ZCODE_PREVIEW_IDENTITY=0 pnpm bundle:desktop -- --os mac --arch arm64
pnpm ncode:artifact:audit -- --app packages/desktop/dist/mac-arm64/NCode.app
du -sh packages/desktop/dist/mac-arm64/NCode.app/Contents/{Frameworks,Resources,Resources/glm/*}
```
