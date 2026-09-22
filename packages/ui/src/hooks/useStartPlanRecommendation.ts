import { useCallback } from "react";
import type { ModelSelectionView } from "@zcode/provider";
import type { ModelSelection } from "@zcode/shared";

/**
 * 官方 Start Plan/账号权益已关闭；保留 hook 形状让自动化和 subagent 编辑器继续复用
 * 同一提交接口，但不再读取账号、OAuth 或套餐额度，也不改写用户的模型选择。
 */
export function useStartPlanRecommendation(
  _view: ModelSelectionView | null | undefined,
  _surface?: "subagent",
) {
  return useCallback(async (selection: ModelSelection): Promise<ModelSelection> => selection, []);
}
