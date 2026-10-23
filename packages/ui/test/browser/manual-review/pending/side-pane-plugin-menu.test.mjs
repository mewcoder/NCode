import assert from "node:assert/strict";
import { after, before, test } from "node:test";
import { mkdir } from "node:fs/promises";
import { join } from "node:path";
import { tmpdir } from "node:os";
import { fileURLToPath } from "node:url";
import { createServer } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import { chromium } from "playwright-core";

const root = fileURLToPath(new URL("../../../../../../", import.meta.url));
const entry = "/packages/ui/test/browser/manual-review/pending/side-pane-plugin-menu.fixture.tsx";
const surface = (id, pluginId = "panel@personal") => ({
  id,
  pluginId,
  pluginName: "panel",
  title: {
    en: id === "main" ? "Main panel" : "Second panel",
    "zh-CN": id === "main" ? "主面板" : "第二面板",
  },
  server: "plugin:panel:server",
  resourceUri: `ui://panel/${id}.html`,
});
const surfaces = [surface("main"), surface("secondary")];
const catalog = (enabled = true) => ({
  plugins: [
    {
      id: "panel@personal",
      name: "panel",
      marketplace: "personal",
      enabled,
      source: "inline",
      uiSurfaces: [...surfaces, surfaces[0]],
    },
    {
      id: "missing@personal",
      name: "missing",
      marketplace: "personal",
      enabled: true,
      packageStatus: "missing",
      uiSurfaces: [surface("missing", "missing@personal")],
    },
  ],
  availablePlugins: [
    { id: "uninstalled@example", name: "uninstalled", marketplace: "example", installed: false },
  ],
  marketplaces: [],
  installedPlugins: [],
  restorableBuiltins: [],
  diagnostics: [],
});
const add = "[data-side-pane-add-tab-trigger]";
const activeLauncher = '[role="tabpanel"][data-state="active"]';
const newTabItems = `${activeLauncher} [data-side-pane-open-tab-item^="plugin-ui:"]`;
const launcherItems = '[data-side-pane-open-tab-item^="plugin-ui:"]';
let server, browser, origin;

before(async () => {
  server = await createServer({
    root,
    configFile: false,
    plugins: [
      react(),
      tailwindcss(),
      {
        name: "plugin-menu-fixture",
        configureServer(vite) {
          vite.middlewares.use(async (req, res, next) => {
            if (!req.url?.startsWith("/fixture?")) return next();
            res.setHeader("Content-Type", "text/html");
            res.end(
              await vite.transformIndexHtml(
                req.url,
                `<!doctype html><html><head><meta name="viewport" content="width=device-width, initial-scale=1" /></head><body><div id="root"></div><script type="module" src="${entry}"></script></body></html>`,
              ),
            );
          });
        },
      },
    ],
    resolve: { alias: { "@": `${root}packages/ui/src` } },
    optimizeDeps: { entries: [entry.slice(1)] },
    server: { host: "127.0.0.1", port: 0, watch: null, hmr: false },
  });
  await server.listen();
  origin = server.resolvedUrls.local[0];
  browser = await chromium.launch(
    process.env.CHROME_EXECUTABLE_PATH
      ? { executablePath: process.env.CHROME_EXECUTABLE_PATH }
      : { channel: "chrome" },
  );
});
after(async () => {
  await Promise.all([
    browser?.close().then(() => console.info("Fixture browser closed")),
    server?.close().then(() => console.info("Fixture server closed")),
  ]);
});

