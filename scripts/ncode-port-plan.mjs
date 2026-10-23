// NCode 移植计划生成器：为下一次上游更新生成「逐提交移植计划」。
//
// 输入：
//   --from <ref>   本次移植基于的 NCode 序列所在分支（如 ncode-v3.16.2），
//                  序列 = baseRef..from 之间的全部提交（baseRef = 上游官方 sync 提交，
//                  自动推断为 `chore: sync ZCode source` 或用 --base 显式指定）。
//   --target <ref> 目标官方树（如 v3.17.x tag）。新版本分支从此 ref 建立。
//   --base <ref>   （可选）显式指定序列基点，缺省自动推断。
//
// 对序列中每个提交，用 `git merge-tree --write-tree --merge-base=<parent>`
// 模拟 cherry-pick 到目标树（乐观路径：冲突块取合并结果继续），输出：
//   - 每提交的冲突文件清单（合并失败但 merge-tree 仍产出合并树）
//   - 目标树缺失、由提交引入的文件（需人工确认是否随版本存在）
//   - 提交里改动、且目标树版本与序列 parent 不同的文件（高置信冲突）
// 该计划是人工移植的核对表：冲突预判不改变任何工作区状态。
//
// 依据 3.14.3/3.15.1 两轮实测：跨版本移植冲突面 2.5 倍且呈网状，逐版本移植
// 是硬约束；本工具假定 --from 为最近一个已验收版本分支。

import { execFileSync } from "node:child_process";
import { resolve } from "node:path";

const repoRoot = resolve(import.meta.dirname, "..");

function git(args, opts = {}) {
  return execFileSync("git", args, {
    cwd: repoRoot,
    encoding: "utf8",
    maxBuffer: 64 * 1024 * 1024,
    ...opts,
  });
}

function parseArgs(argv) {
  const args = { positional: [] };
  for (let i = 0; i < argv.length; i += 1) {
    const arg = argv[i];
    // 兼容 pnpm/npm 的参数透传约定：裸 "--" 只是分隔符（pnpm 会原样透传），
    // 不是位置参数，否则 usage 守卫会误判退出。
    if (arg === "--") continue;
    if (arg === "--from") args.from = argv[++i];
    else if (arg === "--target") args.target = argv[++i];
    else if (arg === "--base") args.base = argv[++i];
    else args.positional.push(arg);
  }
  return args;
}

/** 自动推断序列基点：from 分支历史上最近一次官方 sync 提交。 */
function inferBase(fromRef) {
  const list = git(["log", "--format=%H %s", fromRef]).split("\n");
  for (const line of list) {
    if (/(^| )chore: sync ZCode source/i.test(line)) return line.split(" ")[0];
  }
  throw new Error("无法自动推断 sync 基点，请用 --base 显式指定");
}

/** 列出 ref 上存在、但 base 树上不存在的文件（该提交新建且目标树可能没有）。 */
function addedFilesAgainst(commit, parent) {
  const out = git(["diff", "--name-only", "--diff-filter=A", parent, commit]);
  return out.split("\n").filter(Boolean);
}

/**
 * merge-tree 输出：首行合并树 oid，其后混杂冲突文件行与 Auto-merging 信息行。
 * 冲突文件 = 「CONFLICT ... in <path>」行与裸 path 行（排在信息行之前的独立路径条目）。
 */
function extractConflicts(output) {
  const lines = output.split("\n").filter(Boolean);
  // merge-tree --name-only 输出：首行合并树 oid，其后先是冲突文件纯路径清单，
  // 再混 Auto-merging/CONFLICT 信息行。取「不含空格且非信息前缀」的行。
  return lines
    .slice(1)
    .filter((line) => !line.includes(" ") && !/^(Auto-merging|CONFLICT|Trying|Skipped)/.test(line));
}

function conflictFilesForPick(parentCommit, targetCommit, commit) {
  // merge-tree：merge-base=提交 parent，ours=目标树，theirs=该提交。
  // 冲突时退出码 1，但输出首行仍是合并树 oid，其后是冲突文件清单（--name-only）。
  try {
    const out = git(
      [
        "merge-tree",
        "--write-tree",
        "--name-only",
        `--merge-base=${parentCommit}`,
        targetCommit,
        commit,
      ],
      { stdio: ["ignore", "pipe", "ignore"] },
    );
    const allLines = out.split("\n").filter(Boolean);
    return { tree: allLines[0], conflicts: extractConflicts(out), merged: true };
  } catch (error) {
    const out = String(error.stdout ?? "");
    const allLines = out.split("\n").filter(Boolean);
    if (!allLines[0]) throw error;
    return { tree: allLines[0], conflicts: extractConflicts(out), merged: false };
  }
}

