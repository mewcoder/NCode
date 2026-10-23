import assert from "node:assert/strict";
import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { test } from "node:test";
import { NCODE_CLOSED_E2E_SPECS } from "../../packages/desktop/scripts/ncode-e2e-baseline.mjs";
import { NCODE_CLOSURE_ANCHORS } from "../../packages/desktop/scripts/ncode-closure-registry.mjs";
import { matchClosureImpact, validateClosureRegistry } from "../ncode-closure-impact.mjs";

test("锚点文件命中时按 ncode-feature.md 章节分组输出", () => {
  const anchor = NCODE_CLOSURE_ANCHORS[0];
  assert.ok(anchor, "登记非空");
  const impact = matchClosureImpact([anchor.file]);
  assert.equal(impact.sections.length, 1);
  assert.equal(impact.sections[0].section, anchor.section);
  assert.deepEqual(impact.sections[0].files, [anchor.file]);
  assert.equal(impact.e2e.length, 0);
});

test("E2E 基线 spec 命中时换算仓库根路径并携带 feature", () => {
  const entry = NCODE_CLOSED_E2E_SPECS.find((item) => item.feature === "bots");
  assert.ok(entry);
  const impact = matchClosureImpact([`packages/desktop/${entry.spec.replace(/^\.\//, "")}`]);
  assert.equal(impact.e2e.length, 1);
  assert.equal(impact.e2e[0].feature, "bots");
  assert.equal(impact.sections.length, 0);
});

test("品牌资源与关键事实源分别命中，无关文件不产生输出", () => {
  const impact = matchClosureImpact([
    "packages/ui/src/assets/Z.svg",
    "scripts/build-time-config.mjs",
    "README.md",
  ]);
  assert.ok(impact.branding.includes("packages/ui/src/assets/Z.svg"));
  assert.ok(impact.critical.some((critical) => critical.path === "scripts/build-time-config.mjs"));
  assert.equal(impact.sections.length, 0);
  assert.equal(impact.e2e.length, 0);

  const empty = matchClosureImpact(["README.md"]);
  assert.equal(
    empty.sections.length + empty.e2e.length + empty.branding.length + empty.critical.length,
    0,
  );
});

test("validateClosureRegistry 对当前源码全部通过（锚点 + 策略值）", async () => {
  const { anchorTotal, failures } = await validateClosureRegistry();
  assert.equal(failures.length, 0, failures.map((f) => `${f.section}: ${f.detail}`).join("; "));
  assert.ok(anchorTotal > 0);
});

test("validateClosureRegistry 在无 policy.js 的老树上报差距而不崩溃", async () => {
  // 演练实证（2026-10-24 v3.15.1）：官方基线/老分支可能尚无本地策略模块，
  // 动态 import 失败必须落为差距项，不能让预检中断。
  const emptyRoot = mkdtempSync(join(tmpdir(), "ncode-no-policy-"));
  try {
    const { failures } = await validateClosureRegistry(emptyRoot);
    const policyGap = failures.find(
      (failure) =>
        failure.section === "NCODE_FEATURE_POLICY 策略值" && failure.detail.includes("不可用"),
    );
    assert.ok(policyGap, "缺少 policy.js 应报为策略差距项");
    assert.ok(failures.length >= NCODE_CLOSURE_ANCHORS.length, "全部锚点同报缺失");
  } finally {
    rmSync(emptyRoot, { recursive: true, force: true });
  }
});

test("validateClosureRegistry 支持按 git ref 校验：读取 git 内容而非工作区，旧版本产出差距清单", async () => {
  // 演练结论（2026-10-24）：对 v3.15.1 老版本应产出大量差距，供适配时逐章节核对。
  const legacy = await validateClosureRegistry(process.cwd(), { ref: "v3.15.1" });
  assert.ok(
    legacy.failures.length >= 20,
    `期望老版本存在大量锚点差距，实际 ${legacy.failures.length}`,
  );
  assert.ok(
    legacy.failures.every((failure) => failure.section !== "NCODE_FEATURE_POLICY 策略值"),
    "策略值读取的是当前工作区 policy.js，不应随 ref 漂移",
  );

  // ref 模式必须读 git 内容：工作区当前锚点全绿（上一用例），若 ref 校验与工作区
  // 结果完全相同则说明误读了工作区。用差距数量下界区分两种读取来源。
  assert.ok(legacy.failures.length > 0, "与工作区全绿结果不同，证明读取的是 ref 内容");
});
