#!/usr/bin/env node

import { execFile as execFileCallback } from "node:child_process";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { pathToFileURL } from "node:url";
import { promisify } from "node:util";

const execFile = promisify(execFileCallback);
const iconNames = [
  "16x16.png",
  "24x24.png",
  "32x32.png",
  "48x48.png",
  "64x64.png",
  "128x128.png",
  "256x256.png",
  "512x512.png",
  "1024x1024.png",
  "icon.icns",
  "icon.ico",
];
export const ASSET_PATHS = [
  ...iconNames.map((name) => `public/logo/icons/${name}`),
  ...iconNames
    .filter((name) => name.endsWith(".png"))
    .map((name) => `packages/desktop/build/icons/${name}`),
  ...[
    "icon.png",
    "icon.icns",
    "icon.ico",
    "icon_windows.png",
    "icon_installer.icns",
    "icon_installer.ico",
    "dmg_background.png",
    "dmg_background@2x.png",
  ].map((name) => `packages/desktop/build/${name}`),
  "packages/ui/src/assets/Z.svg",
  "packages/web/public/favicon.ico",
];
const foregroundPaths = [
  "packages/ui/src/components/ui/ZCodeAboutLogo.tsx",
  "packages/ui/src/root/RootStartupLoading.tsx",
  "packages/desktop/src/main/aboutWindow.ts",
  "packages/desktop/src/renderer/index.html",
  "packages/web/index.html",
];
const referenceChecks = [
  ["packages/ui/src/WindowsTopLeftLogo.tsx", "ZCodeStartupLogoBadge"],
  ["packages/ui/src/v4/ConversationDraftEmptyState.tsx", "@/assets/Z.svg"],
  [
    "packages/desktop/electron-builder.config.js",
    'from: "build/icon.png"',
    'icon: "build/icon_installer.icns"',
    'installerIcon: "build/icon_installer.ico"',
    'background: "build/dmg_background.png"',
  ],
  [
    "packages/desktop/scripts/desktop-product-identity.mjs",
    'productName: "NCode"',
    'productName: "NCode Preview"',
  ],
];
export const CONSUMER_PATHS = [...foregroundPaths, ...referenceChecks.map(([path]) => path)];
const inlineFaviconPattern = /href="data:image\/png;base64,[^"]+"/gu;

async function loadFiles(root, paths) {
  return new Map(
    await Promise.all(
      paths.map(async (path) => {
        try {
          return [path, await readFile(resolve(root, path))];
        } catch (cause) {
          throw new Error(`无法读取品牌文件：${path}`, { cause });
        }
      }),
    ),
  );
}

async function loadSourceAssets(root, sourceRef) {
  if (!sourceRef?.trim()) throw new Error("同步必须通过 --source-ref 明确指定品牌来源 commit/ref");
  const { stdout } = await execFile(
    "git",
    ["rev-parse", "--verify", "--end-of-options", `${sourceRef}^{commit}`],
    { cwd: root },
  );
  const commit = stdout.trim();
  const assets = new Map();
  // 逐个异步读取，避免为几十份二进制资源同时启动大量 Git 进程；读取全部成功才允许写入。
  for (const path of ASSET_PATHS) {
    try {
      const { stdout: bytes } = await execFile("git", ["show", `${commit}:${path}`], {
        cwd: root,
        encoding: "buffer",
        maxBuffer: 16 * 1024 * 1024,
      });
      assets.set(path, bytes);
    } catch (cause) {
      throw new Error(`品牌来源缺少资源或无法读取：${path} (${commit})`, { cause });
    }
  }
  return assets;
}

function faviconHref(bytes) {
  return `href="data:image/png;base64,${bytes.toString("base64")}"`;
}

export async function syncBranding({ root = process.cwd(), sourceRef }) {
  const assets = await loadSourceAssets(root, sourceRef);
  const consumers = await loadFiles(root, CONSUMER_PATHS);
  const webPath = "packages/web/index.html";
  const web = consumers.get(webPath).toString("utf8");
  if ([...web.matchAll(inlineFaviconPattern)].length !== 1) {
    throw new Error(`内联 favicon 结构已变化，未写入资源：${webPath}`);
  }
  for (const [path, bytes] of assets) {
    await mkdir(dirname(resolve(root, path)), { recursive: true });
    await writeFile(resolve(root, path), bytes);
  }
  // 只替换现有 favicon 数据，不复制旧版 HTML、启动逻辑或组件实现。
  await writeFile(
    resolve(root, webPath),
    web.replace(inlineFaviconPattern, faviconHref(assets.get("public/logo/icons/32x32.png"))),
  );
}