function commitTreeOid(ref) {
  return git(["rev-parse", `${ref}^{tree}`]).trim();
}

function createTempCommit(treeOid, parentCommit, message) {
  return git(["commit-tree", treeOid, "-p", parentCommit, "-m", message]).trim();
}

export function buildPortPlan({ fromRef, targetRef, baseRef }) {
  const base = baseRef ?? inferBase(fromRef);
  const range = git(["log", "--reverse", "--format=%H%x09%s", `${base}..${fromRef}`])
    .split("\n")
    .filter(Boolean)
    .map((line) => {
      const [hash, ...rest] = line.split("\t");
      return { hash, subject: rest.join("\t") };
    });

  let cursor = git(["rev-parse", `${targetRef}^{commit}`]).trim();
  const targetTreeAtStart = commitTreeOid(cursor);
  const plan = [];
  let totalConflicts = 0;

  for (const [index, entry] of range.entries()) {
    const parent = git(["rev-parse", `${entry.hash}^`]).trim();
    const added = addedFilesAgainst(entry.hash, parent);
    const { tree, conflicts, merged } = conflictFilesForPick(parent, cursor, entry.hash);
    // 与目标树相比，该提交改动的文件里「目标树与序列 parent 已不同」的属于高置信冲突，
    // 记录为需要人工按意图移植的清单；其余冲突来自 3-way 上下文漂移。
    const changed = git(["diff", "--name-only", parent, entry.hash]).split("\n").filter(Boolean);
    const drifted = changed.filter((f) => {
      try {
        const atParent = git(["rev-parse", "--verify", "--quiet", `${parent}:${f}`]);
        const atTarget = git(["rev-parse", "--verify", "--quiet", `${targetRef}:${f}`]);
        return Boolean(atParent) && Boolean(atTarget) && atParent.trim() !== atTarget.trim();
      } catch {
        return false;
      }
    });
    totalConflicts += conflicts.length;
    plan.push({
      index: index + 1,
      hash: entry.hash,
      subject: entry.subject,
      conflicts,
      added,
      drifted,
      cleanMerge: merged && conflicts.length === 0,
    });
    // 乐观路径：合并结果树作为下一步的起点（无冲突或冲突取合并结果）。
    cursor = createTempCommit(tree, cursor, `port-plan simulated: ${entry.subject}`);
  }

  return {
    base,
    fromRef,
    targetRef,
    targetTreeAtStart,
    plan,
    totalCommits: range.length,
    totalConflicts,
    cleanCommits: plan.filter((p) => p.cleanMerge).length,
  };
}

export function formatPortPlan(plan) {
  const lines = [];
  lines.push(
    `移植计划：${plan.totalCommits} 提交（${plan.fromRef} → ${plan.targetRef}），` +
      `乐观路径冲突 ${plan.totalConflicts} 文件次，干净落地 ${plan.cleanCommits}/${plan.totalCommits}`,
  );
  for (const step of plan.plan) {
    const tag = step.cleanMerge ? "OK  " : "CONF";
    lines.push(`[${step.index}/${plan.totalCommits}] ${tag} ${step.subject}`);
    if (step.conflicts.length > 0) {
      lines.push(`      冲突 ${step.conflicts.length}：${step.conflicts.join(", ")}`);
    }
    if (step.drifted.length > 0) {
      lines.push(`      目标树已漂移 ${step.drifted.length}（需按意图移植）：${step.drifted.join(", ")}`);
    }
    if (step.added.length > 0) {
      lines.push(`      新增文件 ${step.added.length}（确认目标版本是否存在同名模块）`);
    }
  }
  return lines.join("\n");
}

const isMain = process.argv[1] && resolve(process.argv[1]) === fileURLToPathSafe(import.meta.url);

function fileURLToPathSafe(url) {
  return new URL(url).pathname;
}

if (isMain) {
  const args = parseArgs(process.argv.slice(2));
  if (!args.from || !args.target || args.positional.length > 0) {
    console.error(
      "用法：node scripts/ncode-port-plan.mjs --from <ncode 分支> --target <官方 ref> [--base <sync 提交>]",
    );
    process.exit(2);
  }
  try {
    const plan = buildPortPlan({ fromRef: args.from, targetRef: args.target, baseRef: args.base });
    console.log(formatPortPlan(plan));
  } catch (error) {
    console.error(`[port-plan] 失败：${error.message}`);
    process.exit(1);
  }
}
