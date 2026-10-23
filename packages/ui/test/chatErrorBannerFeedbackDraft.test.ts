import type { IPlatformService } from "@zcode/shared";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { ChatErrorBanner } from "@/ChatErrorBanner.js";
import { PlatformProvider } from "@/hooks/usePlatform.js";
import { ZCodeIntlProvider } from "@/i18n/IntlProvider.js";
import type { ZCodeUiError } from "@/lib/zcodeUiError.js";

const buttons = vi.hoisted(() => [] as Array<Record<string, unknown>>);
vi.mock("@/components/ui/button.js", async () => {
  const React = await import("react");
  return {
    Button: (props: Record<string, unknown>) => {
      buttons.push(props);
      const { children, size, variant, ...domProps } = props;
      void size;
      void variant;
      return React.createElement("button", domProps, children);
    },
  };
});
vi.mock("@/components/ui/toast.js", () => ({ toast: vi.fn() }));
const platform = {} as IPlatformService;
function renderBanner(
  error: ZCodeUiError,
  callbacks: Partial<Parameters<typeof ChatErrorBanner>[0]> = {},
) {
  return renderToStaticMarkup(
    createElement(
      ZCodeIntlProvider,
      { initialLocale: "zh-CN" },
      createElement(
        PlatformProvider,
        { platform },
        createElement(ChatErrorBanner, { error, ...callbacks }),
      ),
    ),
  );
}
beforeEach(() => {
  buttons.length = 0;
});
describe("NCode error banner actions", () => {
  it.each(["model_config_missing", "PROVIDER_AUTH_FAILED", "ZCODE_REMOTE_WORKSPACE_DISCONNECTED"])(
    "%s 不显示反馈或套餐升级",
    (code) => {
      const html = renderBanner(
        { code, message: "test failure", traceId: "test-trace" },
        { onOpenUpgrade: vi.fn() },
      );
      expect(html).not.toContain("反馈问题");
      expect(html).not.toContain("升级");
      expect(buttons.some((p) => p["aria-label"] === "反馈问题")).toBe(false);
    },
  );
  it("缺模型时配置按钮可操作", () => {
    const onOpenModelSettings = vi.fn();
    renderBanner(
      { code: "model_config_missing", message: "Model config is missing." },
      { onOpenModelSettings },
    );
    const button = buttons.find((p) => p["aria-label"] === "配置");
    expect(button).toBeDefined();
    (button!.onClick as () => void)();
    expect(onOpenModelSettings).toHaveBeenCalledOnce();
  });
  it("保留错误复制和远程连接失败的重连操作", () => {
    const onReconnect = vi.fn();
    const html = renderBanner(
      { code: "ZCODE_REMOTE_WORKSPACE_DISCONNECTED", message: "disconnected" },
      { onReconnect, remoteKind: "ssh" },
    );
    expect(html).toContain("复制");
    const button = buttons.find((p) => p.children === "重新连接");
    expect(button).toBeDefined();
    (button!.onClick as () => void)();
    expect(onReconnect).toHaveBeenCalledOnce();
  });
});
