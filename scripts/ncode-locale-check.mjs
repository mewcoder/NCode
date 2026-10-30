// NCode 国际化对称性检查：en-US 与 zh-CN 的 locale 文件必须键集合对称。
//
// 判定标准（2026-10-24 验收沉淀）：
//   - 当前两文件的键差若与官方基线（--base，缺省为最近 sync 提交）的键差完全一致，
//     视为通过——上游自带的不对称不由 NCode 承担；
//   - NCode 相对基线新增/删除的键必须 en/zh 同增同减（对称）。
// 只读 git 与工作区文件，无副作用。

import { execFileSync } from "node:child_process";
import { readFileSync } from "node:fs";
import { join, resolve } from "node:path";

const repoRoot = resolve(import.meta.dirname, "..");
const LOCALES = ["packages/ui/src/i18n/locales/en-US.ts", "packages/ui/src/i18n/locales/zh-CN.ts"];

function git(args) {
  return execFileSync("git", args, {
    cwd: repoRoot,
    encoding: "utf8",
    maxBuffer: 32 * 1024 * 1024,
  });
}

function inferBase() {
  const list = git(["log", "--format=%H %s", "ncode"]).split("\n");
  for (const line of list) {
    if (/chore: sync ZCode source/i.test(line.split(" ").slice(1).join(" ")))
      return line.split(" ")[0];
  }
  throw new Error("无法推断官方基线（ncode 分支上无 sync 提交），用 --base 显式指定");
}

function keysOf(content) {
  const keys = new Set();
  for (const m of content.matchAll(/^ {2}"([^"]+)":/gm)) keys.add(m[1]);
  return keys;
}

function fileKeysAt(ref, file) {
  return keysOf(git(["show", `${ref}:${file}`]));
}

export function checkLocaleSymmetry({ base } = {}) {
  const syncBase = base ?? inferBase();
  const current = LOCALES.map((f) => keysOf(readFileSync(join(repoRoot, f), "utf8")));
  const baseline = LOCALES.map((f) => fileKeysAt(syncBase, f));

  const upstreamOnly = [0, 1].map((i) =>
    [...current[i]].filter(
      (k) => !baseline[i].has(k) && !baseline[1 - i].has(k) && current[1 - i].has(k) === false,
    ),
  );
  const addedByNcode = [0, 1].map(
    (i) => new Set([...current[i]].filter((k) => !baseline[i].has(k))),
  );
  const removedByNcode = [0, 1].map(
    (i) => new Set([...baseline[i]].filter((k) => !current[i].has(k))),
  );

  const failures = [];
  const addedSymmetric =
    [...addedByNcode[0]].every((k) => addedByNcode[1].has(k) || current[1].has(k)) &&
    [...addedByNcode[1]].every((k) => addedByNcode[0].has(k) || current[0].has(k));
  const removedSymmetric =
    [...removedByNcode[0]].every((k) => !current[1].has(k)) &&
    [...removedByNcode[1]].every((k) => !current[0].has(k));
  if (!addedSymmetric) failures.push("NCode 新增键 en/zh 不对称");
  if (!removedSymmetric) failures.push("NCode 删除键 en/zh 不对称");

  return {
    base: syncBase,
    counts: current.map((s) => s.size),
    ncodeAdded: addedByNcode.map((s) => [...s]),
    ncodeRemoved: removedByNcode.map((s) => [...s]),
    failures,
  };
}

if (process.argv[1] && resolve(process.argv[1]) === new URL(import.meta.url).pathname) {
  const args = process.argv.slice(2);
  const baseIdx = args.indexOf("--base");
  try {
    const r = checkLocaleSymmetry(baseIdx !== -1 ? { base: args[baseIdx + 1] } : {});
    console.log(
      `[locale-check] en-US ${r.counts[0]} 键 / zh-CN ${r.counts[1]} 键（基线 ${r.base.slice(0, 8)}）`,
    );
    console.log(
      `[locale-check] NCode 新增：en ${r.ncodeAdded[0].length} / zh ${r.ncodeAdded[1].length}；删除：en ${r.ncodeRemoved[0].length} / zh ${r.ncodeRemoved[1].length}`,
    );
    if (r.failures.length > 0) {
      console.error(`[locale-check] 失败：\n${r.failures.join("\n")}`);
      process.exit(1);
    }
    console.log("[locale-check] 通过：NCode 改动键 en/zh 对称；上游自带键差不计入。");
  } catch (error) {
    console.error(`[locale-check] 失败：${error.message}`);
    process.exit(1);
  }
}
