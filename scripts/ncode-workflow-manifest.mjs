// NCode 工作流文件全集清单：建新版本分支时从 ncode 分支带入的全部 NCode 专属文件
// （ncode-upstream-update skill §2 的机器可校验数据源）。清单与仓库实际文件双向校验
// （scripts/test/ncode-workflow-manifest.test.mjs），新增工作流文件时同步登记。
import { join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { existsSync, readFileSync, readdirSync } from "node:fs";

const repoRoot = resolve(import.meta.dirname, "..");

/** 必须随新分支复制、缺一则流程无法运行的文件。 */
export const NCODE_WORKFLOW_FILES = [
  // 需求与流程
  "ncode-feature.md",
  ".agents/skills/ncode-upstream-update/SKILL.md",
  // 工具链
  "scripts/ncode-closure-impact.mjs",
  "scripts/ncode-workflow-manifest.mjs",
  "scripts/test/ncode-workflow-manifest.test.mjs",
  "scripts/test/ncode-closure-impact.test.mjs",
  "scripts/ncode-artifact-audit.mjs",
  "scripts/test/ncode-artifact-audit.test.mjs",
  "scripts/ncode-port-plan.mjs",
  "scripts/ncode-upstream-check.mjs",
  "scripts/ncode-locale-check.mjs",
  "scripts/ncode-mock-cdn-clean.mjs",
  "scripts/ncode-branding.mjs",
  "scripts/test/ncode-branding.test.mjs",
  "scripts/test/ncode-port-plan.test.mjs",
  "scripts/test/ncode-upstream-check.test.mjs",
  "packages/desktop/scripts/ncode-closure-registry.mjs",
  "packages/desktop/scripts/ncode-closure-registry.d.mts",
  "packages/desktop/scripts/ncode-e2e-baseline.mjs",
  "packages/desktop/scripts/ncode-e2e-baseline.d.mts",
  // 测试
  "packages/desktop/test/ncode-closure-anchors.test.ts",
  "packages/desktop/test/ncode-e2e-baseline.test.ts",
  // 规则 spec 与基线记录
  "docs/ncode-closure-regression.spec.md",
  "docs/ncode-artifact-audit.spec.md",
  "docs/ncode-local-client-config.spec.md",
  "docs/ncode-runtime-footprint.md",
  "docs/ncode-test-dispositions.md",
];

/** NCode 专属 E2E 场景目录（含 manual-review 流程子目录），整体随新分支复制。 */
export const NCODE_WORKFLOW_DIRS = [
  "packages/desktop/test/e2e/ncode",
  "packages/desktop/test/e2e/fixtures/upstream/ncode",
  "packages/desktop/test/e2e/fixtures/cases/ncode",
];

/** 根 package.json 必须提供的命令入口。 */
export const NCODE_WORKFLOW_SCRIPTS = [
  "ncode:branding:check",
  "ncode:branding:sync",
  "ncode:artifact:audit",
  "ncode:closure:impact",
  "ncode:port:plan",
  "ncode:upstream:check",
  "ncode:locale:check",
  "ncode:mock-cdn:clean",
];

/** 发现规则：仓库内这些模式的 ncode 专属文件必须已登记，防止清单漂移。 */
export const NCODE_WORKFLOW_DISCOVERY_GLOBS = [
  { dir: "scripts", pattern: /^ncode-.*\.mjs$/ },
  { dir: "scripts/test", pattern: /^ncode-.*\.test\.mjs$/ },
  { dir: "packages/desktop/scripts", pattern: /^ncode-.*\.m(js|ts)$/ },
  { dir: "packages/desktop/test", pattern: /^ncode-.*\.test\.ts$/ },
  { dir: "docs", pattern: /^ncode-.*\.md$/ },
];

// CLI 自检入口：node scripts/ncode-workflow-manifest.mjs --check
// 与 scripts/test/ncode-workflow-manifest.test.mjs 同一检查面（文件/目录/script 条目/反向漂移），
// 防止只跑 CLI 的环境拿到假阳性（本模块作为纯数据被 import 时 node 会直接 exit 0）。
if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const failures = [];
  for (const f of NCODE_WORKFLOW_FILES) {
    if (!existsSync(join(repoRoot, f))) failures.push(`缺少工作流文件：${f}`);
  }
  for (const d of NCODE_WORKFLOW_DIRS) {
    if (!existsSync(join(repoRoot, d))) failures.push(`缺少工作流目录：${d}`);
  }
  const scripts = JSON.parse(readFileSync(join(repoRoot, "package.json"), "utf8")).scripts ?? {};
  for (const name of NCODE_WORKFLOW_SCRIPTS) {
    if (!scripts[name]) failures.push(`package.json 缺少工作流命令入口：${name}`);
  }
  const registered = new Set(NCODE_WORKFLOW_FILES);
  for (const { dir, pattern } of NCODE_WORKFLOW_DISCOVERY_GLOBS) {
    const abs = join(repoRoot, dir);
    if (!existsSync(abs)) continue;
    for (const name of readdirSync(abs).filter((entry) => pattern.test(entry))) {
      const relative = `${dir}/${name}`;
      if (!registered.has(relative)) failures.push(`未登记的 ncode 专属文件：${relative}`);
    }
  }
  if (failures.length > 0) {
    console.error(`[manifest] 自检失败（${failures.length} 项）：\n${failures.join("\n")}`);
    process.exit(1);
  }
  console.log(
    `[manifest] 自检通过：${NCODE_WORKFLOW_FILES.length} 文件 + ${NCODE_WORKFLOW_DIRS.length} 目录 + ${NCODE_WORKFLOW_SCRIPTS.length} script 条目`,
  );
}
