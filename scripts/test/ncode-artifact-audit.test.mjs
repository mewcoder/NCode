import assert from "node:assert/strict";
import { execFile } from "node:child_process";
import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { createRequire } from "node:module";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";
import { test } from "node:test";
import { promisify } from "node:util";
import {
  REQUIRED_ASAR_PACKAGES,
  collectAuditFindings,
  normalizeAsarEntry,
  resolveAppAsarPath,
} from "../ncode-artifact-audit.mjs";

const execFileAsync = promisify(execFile);

function buildCleanEntries() {
  return [
    "/out/renderer/index.html",
    "/out/main/index.js",
    "/out/host/index.js",
    ...REQUIRED_ASAR_PACKAGES.map((name) => `/node_modules/${name}/index.js`),
  ];
}

function buildCleanInput(overrides = {}) {
  const files = new Map(
    buildCleanEntries().map((entry) => [
      normalizeAsarEntry(entry),
      entry.includes("renderer/index.html")
        ? `<html><body><svg viewBox="0 0 218 256"><g transform="matrix(0 1 -1 0 218 0)"></g></svg></body></html>`
        : entry.endsWith("out/main/index.js")
          ? 'const logo = `<g transform="matrix(0 1 -1 0 218 0)"></g>`;'
          : "// runtime module",
    ]),
  );
  return {
    asarEntries: buildCleanEntries(),
    readAsarEntry: (entry) => files.get(normalizeAsarEntry(entry)) ?? "",
    ...overrides,
  };
}

function ruleMap(findings) {
  return new Map(findings.map((finding) => [finding.rule, finding.ok]));
}

test("NAA01: 合成产物满足全部规则时审计通过", () => {
  const findings = collectAuditFindings(buildCleanInput());
  assert.ok(findings.length > 0);
  for (const finding of findings) {
    assert.ok(finding.ok, `不应失败: ${finding.rule} — ${finding.detail}`);
  }
});

test("NAA02: asar 携带 ARMS / OpenTelemetry / 飞书 SDK 时对应规则失败", () => {
  const bad = buildCleanInput({
    asarEntries: [...buildCleanEntries(), "/node_modules/@arms/rum-electron/index.js"],
  });
  const rules = ruleMap(collectAuditFindings(bad));
  assert.equal(rules.get("禁止打包的关闭项依赖：node_modules/@arms/"), false);
  assert.equal(rules.get("禁止打包的关闭项依赖：node_modules/@opentelemetry/"), true);
  assert.equal(rules.get("禁止打包的关闭项依赖：node_modules/@larksuiteoapi/"), true);

  const feishu = buildCleanInput({
    asarEntries: [...buildCleanEntries(), "/node_modules/@larksuiteoapi/node-sdk/lib/index.js"],
  });
  assert.equal(
    ruleMap(collectAuditFindings(feishu)).get("禁止打包的关闭项依赖：node_modules/@larksuiteoapi/"),
    false,
  );
});

test("NAA03: bundle 含上报端点字面量或升级 feed 指向远端时失败", () => {
  const badBundle = buildCleanInput();
  badBundle.readAsarEntry = (entry) =>
    normalizeAsarEntry(entry) === "out/host/index.js"
      ? 'fetch("https://zcode.z.ai/api/v1/event/report")'
      : buildCleanInput().readAsarEntry(entry);
  const bundleRules = ruleMap(collectAuditFindings(badBundle));
  assert.equal(bundleRules.get("应用 bundle 不得包含上报端点字面量：/api/v1/event/report"), false);

  const remoteFeed = collectAuditFindings({
    ...buildCleanInput(),
    readExternalFile: (path) =>
      path === "Contents/Resources/app-update.yml" ? "url: https://cdn.example.test/feed" : null,
  });
  assert.equal(
    ruleMap(remoteFeed).get("升级 feed 不得指向远端：Contents/Resources/app-update.yml"),
    false,
  );

  const localFeed = collectAuditFindings({
    ...buildCleanInput(),
    readExternalFile: (path) =>
      path === "Contents/Resources/app-update.yml" ? "url: http://localhost:8081" : null,
  });
  assert.equal(
    ruleMap(localFeed).get("升级 feed 不得指向远端：Contents/Resources/app-update.yml"),
    true,
  );
});

