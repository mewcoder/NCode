import { createElement } from "react";
import type { ReactNode } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";
import { DesktopCommandIds, TID_WORKSPACE_HELP_MENU_RESOURCE_MANAGER } from "@zcode/shared";

vi.mock("@/i18n/IntlProvider.js", () => ({
  useZCodeIntl: () => ({
    intl: {
      formatMessage: ({ id }: { id: string }) => id,
    },
    locale: "zh-CN",
  }),
}));

const captured = vi.hoisted(() => ({
  zsrcUrl: null as string | null,
  loading: false,
  openExternal: vi.fn(),
  exportLogs: vi.fn(async () => ({ success: true })),
  toast: vi.fn(() => 7),
  dismissToast: vi.fn(),
  menuItems: [] as Array<{
    label: string;
    testId?: string;
    disabled?: boolean;
    onSelect: (() => void | Promise<void>) | undefined;
  }>,
  updateMenuArguments: [] as boolean[],
  updateMenu: {
    visible: true,
    disabled: false,
    labelId: "titleBar.menu.help.checkForUpdates",
    labelValues: undefined,
  },
  executeDesktopCommand: vi.fn(async () => undefined),
}));

vi.mock("@/components/ui/dropdown-menu.js", () => ({
  DropdownMenu: ({ children }: { children: ReactNode }) => createElement("div", null, children),
  DropdownMenuContent: ({ children }: { children: ReactNode }) =>
    createElement("div", null, children),
  DropdownMenuItem: ({
    children,
    onSelect,
    disabled,
    "data-testid": testId,
  }: {
    children: ReactNode;
    onSelect?: () => void | Promise<void>;
    disabled?: boolean;
    "data-testid"?: string;
  }) => {
    const label = Array.isArray(children)
      ? children.filter((child) => typeof child === "string").join("")
      : typeof children === "string"
        ? children
        : "";
    captured.menuItems.push({ label, testId, onSelect, disabled });
    return createElement("div", { "data-testid": testId }, children);
  },
  DropdownMenuSeparator: () => createElement("hr"),
  DropdownMenuTrigger: ({ children }: { children: ReactNode }) =>
    createElement("div", null, children),
}));

vi.mock("@/ControlHintTooltip.js", () => ({
  ControlHintTooltip: ({ children }: { children: ReactNode }) =>
    createElement("div", null, children),
}));

vi.mock("@/components/ui/toast.js", () => ({
  toast: captured.toast,
  dismissToast: captured.dismissToast,
}));

vi.mock("@/feedback/feedbackStore.js", () => ({
  useFeedbackStore: (
    selector: (state: {
      openSubmit: (draft?: unknown) => void;
      openFeatureRequest: () => void;
    }) => unknown,
  ) => selector({ openSubmit: vi.fn(), openFeatureRequest: vi.fn() }),
}));

vi.mock("@/hooks/useDesktopUpdateMenu.js", () => ({
  // NCode 在消费方传入 false 关闭更新入口；mock 记录入参以验证关闭点本身生效。
  useDesktopUpdateMenu: (isDesktop: boolean) => {
    captured.updateMenuArguments.push(isDesktop);
    return {
      ...captured.updateMenu,
      visible: isDesktop && captured.updateMenu.visible,
      checkForUpdates: () => captured.executeDesktopCommand(DesktopCommandIds.CheckForUpdates),
    };
  },
}));

vi.mock("@/hooks/usePlatform.js", () => ({
  usePlatform: () => ({
    captureWindowScreenshot: vi.fn(async () => null),
    executeDesktopCommand: captured.executeDesktopCommand,
    exportLogs: captured.exportLogs,
    openCommunity: vi.fn(async () => undefined),
    openExternal: captured.openExternal,
  }),
}));

vi.mock("@/hooks/useVulnerabilityReportUrl.js", () => ({
  useVulnerabilityReportUrl: () => ({ url: captured.zsrcUrl, loading: captured.loading }),
}));

