// ncode-port-plan 的回归测试：3.14.3/3.15.1 两轮实测校准的量化基线。
import assert from "node:assert/strict";
import { test } from "node:test";
import { buildPortPlan, formatPortPlan } from "../ncode-port-plan.mjs";

// 两轮实测校准值：3.15.1（逐版本，乐观冲突 63）、3.14.3（跨版本，162）。
// 若上游或序列变更导致数值漂移，先人工核对再更新基线——数值骤降通常是
// merge-tree 模拟失效（如 merge-base 解析失败退化为平凡合并），需要警惕。
const BASELINES = {
  "v3.15.1": { minConflicts: 30, maxConflicts: 90, cleanCommits: { min: 1, max: 6 } },
  "v3.14.3": { minConflicts: 100, maxConflicts: 260, cleanCommits: { min: 0, max: 2 } },
};

test("port-plan 对 3.15.1/3.14.3 的冲突量化落在实测基线内", async () => {
  for (const [target, baseline] of Object.entries(BASELINES)) {
    const plan = buildPortPlan({ fromRef: "fec06cb4", targetRef: target });
    assert.equal(plan.totalCommits, 15, `${target}: 序列提交数`);
    assert.ok(
      plan.totalConflicts >= baseline.minConflicts && plan.totalConflicts <= baseline.maxConflicts,
      `${target}: 冲突 ${plan.totalConflicts} 不在基线 [${baseline.minConflicts}, ${baseline.maxConflicts}]`,
    );
    assert.ok(
      plan.cleanCommits >= baseline.cleanCommits.min && plan.cleanCommits <= baseline.cleanCommits.max,
      `${target}: 干净提交 ${plan.cleanCommits} 越界`,
    );
    const text = formatPortPlan(plan);
    assert.match(text, /移植计划：15 提交/);
    // 每个冲突条目必须能指出具体文件，供人工移植核对
    const firstConf = plan.plan.find((step) => step.conflicts.length > 0);
    assert.ok(firstConf, `${target}: 至少一个提交有冲突清单`);
    assert.ok(firstConf.conflicts.every((f) => !f.includes(" ")), `${target}: 冲突清单为纯路径`);
  }
});

test("port-plan 乐观路径不触碰工作区（无副作用）", async () => {
  const { execFileSync } = await import("node:child_process");
  const before = execFileSync("git", ["status", "--porcelain"], {
    encoding: "utf8",
    cwd: new URL("..", import.meta.url).pathname,
  });
  buildPortPlan({ fromRef: "fec06cb4", targetRef: "v3.15.1" });
  const after = execFileSync("git", ["status", "--porcelain"], {
    encoding: "utf8",
    cwd: new URL("..", import.meta.url).pathname,
  });
  assert.equal(after, before, "port-plan 不得改动工作区状态");
});
