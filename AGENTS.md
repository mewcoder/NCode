# NCode 开发规则

## 项目

- NCode 基于 ZCode 源码二次开发，不代表 ZCode 或 Z.ai 官方产品。
- `ncode` 是本项目主分支；`main` 是源码基线，`dev` 仅作参考。先读差异再适配，不直接合并或 cherry-pick。

## 改动

- 开工前检查分支、工作区和 `node scripts/check-workspace-freshness.mjs`；保留无关的本地改动。
- 做最小改动：优先隐藏入口或在最窄边界停用，不顺带重构、不新增开关。
- 保留运行所需链路；停用功能时一并停止无用请求、订阅和轮询。能安全保留原实现时，用简短注释停用；删除前先查引用。
- 保留 API Key、自定义 Provider、通用 MCP OAuth、官方插件市场及 SSH/WSL/Docker 远程工作区；尽量不改 `apps/zcode-cli`。不恢复已关闭的账号、分享、反馈和手机远控入口。
- 小型精简不写 spec。`README.md` 记录项目目标、保留能力和已完成的精简；不维护 `CHANGELOG.md`。

## 实现与验证

- 遵守模块边界；代码改动按需使用 `.agents/skills/architecture-governance/SKILL.md`。
- UI 通过现有 hooks 和 `IPlatformService` 访问能力；协议改动同步更新共享类型和运行时校验。
- 不破坏 workspace identity、Host 路由或远程工作区链路。
- 运行相关检查，通常包括 `pnpm typecheck` 和 `pnpm lint`；如未运行或失败，明确说明。

## 提交

- 仅在用户明确要求时提交；默认不 push、不建 PR。一个完整功能或修复一个提交。
- 只暂存相关文件；提交前检查 `git status --short`、`git diff --check` 和暂存区 diff。
- 提交标题统一使用 `<type>(<scope>): <summary>`；type 小写，scope 使用简短、稳定的模块或功能名，summary 以动词开头并只说明一个主要目的。一个提交混有不同目的或类别时，拆开提交。
- type 分类：
  - `slim`：精简、隐藏或停用上游/官方功能及其无用请求；保留仍需的兼容链路。
  - `feat`：新增用户能力，或让原本不可用的能力正式可用；新增 Provider/模型选项也归此类。
  - `fix`：修正错误行为或回归。
  - `refactor`：调整内部结构，保持外部行为不变。
  - `perf`：明确改善启动时间、响应速度、资源或计算开销。
  - `docs`：只改 README、规格、开发说明等文档。
- 目前固定使用以上六类；测试、构建等通常并入对应功能/修复提交，只有确需独立提交时才增加专用类型并同步补充本表。
- 优化按实际变化分类：用户可见能力变化用 `feat`，修错用 `fix`，行为不变的代码整理用 `refactor`，有明确性能收益用 `perf`。
- 示例：`slim(account): hide official subscription entry`、`feat(workflow): add dynamic workflow toggle`、`fix(desktop): prevent startup crash`、`refactor(provider): simplify rule resolution`、`perf(renderer): reduce model list work`、`docs(readme): document retained capabilities`。
- 未经明确要求，不执行 reset、amend、历史重写或强制推送。
