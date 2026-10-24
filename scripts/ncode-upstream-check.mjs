// NCode 上游新鲜度检查：一条命令回答「现在该不该触发更新流程」。
//
// 对比 https://github.com/zai-org/ZCode（硬编码官方源，与 SKILL §1 一致）：
//   - refs/heads/main 的 commit 是否已被本地 ncode 基线包含（基线 = 本仓库
//     「chore: sync ZCode source」提交，即最近一次官方快照的合入点）；
//   - 官方 tag 列表里的最新版本号 vs 本地已建分支的版本号。
// 输出三种结论之一：
//   CURRENT   本地基线已包含上游 main，且无更新 tag → 无需触发
//   TAGGED    官方打了本地没有的新版本 tag → 可按 SKILL 触发更新
//   DRIFTED   上游 main 领先本地基线（未打 tag 的快照）→ 可选择跟随，按 SKILL 用
//             「已核实版本号 + 短 commit」命名分支
// 只读网络（git ls-remote），不改任何本地引用。

import { execFileSync } from "node:child_process";
import { resolve } from "node:path";

const repoRoot = resolve(import.meta.dirname, "..");
const UPSTREAM_URL = "https://github.com/zai-org/ZCode.git";

function git(args) {
  return execFileSync("git", args, { cwd: repoRoot, encoding: "utf8", maxBuffer: 16 * 1024 * 1024 });
}

/** 本地最近一次官方快照基线：ncode 分支历史上最新的 sync 提交。 */
function localSyncBase() {
  const list = git(["log", "--format=%H %s", "ncode"]).split("\n");
  for (const line of list) {
    // 行格式为「<sha> <subject>」，匹配须跳过行首 hash。
    if (/chore: sync ZCode source/i.test(line.split(" ").slice(1).join(" "))) {
      return line.split(" ")[0];
    }
  }
  throw new Error("ncode 分支上找不到「chore: sync ZCode source」基线提交");
}

function upstreamRefs() {
  const out = execFileSync(
    "git",
    ["ls-remote", UPSTREAM_URL, "refs/heads/main", "refs/tags/*"],
    { encoding: "utf8", maxBuffer: 16 * 1024 * 1024, timeout: 30_000 },
  );
  const refs = { main: undefined, tags: new Map() };
  for (const line of out.split("\n").filter(Boolean)) {
    const [sha, ref] = line.split("\t");
    if (ref === "refs/heads/main") {
      refs.main = sha;
    } else if (ref.startsWith("refs/tags/") && !ref.endsWith("^{}")) {
      refs.tags.set(ref.slice("refs/tags/".length), sha);
    }
  }
  return refs;
}

function localBranchVersions() {
  const out = git(["for-each-ref", "--format=%(refname:short)", "refs/heads/ncode-v*"]);
  const versions = [];
  for (const name of out.split("\n").filter(Boolean)) {
    const m = name.match(/^ncode-v(\d+\.\d+\.\d+)$/);
    if (m) versions.push(m[1]);
  }
  return versions.sort(compareVersions);
}

function compareVersions(a, b) {
  // 兼容带 v 前缀的 tag 名；剥离后再按数字段比较。
  const pa = a.replace(/^v/, "").split(".").map(Number);
  const pb = b.replace(/^v/, "").split(".").map(Number);
  for (let i = 0; i < 3; i += 1) {
    if (pa[i] !== pb[i]) return pa[i] - pb[i];
  }
  return 0;
}

export function checkUpstream({ refs, base } = {}) {
  const upstream = refs ?? upstreamRefs();
  const syncBase = base ?? localSyncBase();
  const localVersions = localBranchVersions();
  const localLatest = localVersions[localVersions.length - 1] ?? "(无)";
  const tagVersions = [...upstream.tags.keys()].filter((t) => /^v\d+\.\d+\.\d+$/.test(t)).sort(compareVersions);
  const latestTag = tagVersions[tagVersions.length - 1];

  const mainIncluded = (() => {
    try {
      git(["merge-base", "--is-ancestor", upstream.main, syncBase]);
      return true;
    } catch {
      return false;
    }
  })();

  const newTag = latestTag && !localVersions.includes(latestTag.slice(1)) ? latestTag : undefined;
  let status;
  if (newTag) status = "TAGGED";
  else if (!mainIncluded) status = "DRIFTED";
  else status = "CURRENT";

  return { status, upstreamMain: upstream.main, syncBase, latestTag, localLatest, newTag };
}

if (process.argv[1] && resolve(process.argv[1]) === new URL(import.meta.url).pathname) {
  try {
    const r = checkUpstream();
    const lines = [
      `[upstream-check] 官方 main：${r.upstreamMain}`,
      `[upstream-check] 本地基线：${r.syncBase}`,
      `[upstream-check] 官方最新 tag：${r.latestTag ?? "(无)"}，本地最新版本分支：${r.localLatest}`,
    ];
    if (r.status === "CURRENT") {
      lines.push("[upstream-check] 结论：CURRENT — 本地基线已包含上游，无需触发更新。");
    } else if (r.status === "TAGGED") {
      lines.push(
        `[upstream-check] 结论：TAGGED — 官方发布新版本 ${r.newTag}，可触发更新：`,
        `  pnpm ncode:port:plan -- --from ncode --target ${r.newTag}`,
      );
    } else {
      lines.push(
        "[upstream-check] 结论：DRIFTED — 上游 main 领先本地基线（未打 tag 快照）。",
        "  跟随则按 SKILL §2 用「已核实版本号 + 短 commit」建分支。",
      );
    }
    console.log(lines.join("\n"));
  } catch (error) {
    console.error(`[upstream-check] 失败：${error.message}`);
    process.exit(1);
  }
}
