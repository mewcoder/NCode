#!/usr/bin/env node
// NCode 构建产物审计：对打包后的 app.asar 与安装资源做只读检查，验证
// ncode-feature.md 的关闭承诺（docs/ncode-artifact-audit.spec.md）。
// 规则核心为纯函数、读取器可注入；任何一条失败退出码非零并逐条列出。

import { existsSync, readdirSync, readFileSync } from "node:fs";
import { createRequire } from "node:module";
import { basename, resolve } from "node:path";
import { fileURLToPath } from "node:url";

// 与 packages/desktop/scripts/bundle.mjs 的 requiredRuntimeModules 保持一致；
// 该清单是 Main/Host 外置运行时依赖的唯一事实源，此处只做产物存在性复查。
export const REQUIRED_ASAR_PACKAGES = [
  "module-details-from-path",
  "pngjs",
  "@babel/runtime",
  "undici",
  "node-forge",
  "yauzl",
  "asn1",
  "bcrypt-pbkdf",
  "tweetnacl",
];

// 一、6 遥测：ARMS / OpenTelemetry 属开发依赖，生产包不得携带其运行时。
const FORBIDDEN_ASAR_PACKAGE_PREFIXES = [
  "node_modules/@arms/",
  "node_modules/@opentelemetry/",
  // 一、10 Bot/群聊：飞书 SDK 只服务 Bot provider，关闭后不得进入生产包。
  "node_modules/@larksuiteoapi/",
];
// 一、6 遥测：NCode 构建期上报端点为空；该路径只会在重新启用遥测时进入 bundle。
const FORBIDDEN_BUNDLE_LITERALS = ["/api/v1/event/report"];
// 一、14 插件商店：不内置搜图插件。关闭面是插件包与定义（asar 内 bundled-agents/
// 定义类条目及 Resources/glm staging），不包含 renderer 的插件图标注册表资产
//（out/renderer/assets/plugin-icons，供已安装条目渲染，见 pluginIconSource.ts）。
const IMAGE_SEARCH_PATTERN = /image-search/;
const IMAGE_SEARCH_ASAR_ALLOWED_PREFIX = "out/renderer/assets/";
const GLM_STAGING_DIRS = ["Contents/Resources/glm/packages", "resources/glm/packages"];
// 二、1 NCode 品牌：前景标志为内联 N 形 SVG（ncode-feature.md 标志资源规则）。
const BRAND_RENDERER_ENTRY = "out/renderer/index.html";
const BRAND_MAIN_ENTRY = "out/main/index.js";
const BRAND_SVG_VIEWBOX = 'viewBox="0 0 218 256"';
const BRAND_SVG_TRANSFORM = "matrix(0 1 -1 0 218 0)";

