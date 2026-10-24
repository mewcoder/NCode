import { existsSync } from "node:fs";
import { join } from "node:path";

export type UpstreamReplayFixtureMode = "compatible" | "strict-case-local";
export type UpstreamE2EHttpMode = "capture" | "replay";

export function resolveUpstreamE2EHttpMode({
  explicitReplayFixture,
  manualReview,
  requestedMode,
}: {
  explicitReplayFixture: boolean;
  manualReview: boolean;
  requestedMode?: string;
}): UpstreamE2EHttpMode {
  if (manualReview && explicitReplayFixture) {
    if (requestedMode === "capture") {
      throw new Error(
        "E2E_PROVIDER_REPLAY_FIXTURE_PATH cannot be combined with E2E_PROVIDER_HTTP_MODE=capture.",
      );
    }
    return "replay";
  }
  if (manualReview) {
    if (requestedMode && requestedMode !== "capture") {
      throw new Error(
        "Manual review defaults to capture; set E2E_PROVIDER_REPLAY_FIXTURE_PATH for pending replay.",
      );
    }
    return "capture";
  }
  return requestedMode === "capture" ? "capture" : "replay";
}

export function resolveUpstreamE2EHttpModeForWorker({
  caseLocalReplayFixtureAvailable = false,
  explicitReplayFixture,
  requestedMode,
  specs,
}: {
  caseLocalReplayFixtureAvailable?: boolean;
  explicitReplayFixture: boolean;
  requestedMode?: string;
  specs: readonly string[];
}): UpstreamE2EHttpMode {
  const captureFlags = new Set(
    specs.map((spec) => {
      const normalized = spec.replaceAll("\\", "/");
      return (
        (normalized.includes("/manual-review/") && !caseLocalReplayFixtureAvailable) ||
        normalized.endsWith("/upstream-provider.test.ts")
      );
    }),
  );
  if (captureFlags.size > 1) {
    throw new Error(
      "A single E2E worker cannot mix replay and capture specs because their provider HTTP modes differ.",
    );
  }
  return resolveUpstreamE2EHttpMode({
    explicitReplayFixture,
    // Upstream provider smoke 与缺 fixture 的 manual-review 验证真实上游；已有确定性
    // case-local fixture 的 pending case 使用 replay，避免真实模型形态破坏精确断言。
    manualReview: captureFlags.has(true),
    requestedMode,
  });
}

export function hasUpstreamCaseLocalReplayFixtureForWorker({
  caseFixtureDir,
  pathExists = existsSync,
  specs,
}: {
  caseFixtureDir: string;
  pathExists?: (path: string) => boolean;
  specs: readonly string[];
}): boolean {
  return (
    specs.length > 0 &&
    specs.every((spec) => {
      const entry = resolveReplayCase(spec);
      return Boolean(
        entry &&
        pathExists(
          join(resolveReplayCaseDir(caseFixtureDir, entry.domain), `${entry.caseName}.json`),
        ),
      );
    })
  );
}

interface ResolveUpstreamReplayFixturePathsOptions {
  caseFixtureDir: string;
  caseManifestDir: string;
  commonFixturePath: string;
  configuredFixturePaths: string[] | null;
  legacyFixturePaths: string[];
  mode: UpstreamReplayFixtureMode;
  pathExists?: (path: string) => boolean;
  pluginFixturePaths: string[];
  specs: string[];
}

export function resolveUpstreamReplayFixturePaths({
  caseFixtureDir,
  caseManifestDir,
  commonFixturePath,
  configuredFixturePaths,
  legacyFixturePaths,
  mode,
  pathExists = existsSync,
  pluginFixturePaths,
  specs,
}: ResolveUpstreamReplayFixturePathsOptions): string[] {
  if (configuredFixturePaths) {
    if (mode === "strict-case-local") {
      // 修复原因：strict CI 若接受显式 fixture 覆盖，就能再次绕过 case-local 合同并加载 legacy 池。
      throw new Error(
        "E2E_PROVIDER_REPLAY_FIXTURE_PATH cannot be used with strict-case-local replay fixtures.",
      );
    }
    return uniquePaths(configuredFixturePaths);
  }

  const cases = [
    ...new Map(
      specs
        .map(resolveReplayCase)
        .filter((entry): entry is ReplayCase => entry !== null)
        .map((entry) => [`${entry.domain}/${entry.caseName}`, entry] as const),
    ).values(),
  ];
  const caseFixturePaths = cases.map(({ domain, caseName }) =>
    join(resolveReplayCaseDir(caseFixtureDir, domain), `${caseName}.json`),
  );

  if (mode === "strict-case-local") {
    const missingPaths = [
      ...(pathExists(commonFixturePath) ? [] : [`common fixture: ${commonFixturePath}`]),
      ...cases.flatMap(({ domain, caseName }) => {
        const manifestPath = join(
          resolveReplayCaseDir(caseManifestDir, domain),
          `${caseName}.json`,
        );
        const fixturePath = join(resolveReplayCaseDir(caseFixtureDir, domain), `${caseName}.json`);
        return [
          ...(pathExists(manifestPath) ? [] : [`case manifest: ${manifestPath}`]),
          ...(pathExists(fixturePath) ? [] : [`case fixture: ${fixturePath}`]),
        ];
      }),
    ];
    if (missingPaths.length > 0) {
      throw new Error(
        `Strict case-local Upstream replay fixtures are incomplete:\n${missingPaths
          .map((path) => `- ${path}`)
          .join("\n")}`,
      );
    }
  }

  return uniquePaths([
    ...(pathExists(commonFixturePath) ? [commonFixturePath] : []),
    ...caseFixturePaths.filter(pathExists),
    ...(mode === "strict-case-local" ? [] : pluginFixturePaths),
    // 修复原因：formal CI 必须让缺失 matcher 直接失败，不能再由历史共享池替代 case-local fixture 假绿。
    ...(mode === "strict-case-local" ? [] : legacyFixturePaths),
  ]);
}

interface ReplayCase {
  domain: "conversation-session" | "ncode";
  caseName: string;
}

function resolveReplayCaseDir(conversationDir: string, domain: ReplayCase["domain"]): string {
  return domain === "ncode" ? join(conversationDir, "..", "ncode") : conversationDir;
}

function resolveReplayCase(spec: string): ReplayCase | null {
  const normalized = spec.replaceAll("\\", "/");
  // NCode 用例此前被当作无夹具候选而进入 capture；复用标准 sibling 目录，
  // 让默认发现与 strict 缺失校验使用同一份领域身份，不依赖手动环境变量。
  const domain = normalized.includes("/test/e2e/conversation-session/")
    ? "conversation-session"
    : normalized.includes("/test/e2e/ncode/")
      ? "ncode"
      : null;
  if (!domain) return null;
  const fileName = normalized.split("/").at(-1) ?? "";
  if (!fileName.endsWith(".test.ts") || fileName.includes("*")) {
    return null;
  }
  return { domain, caseName: fileName.slice(0, -".test.ts".length) };
}

function uniquePaths(paths: string[]): string[] {
  return [...new Set(paths)];
}
