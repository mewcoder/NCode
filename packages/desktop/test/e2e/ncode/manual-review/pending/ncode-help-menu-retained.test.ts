import { TID_TASK_SETTINGS_BUTTON, TID_WORKSPACE_HELP_MENU_TRIGGER } from "@zcode/shared";
import { DEFAULT_WORKSPACE, waitForWorkspaceApp } from "../../../helpers/desktop-app.js";

// NCode 专属 E2E 候选（ncode-feature.md 三.3 / closure spec「部分引用 spec」遗留项）：
// 上游 help-menu-about 因断言官方社群/反馈/检查更新被整份排除，本 spec 只覆盖
// NCode 保留行为：帮助菜单首项导出日志、无孤立分隔线、关于窗口 NCode 品牌与版本。
// 按 e2e-case-lifecycle 以 manual-review/pending 起步：
//   ZCODE_E2E_MANUAL_REVIEW=1 pnpm --filter @zcode/desktop test:e2e -- --spec './test/e2e/ncode/manual-review/pending/ncode-help-menu-retained.test.ts'

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
  try {
    await browser.waitUntil(
      async () =>
        browser.electron.execute(async (electron) => {
          const window = electron.BrowserWindow.getAllWindows().find(
            (candidate) =>
              candidate.webContents.getURL().startsWith("data:text/html") &&
              decodeURIComponent(candidate.webContents.getURL()).includes('id="about-title"'),
          );
          if (!window?.isVisible()) return false;
          const title = await window.webContents.executeJavaScript(
            'document.querySelector("#about-title")?.textContent',
          );
          // 开发壳的 electron.app.getVersion() 返回 Electron 版本；关于窗口按
          // ncode-feature.md 规则显示产品构建版本，因此只断言 NCode 名称与数字版本。
          return typeof title === "string" && title.includes("NCode") && /\d+\.\d+/.test(title);
        }),
      { timeout: 10_000, timeoutMsg: "关于窗口未显示 NCode 名称和版本" },
    );
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

    await $('[role="menuitem"]*=关于 NCode').click();
    await assertAboutWindow();
  });
});
