import type { IUsageStatsService } from "@zcode/services";
import type { SessionErrorInfo, SessionPhase } from "@zcode/shared/zcode-protocol-v4";
import { buildSessionQuotaBannerState } from "@/v4/sessionQuotaBannerState.js";

/**
 * Start Plan 的官方账号额度提醒已关闭。保留返回形状，避免旧 SessionPane channel 改动；
 * Coding Plan API Key 的正常用量展示仍走独立 usage-stats 面板，不经过此账号提醒链路。
 */
export function useV4SessionQuotaBanner(_params: {
  sessionId: string | null;
  error: SessionErrorInfo | null;
  errorKey: string | null;
  phase: SessionPhase | null;
  providerId: string | null;
  modelId: string | null;
  usageStatsService?: IUsageStatsService;
}) {
  const state = buildSessionQuotaBannerState({
    activeProviderId: null,
    modelId: null,
    snapshot: null,
  });

  return {
    state,
    dismissKey: null,
    dismissed: false,
    dismiss: () => undefined,
    markShown: () => undefined,
    takesOverError: false,
    upgradeProviderId: null,
    upgradeActionLabelId: "chat.quota.action.upgrade",
  } as const;
}
