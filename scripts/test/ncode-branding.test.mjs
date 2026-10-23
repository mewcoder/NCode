import assert from "node:assert/strict";
import { execFile as execFileCallback } from "node:child_process";
import { cp, mkdir, mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { dirname, resolve } from "node:path";
import { test } from "node:test";
import { promisify } from "node:util";
import { ASSET_PATHS, CONSUMER_PATHS, checkBranding, syncBranding } from "../ncode-branding.mjs";

const execFile = promisify(execFileCallback);
const repositoryRoot = resolve(import.meta.dirname, "../..");

async function fixture(t) {
  const root = await mkdtemp(resolve(tmpdir(), "ncode-branding-"));
  t.after(() => rm(root, { recursive: true, force: true }));
  for (const path of [...ASSET_PATHS, ...CONSUMER_PATHS]) {
    await mkdir(dirname(resolve(root, path)), { recursive: true });
    await cp(resolve(repositoryRoot, path), resolve(root, path));
  }
  const git = (...args) => execFile("git", args, { cwd: root });
  await git("init", "--quiet");
  await git("add", ".");
  await git(
    "-c",
    "user.name=Fixture",
    "-c",
    "user.email=fixture@example.invalid",
    "-c",
    "core.hooksPath=",
    "commit",
    "--quiet",
    "-m",
    "brand assets",
  );
  return { root, git };
}

test("现有 NCode 品牌资源与引用通过检查", async () => {
  assert.deepEqual(await checkBranding({ root: repositoryRoot }), []);
});

test("检查不写文件，定位重复资源与前景标志漂移", async (t) => {
  const { root } = await fixture(t);
  const icon = resolve(root, "packages/desktop/build/icons/32x32.png");
  await writeFile(icon, "drift");
  const logo = resolve(root, "packages/ui/src/root/RootStartupLoading.tsx");
  await writeFile(
    logo,
    (await readFile(logo, "utf8")).replace("matrix(0 1 -1 0 218 0)", "matrix(1 0 0 1 0 0)"),
  );
  const errors = await checkBranding({ root });
  assert.ok(errors.some((error) => error.includes("build/icons/32x32.png")));
  assert.ok(errors.some((error) => error.includes("RootStartupLoading.tsx")));
  assert.equal(await readFile(icon, "utf8"), "drift");
});

test("从明确的 Git 来源同步全部资产与内联 favicon，不覆盖组件和供应商图标", async (t) => {
  const { root } = await fixture(t);
  const icon = resolve(root, "packages/desktop/build/icon.png");
  const html = resolve(root, "packages/web/index.html");
  const logo = resolve(root, "packages/ui/src/components/ui/ZCodeAboutLogo.tsx");
  const originalLogo = await readFile(logo);
  const vendor = resolve(root, "packages/ui/src/assets/provider-icons/custom.svg");
  await mkdir(dirname(vendor), { recursive: true });
  await writeFile(vendor, "third-party-brand");
  await writeFile(icon, "drift");
  await writeFile(
    html,
    (await readFile(html, "utf8")).replace(
      /href="data:image\/png;base64,[^"]+"/u,
      'href="data:image/png;base64,b2xk"',
    ) + "\n<!-- keep upstream -->\n",
  );
  await syncBranding({ root, sourceRef: "HEAD" });
  assert.deepEqual(await checkBranding({ root, sourceRef: "HEAD" }), []);
  assert.deepEqual(await readFile(logo), originalLogo);
  assert.equal(await readFile(vendor, "utf8"), "third-party-brand");
  assert.ok((await readFile(html, "utf8")).includes("<!-- keep upstream -->"));
  await syncBranding({ root, sourceRef: "HEAD" });
  assert.deepEqual(await checkBranding({ root, sourceRef: "HEAD" }), []);
});

test("来源或消费结构不完整时，在写入任何资源前失败", async (t) => {
  const { root, git } = await fixture(t);
  await git("rm", "packages/desktop/build/dmg_background@2x.png");
  await git(
    "-c",
    "user.name=Fixture",
    "-c",
    "user.email=fixture@example.invalid",
    "-c",
    "core.hooksPath=",
    "commit",
    "--quiet",
    "-m",
    "incomplete source",
  );
  const icon = resolve(root, "packages/desktop/build/icon.png");
  await writeFile(icon, "keep draft");
  await assert.rejects(syncBranding({ root, sourceRef: "HEAD" }), /dmg_background@2x.png/u);
  assert.equal(await readFile(icon, "utf8"), "keep draft");
  await rm(resolve(root, "packages/web/index.html"));
  await assert.rejects(syncBranding({ root, sourceRef: "HEAD~1" }), /packages\/web\/index.html/u);
  assert.equal(await readFile(icon, "utf8"), "keep draft");
});

test("未指定来源或内联 favicon 结构变化时不写入资源", async (t) => {
  const { root } = await fixture(t);
  const icon = resolve(root, "packages/desktop/build/icon.png");
  await writeFile(icon, "keep draft");
  await assert.rejects(syncBranding({ root }), /--source-ref/u);
  const html = resolve(root, "packages/web/index.html");
  await writeFile(
    html,
    (await readFile(html, "utf8")).replace(
      /href="data:image\/png;base64,[^"]+"/u,
      'href="/favicon.ico"',
    ),
  );
  await assert.rejects(syncBranding({ root, sourceRef: "HEAD" }), /结构已变化/u);
  assert.equal(await readFile(icon, "utf8"), "keep draft");
});
