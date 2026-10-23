import { createElement } from "react";
import type { ReactNode } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";

vi.mock("@/i18n/IntlProvider.js", () => ({
  useZCodeIntl: () => ({
    intl: {
      formatMessage: ({ id }: { id: string }) => id,
    },
    locale: "zh-CN",
  }),
}));

const capturedDropdownContentProps = vi.hoisted(() => ({
  calls: [] as Array<{ align?: string; alignOffset?: number }>,
}));

const capturedWindowsCaptionMenu = vi.hoisted(() => {
  const screenshot = {
    dataBase64: "base64-image",
    filename: "zcode-error-2026-06-17.png",
    contentType: "image/png",
    size: 12,
  };

  return {
    screenshot,
    menuItems: [] as Array<{
      label: string;
      onSelect: (() => void | Promise<void>) | undefined;
    }>,
    openSubmit: vi.fn(),
    openFeatureRequest: vi.fn(),
    openExternal: vi.fn(),
    exportLogs: vi.fn(async () => ({ success: true })),
    captureWindowScreenshot: vi.fn(async () => screenshot),
    executeDesktopCommand: vi.fn(async () => undefined),
  };
});

vi.mock("@/components/ui/dropdown-menu.js", () => ({
  DropdownMenu: ({ children }: { children: ReactNode }) => createElement("div", null, children),
  DropdownMenuCheckboxItem: ({ children }: { children: ReactNode }) =>
    createElement("div", null, children),
  DropdownMenuContent: ({
    children,
    align,
    alignOffset,
  }: {
    children: ReactNode;
    align?: string;
    alignOffset?: number;
  }) => {
    capturedDropdownContentProps.calls.push({ align, alignOffset });
    return createElement("div", null, children);
  },
  DropdownMenuItem: ({
    children,
    onSelect,
  }: {
    children: ReactNode;
    onSelect?: () => void | Promise<void>;
  }) => {
    const label = Array.isArray(children)
      ? children.filter((child) => typeof child === "string").join("")
      : typeof children === "string"
        ? children
        : "";
    capturedWindowsCaptionMenu.menuItems.push({ label, onSelect });
    return createElement("div", null, children);
  },
  DropdownMenuSeparator: () => createElement("hr"),
  DropdownMenuShortcut: ({ children }: { children: ReactNode }) =>
    createElement("span", null, children),
  DropdownMenuTrigger: ({ children }: { children: ReactNode }) =>
    createElement("div", null, children),
}));

vi.mock("@/components/ui/toast.js", () => ({
  dismissToast: vi.fn(),
  toast: vi.fn(() => 1),
}));

vi.mock("@/feedback/feedbackStore.js", () => ({
  useFeedbackStore: (
    selector: (state: {
      openSubmit: (draft?: unknown) => void;
      openFeatureRequest: () => void;
    }) => unknown,
  ) =>
    selector({
      openSubmit: capturedWindowsCaptionMenu.openSubmit,
      openFeatureRequest: capturedWindowsCaptionMenu.openFeatureRequest,
    }),
}));

vi.mock("@/hooks/usePlatform.js", () => ({
  usePlatform: () => ({
    canOpenCommunity: vi.fn(async () => false),
    captureWindowScreenshot: capturedWindowsCaptionMenu.captureWindowScreenshot,
    executeDesktopCommand: capturedWindowsCaptionMenu.executeDesktopCommand,
    exportLogs: capturedWindowsCaptionMenu.exportLogs,
    openExternal: capturedWindowsCaptionMenu.openExternal,
    openInFileManager: vi.fn(async () => ({ success: true })),
  }),
}));

describe("WindowsCaptionMenuButton", () => {
  async function renderButton(
    triggerPresentation?: "header" | "header-borderless",
    useWindowsCaptionSpacing = false,
  ) {
    capturedDropdownContentProps.calls = [];
    capturedWindowsCaptionMenu.menuItems = [];
    const { WindowsCaptionMenuButton } = await import("@/WindowsCaptionMenuButton.js");
    // 快捷键特性后组件经 useShortcutCommandLabel 读设置，裸渲染需提供最小 ServiceProvider
    const { ServiceProvider } = await import("@/hooks/useServices.js");
    const { createSettingsTestServices } = await import("./lib/settingsTestServices.js");
    return renderToStaticMarkup(
      createElement(
        ServiceProvider,
        { services: createSettingsTestServices() },
        createElement(WindowsCaptionMenuButton, {
          workspaceAbsPath: "/workspace",
          onCreateTask: vi.fn(),
          onOpenWorkspace: vi.fn(),
          onToggleBrowser: vi.fn(),
          onToggleTerminal: vi.fn(),
          triggerPresentation,
          useWindowsCaptionSpacing,
        }),
      ),
    );
  }

  it("NCode 不展示任何应用内更新入口", async () => {
    // 产品身份判定沿用上游语义（Preview 恒隐藏），NCode 在其上再关闭全部身份。
    const html = await renderButton("header");
    expect(html).not.toContain("titleBar.menu.help.checkForUpdates");
    expect(html).not.toContain("desktopMenu.help.checkingForUpdates");
  });

  it("keeps only local help actions after NCode disables feedback and community", async () => {
    capturedWindowsCaptionMenu.openSubmit.mockClear();
    capturedWindowsCaptionMenu.openFeatureRequest.mockClear();
    capturedWindowsCaptionMenu.openExternal.mockClear();
    capturedWindowsCaptionMenu.exportLogs.mockClear();
    capturedWindowsCaptionMenu.captureWindowScreenshot.mockClear();

    const html = await renderButton("header");

    // 反馈、功能建议、社群与产品文档入口均已隐藏，只保留本地导出/资源管理器等动作。
    expect(html).not.toContain("titleBar.menu.help.feedback");
    expect(html).not.toContain("workspaceHeader.help.productRequest");
    expect(html).not.toContain("workspaceHeader.help.docs");
    expect(html).not.toContain("sidebar.menu.community");
    expect(html).toContain("titleBar.menu.help.exportLogs");

    capturedWindowsCaptionMenu.menuItems
      .find((item) => item.label === "titleBar.menu.help.exportLogs")
      ?.onSelect?.();

    expect(capturedWindowsCaptionMenu.captureWindowScreenshot).not.toHaveBeenCalled();
    expect(capturedWindowsCaptionMenu.openSubmit).not.toHaveBeenCalled();
    expect(capturedWindowsCaptionMenu.openFeatureRequest).not.toHaveBeenCalled();
    expect(capturedWindowsCaptionMenu.openExternal).not.toHaveBeenCalled();
    expect(capturedWindowsCaptionMenu.exportLogs).toHaveBeenCalledTimes(1);
  });

  it("keeps the menu surface clear of the native Windows caption buttons", async () => {
    await renderButton("header");

    // Bugfix: Windows 原生 titleBarOverlay 宽度存在 DPI/取整差异，右对齐菜单需要轻微左移避开最小化按钮。
    expect(capturedDropdownContentProps.calls[0]).toMatchObject({
      align: "end",
      alignOffset: -12,
    });
  });
});
