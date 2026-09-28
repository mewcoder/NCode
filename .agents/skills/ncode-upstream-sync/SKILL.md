---
name: ncode-upstream-sync
description: Selectively adapt official ZCode source updates into NCode. Use when reviewing upstream versions, porting changes, or resolving integration conflicts; not for ordinary feature work.
---

# NCode Upstream Sync

Adapt selected official ZCode changes into NCode while preserving NCode's product boundaries and local work. Treat the upstream tree as a reference, not as a branch to merge wholesale.

## Before editing

- Read the repository `AGENTS.md` and follow its branch, compatibility, implementation, and commit rules.
- Inspect `git status --short --branch`, the current branch, and staged, unstaged, and untracked changes separately. Run `node scripts/check-workspace-freshness.mjs`. Preserve existing work; do not clean, reset, stash, stage, or commit it as part of this task.
- Confirm the configured upstream remote and target ref. In this repository, `main` is the source baseline and `dev` is reference-only. Fetch the requested upstream ref when needed, then identify both the last adapted source version and the target version. Do not assume the latest local remote-tracking ref is current.
- If the previous source baseline or requested target cannot be established, show the candidate refs and ask only for the missing choice before applying changes.

## Review and adapt

1. Compare the exact upstream range from the last adapted version to the target. Review changed paths, commit context, and patches; a file list or release note alone is not enough. Keep a short decision list: adapt, adapt with NCode changes, skip, or defer.
2. Trace changes through their callers and runtime effects. For behavior changes, identify the UI entry, state owner, protocol command, persistence, Host/runtime policy, and final registration path as applicable. Use the repository `feature-boundary-planner` skill when that mapping is nontrivial.
3. Port selected behavior manually at the narrowest useful boundary. Resolve conflicts by preserving both the upstream intent and NCode-specific behavior. Do not directly merge, rebase onto, or cherry-pick official upstream commits; do not replace customized NCode files wholesale just to make them resemble upstream.
4. Preserve disabled official account, sharing, feedback, and phone-remote-control features and their unused requests, subscriptions, or polling. Retain API-key and custom-provider workflows, generic MCP OAuth, the official plugin marketplace, and SSH/WSL/Docker remote workspaces. Keep compatibility identifiers and existing data/workspace identity contracts unless the requested upstream change requires a reviewed compatibility change. Avoid unrelated CLI edits.
5. When a change crosses a shared contract, update its shared types and runtime validation together. Keep UI capability access on existing hooks and `IPlatformService`; preserve Host routing and remote-workspace behavior. For code changes that affect module boundaries, apply `.agents/skills/architecture-governance/SKILL.md`.

## Validate and finish

- Inspect the final diff against the NCode starting state. Check that skipped official features did not re-enter through indirect callers and that newly unnecessary requests, subscriptions, or polling were not left active.
- Run relevant non-test checks required by `AGENTS.md`, usually `pnpm typecheck` and `pnpm lint`. Do not add or run tests unless the user asks to test or verify the implementation. Report passing checks, failures or baseline warnings, and checks not run separately.
- Commit only when explicitly requested. Stage only the files for this sync and use `sync(upstream): adapt ZCode <version>` as the commit form. Do not push, create a PR, or rewrite history unless explicitly requested.
- Summarize the source range, adopted and skipped areas, conflict decisions, files changed, checks and limitations, and any requested commit or push outcome. Do not claim a full upstream merge when the work was selective.