function foregroundPathsIn(source) {
  const group = source.match(/<g\s+transform="matrix\(0 1 -1 0 218 0\)">([\s\S]*?)<\/g>/u)?.[1];
  if (!group || !source.includes('viewBox="0 0 218 256"')) return null;
  const paths = [...group.matchAll(/<path\b([^>]+)>/gu)];
  if (
    paths.length !== 3 ||
    paths.some(([, attributes]) => !attributes.includes('fill="currentColor"'))
  )
    return null;
  return paths.map(([, attributes]) => attributes.match(/\bd="([^"]+)"/u)?.[1]).join("\n");
}

export async function checkBranding({ root = process.cwd(), sourceRef } = {}) {
  const errors = [];
  let assets;
  let consumers;
  try {
    [assets, consumers] = await Promise.all([
      loadFiles(root, ASSET_PATHS),
      loadFiles(root, CONSUMER_PATHS),
    ]);
  } catch (error) {
    return [error.message];
  }
  const pairs = [
    ...iconNames
      .filter((name) => name.endsWith(".png"))
      .map((name) => [`public/logo/icons/${name}`, `packages/desktop/build/icons/${name}`]),
    ["public/logo/icons/icon.icns", "packages/desktop/build/icon.icns"],
    ["public/logo/icons/icon.ico", "packages/desktop/build/icon.ico"],
    ["public/logo/icons/icon.ico", "packages/web/public/favicon.ico"],
    ["public/logo/icons/1024x1024.png", "packages/desktop/build/icon_windows.png"],
  ];
  for (const [source, target] of pairs) {
    if (!assets.get(source).equals(assets.get(target)))
      errors.push(`品牌资源不一致：${target} ← ${source}`);
  }
  const canonical = consumers.get(foregroundPaths[0]).toString("utf8");
  const geometry = foregroundPathsIn(canonical);
  for (const path of foregroundPaths) {
    if (!geometry || foregroundPathsIn(consumers.get(path).toString("utf8")) !== geometry)
      errors.push(`前景 N 形标志不一致或结构变化：${path}`);
    if (consumers.get(path).toString("utf8").includes("assets/Z.svg"))
      errors.push(`背景水印不能作为前景标志：${path}`);
  }
  if (!/export function ZCodeWordmarkLogo[\s\S]*?>NCode<\/span>/u.test(canonical))
    errors.push(`NCode 文字字标缺失：${foregroundPaths[0]}`);
  for (const [path, ...references] of referenceChecks) {
    for (const reference of references) {
      if (!consumers.get(path).toString("utf8").includes(reference))
        errors.push(`品牌引用缺失：${path} (${reference})`);
    }
  }
  const web = consumers.get("packages/web/index.html").toString("utf8");
  if (
    web.match(inlineFaviconPattern)?.join() !==
    faviconHref(assets.get("public/logo/icons/32x32.png"))
  )
    errors.push("内联 favicon 与公开图标不一致：packages/web/index.html");
  if (!web.includes("<title>NCode</title>"))
    errors.push("Web 标题不是 NCode：packages/web/index.html");
  if (sourceRef) {
    const expected = await loadSourceAssets(root, sourceRef);
    for (const [path, bytes] of expected) {
      if (!assets.get(path).equals(bytes)) errors.push(`品牌资源与来源不一致：${path}`);
    }
  }
  return errors;
}

async function main() {
  const args = process.argv.slice(2);
  let mode = "--check";
  let sourceRef;
  for (let index = 0; index < args.length; index++) {
    const arg = args[index];
    if (arg === "--sync" || arg === "--check") mode = arg;
    else if (arg === "--source-ref" && args[index + 1]) sourceRef = args[++index];
    else
      throw new Error(
        `未知参数：${arg}；用法：ncode-branding.mjs [--check|--sync] [--source-ref <ref>]`,
      );
  }
  if (mode === "--sync") await syncBranding({ sourceRef });
  const errors = await checkBranding({ sourceRef });
  if (errors.length) throw new Error(errors.join("\n"));
  console.log(
    `[ncode-branding] ${mode === "--sync" ? "同步与检查" : "检查"}通过：${ASSET_PATHS.length} 个资源，${CONSUMER_PATHS.length} 个消费文件`,
  );
}

if (process.argv[1] && import.meta.url === pathToFileURL(resolve(process.argv[1])).href) {
  main().catch((error) => {
    console.error(`[ncode-branding] ${error.message}`);
    process.exitCode = 1;
  });
}
