// @vitest-environment jsdom

import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { createElement } from "react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { ZCodeIntlProvider } from "@/i18n/IntlProvider.js";
import { SessionSubscriptionErrorPanel } from "@/v4/SessionSubscriptionErrorPanel.js";

function renderPanel(onReconnect = vi.fn()) {
  render(
    createElement(
      ZCodeIntlProvider,
      { initialLocale: "zh-CN" },
      createElement(SessionSubscriptionErrorPanel, {
        error: "EPERM: operation not permitted",
        sessionId: "session-1",
        workspacePath: "F:\\ZCode_data",
        onReconnect,
      }),
    ),
  );
  return onReconnect;
}

afterEach(() => {
  cleanup();
  vi.clearAllMocks();
});

describe("SessionSubscriptionErrorPanel", () => {
  it("shows the subscription error with only the reconnect action", () => {
    renderPanel();

    expect(screen.getByText("EPERM: operation not permitted")).toBeTruthy();
    expect(screen.getByRole("button", { name: "重新连接" })).toBeTruthy();
    // NCode 关闭反馈入口：面板不再渲染「反馈问题」按钮。
    expect(screen.queryByRole("button", { name: "反馈问题" })).toBeNull();
  });

  it("calls onReconnect when the reconnect button is pressed", () => {
    const onReconnect = renderPanel();

    fireEvent.click(screen.getByRole("button", { name: "重新连接" }));

    expect(onReconnect).toHaveBeenCalledTimes(1);
  });
});
