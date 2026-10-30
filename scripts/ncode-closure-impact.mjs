#!/usr/bin/env node
// NCode 关闭项影响映射：以上游 diff（或文件清单）对照关闭项登记（锚点、E2E 基线、
// 品牌资源、策略文件），输出受影响的关闭项清单，替代每版更新后的人工排查。
// 规则与单一事实源见 docs/ncode-closure-regression.spec.md。

import { execFileSync } from "node:child_process";
import { readFileSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import { NCODE_CLOSED_E2E_SPECS } from "../packages/desktop/scripts/ncode-e2e-baseline.mjs";
import {
  EXPECTED_NCODE_FEATURE_POLICY,
  NCODE_CLOSURE_ANCHORS,
} from "../packages/desktop/scripts/ncode-closure-registry.mjs";
import { ASSET_PATHS, CONSUMER_PATHS } from "./ncode-branding.mjs";

const repoRoot = resolve(dirname(fileURLToPath(import.meta.url)), "..");

// 除锚点外必须纳入影响面的共享事实源。
const CRITICAL_PATHS = [
  { path: "packages/shared/src/ncode-feature-policy/policy.js", reason: "本地策略唯一来源" },
  { path: "packages/shared/src/ncode-feature-policy/policy.d.ts", reason: "本地策略类型" },
  { path: "scripts/build-time-config.mjs", reason: "构建期遥测/升级开关" },
  { path: "packages/desktop/scripts/ncode-e2e-baseline.mjs", reason: "NCode E2E 基线清单" },
  { path: "packages/desktop/scripts/ncode-closure-registry.mjs", reason: "关闭项锚点登记" },
  { path: "scripts/ncode-artifact-audit.mjs", reason: "构建产物审计规则" },
];

function listChangedFiles(base, head) {
  const range = head ? `${base}...${head}` : base;
  const stdout = execFileSync("git", ["diff", "--name-only", range], {
    cwd: repoRoot,
    encoding: "utf8",
    maxBuffer: 64 * 1024 * 1024,
  });
  return stdout
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean);
}

/**
 * 把变更文件清单映射到关闭项登记。
 * @param {string[]} changedFiles 相对仓库根的变更文件
 * @param {{ anchors?: typeof NCODE_CLOSURE_ANCHORS, e2eSpecs?: typeof NCODE_CLOSED_E2E_SPECS }} [registries]
 */
export function matchClosureImpact(changedFiles, registries = {}) {
  const anchors = registries.anchors ?? NCODE_CLOSURE_ANCHORS;
  const e2eSpecs = registries.e2eSpecs ?? NCODE_CLOSED_E2E_SPECS;
  const changed = new Set(changedFiles);

  const bySection = new Map();
  for (const anchor of anchors) {
    if (!changed.has(anchor.file)) continue;
    const entry = bySection.get(anchor.section) ?? {
      section: anchor.section,
      files: new Set(),
      sources: new Set(),
    };
    entry.files.add(anchor.file);
    entry.sources.add("锚点");
    bySection.set(anchor.section, entry);
  }

  const e2eHits = [];
  for (const entry of e2eSpecs) {
    // E2E 基线 spec 以 ./test/e2e/ 前缀登记；diff 路径相对仓库根。
    const specPath = `packages/desktop/${entry.spec.replace(/^\.\//, "")}`;
    if (changed.has(specPath)) {
      e2eHits.push({ feature: entry.feature, spec: entry.spec });
    }
  }

  const brandingHits = [...ASSET_PATHS, ...CONSUMER_PATHS].filter((asset) => changed.has(asset));
  const criticalHits = CRITICAL_PATHS.filter((critical) => changed.has(critical.path));

  return {
    sections: [...bySection.values()].map((entry) => ({
      section: entry.section,
      files: [...entry.files],
      sources: [...entry.sources],
    })),
    e2e: e2eHits,
    branding: brandingHits,
    critical: criticalHits,
  };
}

async function importPolicy(root) {
  // 与 scripts/build-time-config.mjs 相同的读取方式：直接消费源码 policy.js，不依赖构建产物。
  return import(
    pathToFileURL(join(root, "packages/shared/src/ncode-feature-policy/policy.js")).href
  );
}

/**
 * 重放全部锚点与策略值，输出逐项失败；供上游更新后快速预检。
 * @param {string} root 仓库根（读取源码 policy.js）
 * @param {{ ref?: string }} [options] ref 提供时锚点文件改用 `git show <ref>:<file>` 读取，
 *   不需要 worktree/checkout——面向更新流程：对官方基线或历史快照直接产出差距清单。
 */