for (const [width, locale, theme] of [
  [1200, "en-US", "light"],
  [390, "zh-CN", "dark"],
]) {
  test(`NC-CFG-08 installed panels ${width}/${locale}/${theme}`, async () => {
    const page = await browser.newPage({ viewport: { width, height: 800 } });
    page.setDefaultTimeout(15000);
    page.setDefaultNavigationTimeout(120000);
    const errors = [],
      forbidden = [],
      scopes = [];
    page.on("pageerror", (error) => errors.push(error.message));
    page.on("request", (request) => {
      if (
        ["/client-config", "/api/v1/client/configs", "/install"].includes(
          new URL(request.url()).pathname,
        )
      )
        forbidden.push(request.url());
    });
    await page.route("**/client-config", (route) => route.abort());
    await page.route("**/api/v1/client/configs**", (route) => route.abort());
    await page.route("**/catalog", (route) => route.fulfill({ json: catalog() }));
    await page.route("**/surfaces", (route) => {
      scopes.push(route.request().postDataJSON());
      return route.fulfill({ json: surfaces });
    });
    const query = `locale=${locale}&theme=${theme}${width < 500 ? "&mobile=1" : ""}`;
    try {
      await page.goto(`${origin}fixture?${query}`, { waitUntil: "domcontentloaded" });
      await page.locator(launcherItems).first().waitFor();
      assert.equal(await page.locator(launcherItems).count(), 2);
      assert.equal(
        await page
          .locator(launcherItems)
          .first()
          .innerText()
          .then((text) => text.includes(locale === "zh-CN" ? "主面板" : "Main panel")),
        true,
      );
      await page.locator(launcherItems).first().click();
      await page.waitForFunction(
        () => JSON.parse(document.querySelector('[data-testid="request"]').textContent) !== null,
      );
      const opened = JSON.parse(await page.getByTestId("request").textContent());
      assert.equal(opened.pluginId, "panel@personal");
      assert.equal(opened.surfaceId, "main");
      assert.equal(opened.workspaceIdentity, "fixture-workspace");
      await page.getByTestId("show-tabs").click();
      await page.locator(add).click();
      await page.locator(newTabItems).first().waitFor();
      assert.equal(await page.locator(newTabItems).count(), 2);
      const box = await page.locator(activeLauncher).boundingBox();
      assert.ok(box.x >= 0 && box.x + box.width <= width && box.y + box.height <= 800);
      const artifacts = join(tmpdir(), "ncode-installed-ui-panels");
      await mkdir(artifacts, { recursive: true });
      await page.screenshot({ path: join(artifacts, `${width}-${locale}-${theme}.png`) });
      assert.deepEqual(scopes[0], {
        workspacePath: "/workspace/example",
        workspaceIdentity: "fixture-workspace",
      });
      assert.deepEqual(forbidden, []);
      assert.deepEqual(errors, []);
    } finally {
      await page.close();
    }
  });
}

test("NC-CFG-06 disabled installed panel enables without installing or fetching config", async () => {
  const page = await browser.newPage();
  page.setDefaultTimeout(15000);
  page.setDefaultNavigationTimeout(120000);
  let enabled = false;
  const commands = [],
    forbidden = [];
  page.on("request", (request) => {
    if (
      ["/client-config", "/api/v1/client/configs", "/install"].includes(
        new URL(request.url()).pathname,
      )
    )
      forbidden.push(request.url());
  });
  await page.route("**/catalog", (route) => route.fulfill({ json: catalog(enabled) }));
  await page.route("**/enable", (route) => {
    commands.push(route.request().postDataJSON());
    enabled = true;
    return route.fulfill({ json: { diagnostics: [] } });
  });
  await page.route("**/surfaces", (route) => route.fulfill({ json: surfaces }));
  try {
    await page.goto(`${origin}fixture?locale=en-US`, { waitUntil: "domcontentloaded" });
    const first = page.locator(launcherItems).first();
    await first.waitFor();
    assert.match(await first.innerText(), /Enable/);
    await first.click();
    await page.waitForFunction(() =>
      document
        .querySelector('[data-side-pane-open-tab-item^="plugin-ui:"]')
        ?.textContent.includes("Open"),
    );
    assert.equal(JSON.parse(await page.getByTestId("request").textContent()), null);
    await first.click();
    await page.waitForFunction(
      () => JSON.parse(document.querySelector('[data-testid="request"]').textContent) !== null,
    );
    assert.equal(commands.length, 1);
    assert.equal(commands[0].enabled, true);
    assert.equal(commands[0].scope, "workspace");
    assert.deepEqual(forbidden, []);
  } finally {
    await page.close();
  }
});
