import { logger } from "./logger.js";
import { initializeCrashCapture, type CrashCapturePaths } from "./desktopCrashCapture.js";

// 须在 appARMSBootstrap 之前完成：先由 desktopEarlyDataBaseDirBootstrap 注入 dataBaseDir，再配置 crashDumps。
// NCode 不初始化 ARMS，因此交给仅本地的 crashReporter（uploadToServer=false）：
// 崩溃转储仍写入本地目录供排错，但不上报远端。
export const crashCapturePaths: CrashCapturePaths = initializeCrashCapture(logger, false);