describe("WorkspaceHelpMenuButton", () => {
  async function render(isDesktop: boolean | undefined) {
    captured.menuItems = [];
    captured.executeDesktopCommand.mockClear();
    captured.exportLogs.mockClear();
    captured.toast.mockClear();
    captured.dismissToast.mockClear();
    const { WorkspaceHelpMenuButton } = await import("@/WorkspaceHelpMenuButton.js");
    return renderToStaticMarkup(createElement(WorkspaceHelpMenuButton, { isDesktop }));
  }

  it("NCode 关闭官方帮助跳转后不再渲染漏洞提交入口", async () => {
    for (const desktop of [true, false]) {
      captured.zsrcUrl = "https://security.example.test/report";
      captured.openExternal.mockClear();
      try {
        const html = await render(desktop);
        expect(html).not.toContain("workspaceHeader.help.reportVulnerability");
        expect(
          captured.menuItems.some(
            (item) => item.label === "workspaceHeader.help.reportVulnerability",
          ),
        ).toBe(false);
        expect(captured.openExternal).not.toHaveBeenCalled();
      } finally {
        captured.zsrcUrl = null;
      }
    }
  });

  it("桌面端渲染资源管理器项，点击走 OpenResourceManager 命令", async () => {
    // 原因：Windows/Linux 没有原生菜单栏，自绘箭头菜单也已下线，问号菜单是资源管理器唯一入口。
    const html = await render(true);

    expect(html).toContain("titleBar.menu.help.resourceManager");
    const item = captured.menuItems.find(
      (entry) => entry.testId === TID_WORKSPACE_HELP_MENU_RESOURCE_MANAGER,
    );
    expect(item).toBeDefined();
    await item!.onSelect?.();
    expect(captured.executeDesktopCommand).toHaveBeenCalledWith(
      DesktopCommandIds.OpenResourceManager,
    );
  });

  it("Web 端（isDesktop 缺省 / false）不渲染资源管理器项", async () => {
    for (const isDesktop of [undefined, false]) {
      const html = await render(isDesktop);
      expect(html).not.toContain("titleBar.menu.help.resourceManager");
      expect(
        captured.menuItems.some(
          (entry) => entry.testId === TID_WORKSPACE_HELP_MENU_RESOURCE_MANAGER,
        ),
      ).toBe(false);
    }
  });

  it("桌面端关于项位于最后，点击复用 ShowAbout", async () => {
    await render(true);
    const index = captured.menuItems.findIndex(
      (entry) => entry.label === "titleBar.menu.help.about",
    );
    expect(index).toBeGreaterThan(0);
    expect(index).toBe(captured.menuItems.length - 1);
    await captured.menuItems[index]?.onSelect?.();
    expect(captured.executeDesktopCommand).toHaveBeenCalledExactlyOnceWith(
      DesktopCommandIds.ShowAbout,
    );
  });

  it("Web 和手机远控不显示桌面关于入口", async () => {
    for (const isDesktop of [undefined, false]) {
      expect(await render(isDesktop)).not.toContain("titleBar.menu.help.about");
    }
  });

  it("NCode 停用应用内升级，桌面端也不显示检查更新", async () => {
    captured.updateMenuArguments.length = 0;

    expect(await render(true)).not.toContain("titleBar.menu.help.checkForUpdates");
    expect(await render(false)).not.toContain("titleBar.menu.help.checkForUpdates");
    // 关闭点本身：桌面端也向 hook 传 false，因此不会订阅更新状态。
    expect(captured.updateMenuArguments).toEqual([false, false]);
  });

  it("桌面导出日志复用平台导出及共享提示", async () => {
    await render(true);
    const item = captured.menuItems.find(
      (entry) => entry.label === "titleBar.menu.help.exportLogs",
    );
    expect(item).toBeDefined();
    await item!.onSelect?.();
    expect(captured.exportLogs).toHaveBeenCalledExactlyOnceWith();
    expect(captured.toast).toHaveBeenCalledWith("sidebar.exportLogs.pending", {
      durationMs: Number.POSITIVE_INFINITY,
    });
    expect(captured.dismissToast).toHaveBeenCalledWith(7);
  });

  it("Web 和手机远控不显示本地导出日志入口", async () => {
    for (const isDesktop of [undefined, false]) {
      expect(await render(isDesktop)).not.toContain("titleBar.menu.help.exportLogs");
      expect(captured.exportLogs).not.toHaveBeenCalled();
    }
  });

  it("NCode 帮助菜单只保留本地桌面动作", async () => {
    for (const desktop of [true, false]) {
      const html = await render(desktop);
      expect(captured.menuItems.map((item) => item.label)).toEqual(
        desktop
          ? [
              "titleBar.menu.help.exportLogs",
              "titleBar.menu.help.resourceManager",
              "titleBar.menu.help.about",
            ]
          : [],
      );
      // 导出日志已是菜单首项，上游那条分组分隔线随官方入口一起移除，桌面端也不再渲染 <hr>。
      expect((html.match(/<hr/g) ?? []).length).toBe(0);
    }
  });

  it("桌面端与 Web 端都不再渲染官方反馈、社群与产品文档入口", async () => {
    for (const isDesktop of [true, false]) {
      const html = await render(isDesktop);
      for (const id of [
        "workspaceHeader.help.issueReport",
        "workspaceHeader.help.productRequest",
        "workspaceHeader.help.community",
        "workspaceHeader.help.docs",
      ]) {
        expect(html, id).not.toContain(id);
      }
    }
  });
});
