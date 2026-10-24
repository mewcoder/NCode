import assert from "node:assert/strict";
import { existsSync, readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { test } from "node:test";
import {
  NCODE_WORKFLOW_DIRS,
  NCODE_WORKFLOW_DISCOVERY_GLOBS,
  NCODE_WORKFLOW_FILES,
  NCODE_WORKFLOW_SCRIPTS,
} from "../ncode-workflow-manifest.mjs";

const repoRoot = join(import.meta.dirname, "..", "..");

test("清单内每个工作流文件都真实存在", () => {
  const missing = NCODE_WORKFLOW_FILES.filter((file) => !existsSync(join(repoRoot, file)));
  assert.deepEqual(missing, [], "上游同步或重构后需更新 ncode-workflow-manifest.mjs");
});

test("清单目录存在且 NCode 专属 E2E 场景落在其中", () => {
  // 3.14.3 官方无 vitest/wdio 测试体系，e2e 目录与专属 spec 不适用本版；
  // 目录清单为空数组，仅保留循环以维持与其它版本的测试结构一致。
  for (const dir of NCODE_WORKFLOW_DIRS) {
    assert.ok(existsSync(join(repoRoot, dir)), `缺少目录 ${dir}`);
  }
});

test("根 package.json 提供全部工作流命令入口", () => {
  const scripts = JSON.parse(readFileSync(join(repoRoot, "package.json"), "utf8")).scripts ?? {};
  const missing = NCODE_WORKFLOW_SCRIPTS.filter((name) => !scripts[name]);
  assert.deepEqual(missing, [], "package.json 缺少 NCode 工作流入口");
});

test("仓库内 ncode 专属文件已全部登记（反向漂移检测）", () => {
  const registered = new Set(NCODE_WORKFLOW_FILES);
  const unregistered = [];
  for (const { dir, pattern } of NCODE_WORKFLOW_DISCOVERY_GLOBS) {
    for (const name of readdirSync(join(repoRoot, dir)).filter((entry) => pattern.test(entry))) {
      const relative = `${dir}/${name}`;
      if (!registered.has(relative)) unregistered.push(relative);
    }
  }
  assert.deepEqual(
    unregistered.sort(),
    [],
    "新增 ncode 专属文件需登记进 NCODE_WORKFLOW_FILES，否则建新分支时会丢失",
  );
});
