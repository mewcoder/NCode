import { readFile, writeFile } from "node:fs/promises";
import { resolve } from "node:path";
import { TID_TASK_SETTINGS_BUTTON, TID_WORKSPACE_HELP_MENU_TRIGGER } from "@zcode/shared/test-ids";
import { DEFAULT_WORKSPACE, waitForWorkspaceApp } from "../helpers/desktop-app.js";

// NCode 专属正式 E2E（ncode-feature.md 三.3 / closure spec「部分引用 spec」遗留项）：
// 上游 help-menu-about 因断言官方社群/反馈/检查更新被整份排除，本 spec 只覆盖
// NCode 保留行为：帮助菜单首项导出日志、无孤立分隔线、关于窗口 NCode 品牌与版本。
// 已按用户委托审阅转正，使用默认 case-local 回放：
//   pnpm --filter @zcode/desktop test:e2e -- --spec './test/e2e/ncode/ncode-help-menu-retained.test.ts'

async function enterWorkspace() {
  await browser.waitUntil(
    async () => {
      if (await $('[data-testid="onboarding-page"]').isDisplayed()) await browser.keys("Escape");
      return $(`[data-testid="${TID_TASK_SETTINGS_BUTTON}"]`).isExisting();
    },
    { timeout: 30_000, timeoutMsg: "首次使用引导关闭后未进入工作区" },
  );
  await waitForWorkspaceApp(DEFAULT_WORKSPACE, 30_000);
}

async function openMenu() {
  await browser.waitUntil(
    async () => {
      for (const trigger of await $$(`[data-testid="${TID_WORKSPACE_HELP_MENU_TRIGGER}"]`)) {
        if (await trigger.isDisplayed()) return true;
      }
      return false;
    },
    { timeout: 10_000, timeoutMsg: "帮助按钮尚未挂载到可见页面" },
  );
  const triggers = await $$(`[data-testid="${TID_WORKSPACE_HELP_MENU_TRIGGER}"]`);
  for (const trigger of triggers) {
    if (await trigger.isDisplayed()) {
      await trigger.waitForClickable();
      await trigger.click();
      break;
    }
  }
  await $('[role="menu"]').waitForDisplayed();
  await $('[role="menuitem"][aria-busy="true"]').waitForExist({ reverse: true });
}

async function menuLabels() {
  return $$('[role="menuitem"]').map((item) => item.getText());
}

async function assertAboutWindow() {
  const productVersion: string = JSON.parse(
    await readFile(resolve("../../package.json"), "utf8"),
  ).version;
  try {
    await browser.waitUntil(
      async () =>
        browser.electron.execute(async (electron, expectedVersion) => {
          const window = electron.BrowserWindow.getAllWindows().find(
            (candidate) =>
              candidate.webContents.getURL().startsWith("data:text/html") &&
              decodeURIComponent(candidate.webContents.getURL()).includes('id="about-title"'),
          );
          if (!window?.isVisible()) return false;
          const title = await window.webContents.executeJavaScript(
            'document.querySelector("#about-title")?.textContent',
          );
          // 开发壳的 app.getVersion() 是 Electron 版本，必须比对产品版本，
          // 不能让任意数字版本通过而掩盖显示 Electron 版本的回归。
          return (
            typeof title === "string" && title.includes("NCode") && title.includes(expectedVersion)
          );
        }, productVersion),
      { timeout: 10_000, timeoutMsg: "关于窗口未显示 NCode 名称和版本" },
    );
    const artifactDir = process.env.ZCODE_E2E_ARTIFACT_DIR;
    if (artifactDir) {
      const screenshot = await browser.electron.execute(async (electron) => {
        const window = electron.BrowserWindow.getAllWindows().find(
          (candidate) =>
            candidate.webContents.getURL().startsWith("data:text/html") &&
            decodeURIComponent(candidate.webContents.getURL()).includes('id="about-title"'),
        );
        return window ? (await window.webContents.capturePage()).toPNG().toString("base64") : null;
      });
      if (screenshot)
        await writeFile(resolve(artifactDir, "ncode-about.png"), Buffer.from(screenshot, "base64"));
    }
  } finally {
    await browser.electron.execute((electron) => {
      for (const window of electron.BrowserWindow.getAllWindows()) {
        if (
          window.webContents.getURL().startsWith("data:text/html") &&
          decodeURIComponent(window.webContents.getURL()).includes('id="about-title"')
        )
          window.close();
      }
    });
  }
}

describe("NCode 帮助菜单保留行为（上游 help-menu-about 的 NCode 替代）", () => {
  it("NHELP-01 菜单仅保留本地工具、无孤立分隔线，关于窗口为 NCode", async function () {
    await enterWorkspace();
    await openMenu();

    // 官方跳转分组（产品文档/社群/反馈）与检查更新已随关闭项移除，导出日志成为首项；
    // 分隔线原本分隔官方跳转与本地工具两组，分组消失后不得遗留。
    expect(await menuLabels()).toEqual(["导出日志", "资源管理器", "关于 NCode"]);
    expect(await $$('[role="menu"] [role="separator"]')).toHaveLength(0);
    if (process.env.ZCODE_E2E_ARTIFACT_DIR) {
      await browser.saveScreenshot(
        resolve(process.env.ZCODE_E2E_ARTIFACT_DIR, "ncode-help-menu.png"),
      );
    }

    await $('[role="menuitem"]*=关于 NCode').click();
    await assertAboutWindow();
    const capturePath = process.env.E2E_PROVIDER_CAPTURE_PATH;
    if (!capturePath) throw new Error("Missing NCode provider capture evidence");
    expect(JSON.parse(await readFile(capturePath, "utf8")).records).toEqual([]);
  });
});
