// NCode mock-cdn 磁盘清理：只删本仓库 git-ignored 的 packages/desktop/mock-cdn/
// （远控开发用的离线运行时缓存，可由 prepare-agent-node-bundle / 远控链路重新生成）。
//
// 默认 dry-run：只列出将删除的目录与大小；加 --apply 才真删。
// 默认只清「非当前版本」的 releases 目录与全部 components；
// 加 --all 连当前版本一起清（下轮远控开发会重新生成）。
//
// 背景：mock-cdn/releases/<版本>/node 单份 ~444M，历史版本目录会随适配累积；
// components（多平台远控资产）共 ~192M。均不在 git 里，删了不影响仓库与安装包。

import { execFileSync } from "node:child_process";
import { existsSync, readdirSync, readFileSync, rmSync, statSync } from "node:fs";
import { join, resolve } from "node:path";

const repoRoot = resolve(import.meta.dirname, "..");
const mockCdnDir = join(repoRoot, "packages/desktop/mock-cdn");
const ZCODE_VERSION = JSON.parse(readFileSync(join(repoRoot, "package.json"), "utf8")).version;

const argv = process.argv.slice(2);
const apply = argv.includes("--apply");
const all = argv.includes("--all");

function duDir(path) {
  try {
    return Number(execFileSync("du", ["-sk", path], { encoding: "utf8" }).split("\t")[0]) * 1024;
  } catch {
    return 0;
  }
}

function fmt(bytes) {
  if (bytes >= 1024 ** 3) return (bytes / 1024 ** 3).toFixed(2) + " GB";
  if (bytes >= 1024 ** 2) return (bytes / 1024 ** 2).toFixed(1) + " MB";
  return Math.round(bytes / 1024) + " KB";
}

if (!existsSync(mockCdnDir)) {
  console.log("[mock-cdn-clean] packages/desktop/mock-cdn 不存在，无需清理。");
  process.exit(0);
}

const targets = [];
const releasesDir = join(mockCdnDir, "releases");
if (existsSync(releasesDir)) {
  for (const entry of readdirSync(releasesDir)) {
    const full = join(releasesDir, entry);
    if (!statSync(full).isDirectory()) continue;
    if (!all && entry === ZCODE_VERSION) continue; // 保留当前版本
    targets.push(full);
  }
}
const componentsDir = join(mockCdnDir, "components");
if (existsSync(componentsDir)) targets.push(componentsDir);

if (targets.length === 0) {
  console.log(
    `[mock-cdn-clean] 没有可清理目录（releases 只剩当前版本 ${ZCODE_VERSION}，components 不存在）。`,
  );
  process.exit(0);
}

let total = 0;
console.log(`[mock-cdn-clean] ${apply ? "将删除" : "dry-run（加 --apply 真删）"}：`);
for (const t of targets) {
  const size = duDir(t);
  total += size;
  console.log(`  ${fmt(size).padStart(9)}  ${t}`);
}
console.log(
  `[mock-cdn-clean] 合计：${fmt(total)}${all ? "（含当前版本，远控开发需重建）" : `（保留当前版本 releases/${ZCODE_VERSION}）`}`,
);

if (apply) {
  for (const t of targets) rmSync(t, { recursive: true, force: true });
  console.log("[mock-cdn-clean] 已删除。远控开发时 prepare-agent-node-bundle 会重新生成。");
}