test("NAA04: image-search 关闭面命中时失败，图标注册表资产放行", () => {
  const imageSearch = ruleMap(
    collectAuditFindings(
      buildCleanInput({
        asarEntries: [...buildCleanEntries(), "/bundled-agents/image-search/definition.json"],
      }),
    ),
  );
  assert.equal(imageSearch.get("内置插件不得包含 image-search（asar，图标注册表除外）"), false);

  // renderer 图标注册表资产（pluginIconSource.ts）不属于插件关闭面，放行。
  const iconAllowed = ruleMap(
    collectAuditFindings({
      asarEntries: [...buildCleanEntries(), "/out/renderer/assets/image-search-B2-NSEqd.png"],
      readAsarEntry: buildCleanInput().readAsarEntry,
    }),
  );
  assert.equal(iconAllowed.get("内置插件不得包含 image-search（asar，图标注册表除外）"), true);

  const stagingHit = ruleMap(
    collectAuditFindings({
      ...buildCleanInput(),
      listExternalDir: (path) =>
        path === "Contents/Resources/glm/packages"
          ? ["browser-use-plugin", "image-search-plugin"]
          : null,
    }),
  );
  assert.equal(
    stagingHit.get("插件 staging 不得包含 image-search：Contents/Resources/glm/packages"),
    false,
  );

  const noBrand = buildCleanInput();
  const originalRead = noBrand.readAsarEntry;
  noBrand.readAsarEntry = (entry) =>
    normalizeAsarEntry(entry) === "out/renderer/index.html" ? "<html></html>" : originalRead(entry);
  const brandRules = ruleMap(collectAuditFindings(noBrand));
  assert.equal(brandRules.get("Renderer 首页含 N 形前景 SVG（out/renderer/index.html）"), false);

  const macIdentity = ruleMap(
    collectAuditFindings({
      ...buildCleanInput(),
      readExternalFile: (path) =>
        path === "Contents/Info.plist" ? "<plist><string>ZCode</string></plist>" : null,
    }),
  );
  assert.equal(macIdentity.get("macOS Info.plist 产品名包含 NCode"), false);
});

test("NAA05: 产物路径无效或缺 app.asar 时无法解析", () => {
  assert.equal(resolveAppAsarPath("/definitely/not/exist/NCode.app"), null);
  assert.equal(resolveAppAsarPath(resolve("scripts/test")), null);
});

test("NAA06: 真实 asar 的 CLI 端到端审计通过并输出通过项", async () => {
  const requireFromDesktop = createRequire(resolve("packages/desktop/package.json"));
  const asar = requireFromDesktop("@electron/asar");
  const staging = mkdtempSync(join(tmpdir(), "ncode-audit-"));
  const appDir = join(staging, "NCode.app", "Contents", "Resources");
  try {
    for (const name of REQUIRED_ASAR_PACKAGES) {
      mkdirSync(join(staging, "app", "node_modules", name), { recursive: true });
      writeFileSync(join(staging, "app", "node_modules", name, "index.js"), "module.exports = {};");
    }
    mkdirSync(join(staging, "app", "out", "renderer"), { recursive: true });
    mkdirSync(join(staging, "app", "out", "main"), { recursive: true });
    writeFileSync(
      join(staging, "app", "out", "renderer", "index.html"),
      '<svg viewBox="0 0 218 256"></svg>',
    );
    writeFileSync(
      join(staging, "app", "out", "main", "index.js"),
      'const t = "matrix(0 1 -1 0 218 0)";',
    );
    mkdirSync(appDir, { recursive: true });
    await asar.createPackage(join(staging, "app"), join(appDir, "app.asar"));

    const { stdout } = await execFileAsync(process.execPath, [
      "scripts/ncode-artifact-audit.mjs",
      "--app",
      join(staging, "NCode.app"),
    ]);
    assert.match(stdout, /审计结果: \d+\/\d+ 通过/);
    assert.doesNotMatch(stdout, /\[FAIL\]/);
  } finally {
    rmSync(staging, { recursive: true, force: true });
  }
});