export async function validateClosureRegistry(root = repoRoot, options = {}) {
  const ref = options.ref;
  const failures = [];
  for (const anchor of NCODE_CLOSURE_ANCHORS) {
    let content = null;
    let missing = false;
    if (ref) {
      try {
        content = execFileSync("git", ["show", `${ref}:${anchor.file}`], {
          cwd: root,
          encoding: "utf8",
          maxBuffer: 64 * 1024 * 1024,
          stdio: ["ignore", "pipe", "ignore"],
        });
      } catch {
        missing = true;
      }
    } else {
      try {
        content = readFileSync(join(root, anchor.file), "utf8");
      } catch {
        missing = true;
      }
    }
    // 上游新增文件的锚点：被校验树没有该文件说明该版本尚无此功能面，无需关闭接线，跳过；
    // 文件存在（含 ref 模式）则照常校验，防止老版本以后回移该功能时漏掉关闭要求。
    if (missing && anchor.upstreamIntroducedIn) {
      continue;
    }
    // 机制级前置条件：文件存在但被关闭的机制尚未引入（如旧版本无启动重连批次），
    // 关闭承诺天然满足，跳过；机制引入后主 pattern 照常校验。
    if (!missing && anchor.requiresPattern && !anchor.requiresPattern.test(content ?? "")) {
      continue;
    }
    const matched = missing ? false : anchor.pattern.test(content ?? "");
    const ok = missing ? false : anchor.kind === "require" ? matched : !matched;
    if (!ok) {
      failures.push({
        section: anchor.section,
        detail: missing
          ? `锚点文件不存在${ref ? `（${ref}）` : ""}：${anchor.file}`
          : `${anchor.kind === "require" ? "关闭接线缺失" : "已关闭入口回流"}：${anchor.file} /${anchor.pattern.source}/`,
      });
    }
  }

  // 演练实证（v3.15.1）：老树/官方基线可能尚无 policy.js（该模块晚于其建立），
  // 动态 import 会直接抛错崩溃；此时应把策略源缺失报为差距项，而不是中断预检。
  let policy;
  try {
    policy = await importPolicy(root);
  } catch {
    policy = null;
  }
  if (!policy) {
    failures.push({
      section: "NCODE_FEATURE_POLICY 策略值",
      detail: `本地策略源不可用（${root} 无 policy.js 或导入失败），视为差距项`,
    });
  } else {
    const { NCODE_FEATURE_POLICY } = policy;
    for (const [key, expected] of Object.entries(EXPECTED_NCODE_FEATURE_POLICY)) {
      if (JSON.stringify(NCODE_FEATURE_POLICY[key]) !== JSON.stringify(expected)) {
        failures.push({
          section: "NCODE_FEATURE_POLICY 策略值",
          detail: `${key}: 期望 ${JSON.stringify(expected)}，实际 ${JSON.stringify(NCODE_FEATURE_POLICY[key])}`,
        });
      }
    }
  }
  return { anchorTotal: NCODE_CLOSURE_ANCHORS.length, failures };
}

function printReport(impact) {
  const parts = [];
  if (impact.sections.length > 0) {
    parts.push("受影响关闭项（按 ncode-feature.md 章节）：");
    for (const entry of impact.sections) {
      parts.push(`  - ${entry.section}`);
      for (const file of entry.files) parts.push(`      ${file}`);
    }
  }
  if (impact.e2e.length > 0) {
    parts.push("NCode E2E 基线命中（已排除 spec 被上游改动，核对是否需要重评）：");
    for (const hit of impact.e2e) parts.push(`  - [${hit.feature}] ${hit.spec}`);
  }
  if (impact.branding.length > 0) {
    parts.push("品牌资源/消费文件命中：");
    for (const asset of impact.branding) parts.push(`  - ${asset}`);
  }
  if (impact.critical.length > 0) {
    parts.push("关键事实源命中：");
    for (const critical of impact.critical)
      parts.push(`  - ${critical.path}（${critical.reason}）`);
  }
  if (parts.length === 0) {
    console.log("未命中任何关闭项登记；本次变更与 NCode 关闭面无交集。");
    return false;
  }
  console.log(parts.join("\n"));
  console.log("\n处理指引：按上述章节核对 ncode-feature.md，更新锚点/基线登记后运行");
  console.log(
    "  pnpm test:engineering packages/desktop/test/ncode-closure-anchors.test.ts packages/desktop/test/ncode-e2e-baseline.test.ts",
  );
  return true;
}

function usage() {
  console.error("用法:");
  console.error(
    "  node scripts/ncode-closure-impact.mjs --base <git-ref> [--head <git-ref>]  # 影响映射",
  );
  console.error(
    "  node scripts/ncode-closure-impact.mjs --validate [--ref <git-ref>]         # 锚点预检（ref 缺省读工作区）",
  );
}

async function main() {
  const args = process.argv.slice(2);
  if (args.includes("--validate")) {
    const refIndex = args.indexOf("--ref");
    const ref = refIndex !== -1 ? args[refIndex + 1] : undefined;
    const { anchorTotal, failures } = await validateClosureRegistry(repoRoot, { ref });
    const scope = ref ? `（ref: ${ref}）` : "（工作区）";
    for (const failure of failures) console.error(`[FAIL] ${failure.section} — ${failure.detail}`);
    const failedAnchors = failures.filter(
      (failure) => failure.section !== "NCODE_FEATURE_POLICY 策略值",
    ).length;
    const failedPolicy = failures.length - failedAnchors;
    console.log(
      `\n锚点预检${scope}: 锚点 ${anchorTotal - failedAnchors}/${anchorTotal}，策略值 ${failedPolicy === 0 ? "全部一致" : `${failedPolicy} 项漂移`}`,
    );
    process.exit(failures.length === 0 ? 0 : 1);
  }

  const baseIndex = args.indexOf("--base");
  const headIndex = args.indexOf("--head");
  const base = baseIndex !== -1 ? args[baseIndex + 1] : undefined;
  const head = headIndex !== -1 ? args[headIndex + 1] : undefined;
  if (!base) {
    usage();
    process.exit(2);
  }
  const changedFiles = listChangedFiles(base, head);
  printReport(matchClosureImpact(changedFiles));
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  await main();
}
