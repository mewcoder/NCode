import { useBaseWorkspaceServices } from "@/hooks/useWorkspaceServices.js";
import type { GlobalAgentsInstructionsService } from "@/settings/personalization/contract.js";

/** 全局指令属于本机 Host，不跟随当前远程 workspace 的 ServiceProvider。 */
export function useGlobalAgentsInstructionsService(): GlobalAgentsInstructionsService {
  return useBaseWorkspaceServices().settingsSyncService;
}
