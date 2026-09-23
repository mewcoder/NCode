import { logger } from "./logger.js";
import { initializeCrashCapture, type CrashCapturePaths } from "./desktopCrashCapture.js";
import { ZCODE_ARMS_RUM_ENDPOINT, ZCODE_TELEMETRY_ENABLED } from "@zcode/shared";

// 须在 appARMSBootstrap 之前完成：先由 desktopEarlyDataBaseDirBootstrap 注入 dataBaseDir，再配置 crashDumps。
// 仅在 ARMS 实际启用时跳过本地 crashReporter，避免关闭遥测后也丢失本地崩溃转储。
export const crashCapturePaths: CrashCapturePaths = initializeCrashCapture(
  logger,
  ZCODE_TELEMETRY_ENABLED && Boolean(ZCODE_ARMS_RUM_ENDPOINT),
);
