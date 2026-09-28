import { createContext, useContext, type ReactNode } from "react";
import type { CodingPlanUpgradeDialogTarget } from "@/settings/CodingPlanUpgradeDialog.js";
import type { CodingPlanEntryInventory } from "@/hooks/useCodingPlanEntryPlanList.js";

interface CodingPlanUpgradeDialogContextValue {
  inventory: CodingPlanEntryInventory;
  openCodingPlanUpgrade: (
    target: CodingPlanUpgradeDialogTarget,
    observation?: { signal: AbortSignal; onResult: (opened: boolean) => void },
  ) => boolean;
}

const CodingPlanUpgradeDialogContext = createContext<CodingPlanUpgradeDialogContextValue | null>(
  null,
);

const disabledUpgradeDialog: CodingPlanUpgradeDialogContextValue = {
  inventory: { entryPlanList: "", status: "ready", retry: () => undefined },
  openCodingPlanUpgrade: () => false,
};

export function CodingPlanUpgradeDialogProvider({ children }: { children: ReactNode }) {
  return (
    <CodingPlanUpgradeDialogContext.Provider value={disabledUpgradeDialog}>
      {children}
    </CodingPlanUpgradeDialogContext.Provider>
  );
}

export function useCodingPlanUpgradeDialog() {
  const context = useContext(CodingPlanUpgradeDialogContext);
  if (!context) {
    throw new Error(
      "useCodingPlanUpgradeDialog must be used within CodingPlanUpgradeDialogProvider",
    );
  }
  return context;
}

/**
 * 可独立挂载的 conversation pane 使用可选上下文；完整 App Root 仍会注入购买入口状态。
 */
export function useOptionalCodingPlanUpgradeDialog() {
  return useContext(CodingPlanUpgradeDialogContext);
}
