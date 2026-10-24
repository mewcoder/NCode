// NCode 工作流文件全集清单：建新版本分支时从 ncode 分支带入的全部 NCode 专属文件
// （ncode-upstream-update skill §2 的机器可校验数据源）。清单与仓库实际文件双向校验
// （scripts/test/ncode-workflow-manifest.test.mjs），新增工作流文件时同步登记。

/** 必须随新分支复制、缺一则流程无法运行的文件。 */
export const NCODE_WORKFLOW_FILES = [
  // 需求与流程
  "ncode-feature.md",
  ".agents/skills/ncode-upstream-update/SKILL.md",
  // 工具链
  "scripts/ncode-closure-impact.mjs",
  "scripts/ncode-port-plan.mjs",
  "scripts/ncode-workflow-manifest.mjs",
  "scripts/test/ncode-workflow-manifest.test.mjs",
  "scripts/test/ncode-closure-impact.test.mjs",
  "scripts/test/ncode-port-plan.test.mjs",
  "scripts/ncode-artifact-audit.mjs",
  "scripts/test/ncode-artifact-audit.test.mjs",
  "scripts/ncode-branding.mjs",
  "scripts/test/ncode-branding.test.mjs",
  "packages/desktop/scripts/ncode-closure-registry.mjs",
  "packages/desktop/scripts/ncode-closure-registry.d.mts",
  "packages/desktop/scripts/ncode-e2e-baseline.mjs",
  "packages/desktop/scripts/ncode-e2e-baseline.d.mts",
  // 测试
  // 规则 spec 与基线记录
  "docs/ncode-closure-regression.spec.md",
  "docs/ncode-artifact-audit.spec.md",
  "docs/ncode-local-client-config.spec.md",
  "docs/ncode-runtime-footprint.md",
  "docs/ncode-test-dispositions.md",
];

/** NCode 专属 E2E 场景目录（含 manual-review 流程子目录），整体随新分支复制。 */
// 3.14.3 官方无 vitest/wdio 测试体系（仅 4 个孤立 .test.ts）：
// e2e 目录与锚点 vitest 文件不适用本版，锚点验收走
// `node scripts/ncode-closure-impact.mjs --validate`（CLI，无 runner 依赖）。
export const NCODE_WORKFLOW_DIRS = [];

/** 根 package.json 必须提供的命令入口。 */
export const NCODE_WORKFLOW_SCRIPTS = [
  "ncode:branding:check",
  "ncode:branding:sync",
  "ncode:artifact:audit",
  "ncode:closure:impact",
];

/** 发现规则：仓库内这些模式的 ncode 专属文件必须已登记，防止清单漂移。 */
export const NCODE_WORKFLOW_DISCOVERY_GLOBS = [
  { dir: "scripts", pattern: /^ncode-.*\.mjs$/ },
  { dir: "scripts/test", pattern: /^ncode-.*\.test\.mjs$/ },
  { dir: "packages/desktop/scripts", pattern: /^ncode-.*\.m(js|ts)$/ },
  { dir: "packages/desktop/test", pattern: /^ncode-.*\.test\.ts$/ },
  { dir: "docs", pattern: /^ncode-.*\.md$/ },
];
