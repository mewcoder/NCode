import type { ZCodeEnv } from "@zcode/shared";

export function shouldShowRemoteConnectionEntry(params: {
  env: ZCodeEnv;
  isIntranet: boolean;
}): boolean {
  void params;
  return false;
}

export function useRemoteConnectionEntryVisibility(): boolean {
  // NCode 隐藏远程连接入口，内部 Host 路由沿用上游。
  return false;
}
