# NCode 开发规则

## 项目目标

- NCode 基于 ZCode 源码二次开发，用于精简不需要的官方功能；不代表 ZCode 或 Z.ai 官方产品。
- `main` 是开发基线；`dev` 和官方提交只作参考。阅读差异后按需适配，不直接合并、变基或 cherry-pick。

## 改动原则

- 开工先检查分支、`git status --short`，并运行 `node scripts/check-workspace-freshness.mjs`；保留无关的本地改动。
- 遵循最小改动：优先隐藏入口或在最窄边界关闭功能；不顺带重构，不新增开关。
- 功能精简需兼顾运行时兼容性与开销：保留仍需运行的会话链路；关闭入口后，不保留无用请求、订阅、轮询或重复计算。
- 关闭现有功能时，优先用简短注释停用入口或调用并保留原实现，便于恢复和对照上游；无法安全保留或确有必要时再删除，删除前先查引用。
- 保留 API Key、自定义 Provider、通用 MCP OAuth、官方插件市场，以及 SSH/WSL/Docker 远程工作区。`apps/zcode-cli` 尽量不改；优先在外层关闭相关功能，确认无法安全处理时才做必要的最小改动。也不恢复已关闭的账号、分享、反馈和手机远控入口。
- 小型功能精简不写 spec。`CHANGELOG.md` 只维护 TODO；代码 commit 不包含它。
- 未明确要求修改时，先调查问题并说明确认的原因和仍待验证的部分。

## 实现与检查

- 代码改动遵守现有模块边界；使用 `.agents/skills/architecture-governance/SKILL.md`。
- UI 通过现有 hooks 和 `IPlatformService` 访问业务与平台能力；协议改动同步更新共享类型和运行时校验。
- 不因精简其他功能破坏 workspace identity、Host 路由或远程工作区链路。
- 代码改动后运行相关检查；通常执行 `pnpm typecheck` 和 `pnpm lint`，如未执行或失败须如实说明。

## Commit 规则

- 只有用户明确要求时才 commit；默认不 push、不创建 PR。
- 一个完整功能或修复一个 commit；只暂存本次相关文件，不用 `git add -A`。提交前检查 `git status --short`、`git diff --check` 和暂存区 diff。
- 功能精简使用 `slim(scope): summary`，代码结构优化使用 `refactor(scope): summary`；性能优化使用 `perf`，其他改动使用 `fix`、`feat`、`docs` 等类型。示例：
  - `slim(ui): hide account and feedback entries`
  - `slim(provider): hide official default subscriptions`
  - `refactor(config): simplify provider lookup`
  - `perf(renderer): reduce provider list work`
  - `fix(desktop): prevent startup crash`
  - `docs: simplify development rules`
- 未经明确要求，不执行 reset、amend、历史重写或强制推送。

提交示例：

```sh
git add packages/ui/src/path/to/file.tsx
git diff --cached --check
git diff --cached
git commit -m "slim(ui): hide account entry"
```
