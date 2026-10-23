// @vitest-environment jsdom
import { createElement } from "react";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

const h = vi.hoisted(() => ({
  renderedTargets: [] as unknown[],
  reportTelemetryEvent: vi.fn().mockResolvedValue(undefined),
}));

vi.mock("@/hooks/usePlatform.js", () => ({
  usePlatform: () => ({ reportTelemetryEvent: h.reportTelemetryEvent }),
}));

vi.mock("@/settings/CodingPlanUpgradeDialog.js", () => ({
  CodingPlanUpgradeDialog: ({ target }: { target?: unknown }) => {
    h.renderedTargets.push(target);
    return null;
  },
}));

import {
  CodingPlanUpgradeDialogProvider,
  useCodingPlanUpgradeDialog,
} from "@/settings/CodingPlanUpgradeDialogProvider.js";

function Launcher() {
  const { openCodingPlanUpgrade } = useCodingPlanUpgradeDialog();
  return createElement(
    "button",
    {
      type: "button",
      onClick: () => openCodingPlanUpgrade({ providerId: "zai-coding-plan" }),
    },
    "Upgrade",
  );
}

afterEach(() => {
  cleanup();
  h.reportTelemetryEvent.mockClear();
  h.renderedTargets.length = 0;
});

describe("CodingPlanUpgradeDialogProvider", () => {
  it("NCode 关闭套餐购买后不再打开升级对话框", () => {
    render(createElement(CodingPlanUpgradeDialogProvider, null, createElement(Launcher)));

    fireEvent.click(screen.getByRole("button", { name: "Upgrade" }));

    expect(h.renderedTargets).toHaveLength(0);
  });

  it("openCodingPlanUpgrade 恒返回 false，调用方沿用未打开分支", () => {
    const result = vi.fn();
    function ObservedLauncher() {
      const { openCodingPlanUpgrade } = useCodingPlanUpgradeDialog();
      return createElement(
        "button",
        {
          type: "button",
          onClick: () => result(openCodingPlanUpgrade({ providerId: "zai-coding-plan" })),
        },
        "Observed",
      );
    }
    render(createElement(CodingPlanUpgradeDialogProvider, null, createElement(ObservedLauncher)));

    fireEvent.click(screen.getByRole("button", { name: "Observed" }));

    expect(result).toHaveBeenCalledExactlyOnceWith(false);
  });

  it("不查询套餐清单，也不上报购买漏斗", () => {
    render(createElement(CodingPlanUpgradeDialogProvider, null, createElement(Launcher)));

    fireEvent.click(screen.getByRole("button", { name: "Upgrade" }));

    expect(h.reportTelemetryEvent).not.toHaveBeenCalled();
  });

  it("保留 provider 上下文供既有调用方读取", () => {
    function InventoryReader() {
      const { inventory } = useCodingPlanUpgradeDialog();
      return createElement("span", null, inventory.status);
    }
    render(createElement(CodingPlanUpgradeDialogProvider, null, createElement(InventoryReader)));

    expect(screen.getByText("ready")).toBeTruthy();
  });
});
