import { createContext, useCallback, useContext, useMemo, type ReactNode } from "react";
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

/**
 * 套餐升级对话框上下文。
 *
 * NCode 关闭官方账号与套餐购买：不再查询套餐清单（`useCodingPlanEntryPlanList`），
 * 也不再挂载购买 WebView 或上报点击漏斗；`openCodingPlanUpgrade` 恒返回 false，
 * 让现有调用方沿用「未打开」的既有分支。Provider 结构保留，避免改动上游调用点。
 */
export function CodingPlanUpgradeDialogProvider({ children }: { children: ReactNode }) {
  const inventory = useMemo<CodingPlanEntryInventory>(
    () => ({ status: "ready", entryPlanList: "", retry: () => {} }),
    [],
  );
  const openCodingPlanUpgrade = useCallback<
    CodingPlanUpgradeDialogContextValue["openCodingPlanUpgrade"]
  >(() => false, []);
  const value = useMemo(
    () => ({ openCodingPlanUpgrade, inventory }),
    [openCodingPlanUpgrade, inventory],
  );

  return (
    <CodingPlanUpgradeDialogContext.Provider value={value}>
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
 * 可独立挂载的 conversation pane 使用可选上下文；完整 App Root 仍会注入真实购买面板。
 */
export function useOptionalCodingPlanUpgradeDialog() {
  return useContext(CodingPlanUpgradeDialogContext);
}
