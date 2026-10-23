import { ZCODE_ARMS_RUM_ENDPOINT } from "@zcode/shared";
import type { DesktopRumClient, DisabledTelemetrySink } from "./contract.js";

// 修复依据：关闭 init() 仍会让静态 SDK 导入进入 Main 并被打包。
// 端点由 NCode 构建固定为空，条件动态导入也会从生产构建中消除。
export const desktopRum: DesktopRumClient | undefined = ZCODE_ARMS_RUM_ENDPOINT
  ? (await import("@arms/rum-electron")).default
  : undefined;

export function createDisabledTelemetrySink(): DisabledTelemetrySink {
  return {
    enqueue: () => false,
    flush: async () => {},
    shutdown: async () => {},
  };
}
