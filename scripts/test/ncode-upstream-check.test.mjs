// ncode-upstream-check 的注入式回归：不触网，验证三态判定与版本比较。
import assert from "node:assert/strict";
import { test } from "node:test";
import { execFileSync } from "node:child_process";
import { checkUpstream } from "../ncode-upstream-check.mjs";

const repoRoot = new URL("../..", import.meta.url).pathname;
const headSha = execFileSync("git", ["rev-parse", "HEAD"], { cwd: repoRoot, encoding: "utf8" }).trim();

test("上游 main 已包含于基线且无新 tag → CURRENT", () => {
  const r = checkUpstream({
    base: headSha,
    refs: { main: headSha, tags: new Map([["v3.14.3", "x"]]) },
  });
  assert.equal(r.status, "CURRENT");
});

test("官方新 tag 未建分支 → TAGGED", () => {
  const r = checkUpstream({
    base: headSha,
    refs: { main: headSha, tags: new Map([["v9.9.9", "x"], ["v3.15.1", "y"]]) },
  });
  assert.equal(r.status, "TAGGED");
  assert.equal(r.newTag, "v9.9.9");
});

test("上游 main 领先基线（未打 tag）→ DRIFTED", () => {
  // 用一个不存在于本地的 sha 模拟领先的上游 main。
  const r = checkUpstream({
    base: headSha,
    refs: { main: "0".repeat(40), tags: new Map([["v3.15.1", "y"]]) },
  });
  assert.equal(r.status, "DRIFTED");
});

test("本地最新版本分支识别（3.16.2 为最大）", () => {
  const r = checkUpstream({ base: headSha, refs: { main: headSha, tags: new Map() } });
  assert.equal(r.localLatest, "3.16.2");
});