export function normalizeAsarEntry(entry) {
  return entry.replaceAll("\\", "/").replace(/^\//, "");
}

/**
 * @param {{
 *   asarEntries: string[];
 *   readAsarEntry: (entry: string) => string;
 *   readExternalFile?: (relativePath: string) => string | null;
 *   listExternalDir?: (relativePath: string) => string[] | null;
 * }} input
 * @returns {{ rule: string; ok: boolean; detail: string }[]}
 */
export function collectAuditFindings(input) {
  const findings = [];
  const entries = input.asarEntries.map(normalizeAsarEntry);

  findings.push(
    ...FORBIDDEN_ASAR_PACKAGE_PREFIXES.map((prefix) => {
      const hits = entries.filter((entry) => entry.startsWith(prefix));
      return {
        rule: `禁止打包的关闭项依赖：${prefix}`,
        ok: hits.length === 0,
        detail: hits.length === 0 ? "未发现" : `命中：${hits.slice(0, 5).join(", ")}`,
      };
    }),
  );

  findings.push(
    ...REQUIRED_ASAR_PACKAGES.map((name) => {
      const prefix = `node_modules/${name}/`;
      const present = entries.some((entry) => entry.startsWith(prefix));
      return {
        rule: `关键运行时依赖必须在包内：${name}`,
        ok: present,
        detail: present ? "在包内" : `缺少 ${prefix}`,
      };
    }),
  );

  const imageSearchHits = entries.filter(
    (entry) =>
      IMAGE_SEARCH_PATTERN.test(entry) && !entry.startsWith(IMAGE_SEARCH_ASAR_ALLOWED_PREFIX),
  );
  findings.push({
    rule: "内置插件不得包含 image-search（asar，图标注册表除外）",
    ok: imageSearchHits.length === 0,
    detail:
      imageSearchHits.length === 0 ? "未发现" : `命中：${imageSearchHits.slice(0, 5).join(", ")}`,
  });

  if (input.listExternalDir) {
    for (const stagingDir of GLM_STAGING_DIRS) {
      const staged = input.listExternalDir(stagingDir);
      if (staged === null) continue;
      const hits = staged.filter((name) => IMAGE_SEARCH_PATTERN.test(name));
      findings.push({
        rule: `插件 staging 不得包含 image-search：${stagingDir}`,
        ok: hits.length === 0,
        detail: hits.length === 0 ? `共 ${staged.length} 个包，未发现` : `命中：${hits.join(", ")}`,
      });
    }
  }

  const appBundleEntries = entries.filter(
    (entry) => !entry.startsWith("node_modules/") && entry.endsWith(".js"),
  );
  for (const literal of FORBIDDEN_BUNDLE_LITERALS) {
    const hits = appBundleEntries.filter((entry) => input.readAsarEntry(entry).includes(literal));
    findings.push({
      rule: `应用 bundle 不得包含上报端点字面量：${literal}`,
      ok: hits.length === 0,
      detail: hits.length === 0 ? "未发现" : `命中：${hits.slice(0, 5).join(", ")}`,
    });
  }

  const rendererEntry = entries.find((entry) => entry === BRAND_RENDERER_ENTRY);
  const rendererOk = rendererEntry
    ? input.readAsarEntry(rendererEntry).includes(BRAND_SVG_VIEWBOX)
    : false;
  findings.push({
    rule: `Renderer 首页含 N 形前景 SVG（${BRAND_RENDERER_ENTRY}）`,
    ok: rendererOk,
    detail: rendererOk
      ? "标记存在"
      : rendererEntry
        ? "缺少 N 形 SVG 标记"
        : `缺少 ${BRAND_RENDERER_ENTRY}`,
  });

  const mainEntry = entries.find((entry) => entry === BRAND_MAIN_ENTRY);
  const mainOk = mainEntry ? input.readAsarEntry(mainEntry).includes(BRAND_SVG_TRANSFORM) : false;
  findings.push({
    rule: `主进程 bundle 含 N 形前景 SVG（${BRAND_MAIN_ENTRY}，关于窗口）`,
    ok: mainOk,
    detail: mainOk ? "标记存在" : mainEntry ? "缺少 N 形 SVG 标记" : `缺少 ${BRAND_MAIN_ENTRY}`,
  });

  if (input.readExternalFile) {
    // 一、5 应用内升级：publish 为本地占位；升级 feed 文件若存在不得指向真实远端。
    for (const feedPath of ["Contents/Resources/app-update.yml", "resources/app-update.yml"]) {
      const content = input.readExternalFile(feedPath);
      if (content === null) continue;
      const remoteFeed = content
        .split(/\r?\n/)
        .map((line) => line.trim())
        .filter(
          (line) =>
            /^url:\s*https?:\/\//i.test(line) && !/^url:\s*https?:\/\/localhost/i.test(line),
        );
      const ok = remoteFeed.length === 0;
      findings.push({
        rule: `升级 feed 不得指向远端：${feedPath}`,
        ok,
        detail: ok ? "仅本地占位或无 url" : `远端 url：${remoteFeed.join(", ")}`,
      });
    }

    const infoPlist = input.readExternalFile("Contents/Info.plist");
    if (infoPlist !== null) {
      const ok = infoPlist.includes("NCode");
      findings.push({
        rule: "macOS Info.plist 产品名包含 NCode",
        ok,
        detail: ok ? "产品名正确" : "Info.plist 未包含 NCode",
      });
    }
  }

  return findings;
}

function usage() {
  console.error(
    "用法: node scripts/ncode-artifact-audit.mjs --app <.app 目录 | unpacked 目录 | app.asar 文件>",
  );
}

export function resolveAppAsarPath(appPath) {
  if (basename(appPath) === "app.asar") return appPath;
  for (const candidate of ["Contents/Resources/app.asar", "resources/app.asar"]) {
    const resolved = resolve(appPath, candidate);
    if (existsSync(resolved)) return resolved;
  }
  return null;
}

function main() {
  const appIndex = process.argv.indexOf("--app");
  if (appIndex === -1 || !process.argv[appIndex + 1]) {
    usage();
    process.exit(2);
  }
  const appPath = resolve(process.argv[appIndex + 1]);
  if (!existsSync(appPath)) {
    console.error(`产物路径不存在: ${appPath}`);
    process.exit(2);
  }
  const appAsarPath = resolveAppAsarPath(appPath);
  if (!appAsarPath) {
    console.error(`未找到 app.asar（需提供 .app、unpacked 目录或 asar 文件）: ${appPath}`);
    process.exit(2);
  }

  const requireFromDesktop = createRequire(resolve("packages/desktop/package.json"));
  const asar = requireFromDesktop("@electron/asar");
  const entries = asar.listPackage(appAsarPath);
  const findings = collectAuditFindings({
    asarEntries: entries,
    readAsarEntry: (entry) => asar.extractFile(appAsarPath, entry).toString("utf8"),
    readExternalFile: (relativePath) => {
      const filePath = resolve(appPath, relativePath);
      return existsSync(filePath) ? readFileSync(filePath, "utf8") : null;
    },
    listExternalDir: (relativePath) => {
      const dirPath = resolve(appPath, relativePath);
      if (!existsSync(dirPath)) return null;
      try {
        return readdirSync(dirPath).map((name) => name);
      } catch {
        return null;
      }
    },
  });

  const failed = findings.filter((finding) => !finding.ok);
  for (const finding of findings) {
    const mark = finding.ok ? "PASS" : "FAIL";
    console.log(`[${mark}] ${finding.rule} — ${finding.detail}`);
  }
  console.log(
    `\n审计结果: ${findings.length - failed.length}/${findings.length} 通过（app.asar: ${appAsarPath}）`,
  );
  process.exit(failed.length === 0 ? 0 : 1);
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  main();
}
