// @vitest-environment jsdom
import { createElement } from "react";
import { cleanup, render } from "@testing-library/react";
import { afterEach, expect, it, vi } from "vitest";
const h = vi.hoisted(() => ({
  status: "loading" as "loading" | "ready" | "error",
  retry: vi.fn(),
}));
vi.mock("@/settings/CodingPlanUpgradeDialogProvider.js", () => ({
  useOptionalCodingPlanUpgradeDialog: () => ({ inventory: { status: h.status, retry: h.retry } }),
}));
vi.mock("@/i18n/IntlProvider.js", () => ({
  useZCodeIntl: () => ({ intl: { formatMessage: ({ id }: { id: string }) => id } }),
}));
import { CodingPlanEntryButton } from "@/settings/CodingPlanEntryButton.js";
afterEach(() => {
  cleanup();
  vi.clearAllMocks();
});
it.each(["loading", "error", "ready"] as const)(
  "NCode 在 %s 状态不展示套餐购买或重试入口",
  (status) => {
    h.status = status;
    const purchase = vi.fn();
    const { container } = render(
      createElement(CodingPlanEntryButton, { onClick: purchase }, "Upgrade"),
    );
    expect(container.childElementCount).toBe(0);
    expect(purchase).not.toHaveBeenCalled();
    expect(h.retry).not.toHaveBeenCalled();
  },
);
