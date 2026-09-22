import { logger } from "./logger.js";
import {
  initializeCrashCapture,
  registerCrashEventMonitor,
  type CrashCapturePaths,
} from "./desktopCrashCapture.js";

// 须在 Electron 创建窗口前完成：先由 desktopEarlyDataBaseDirBootstrap 注入 dataBaseDir，再配置本地 crashDumps。
// 只保留本地 crashReporter 和归档，不上传远端 crash 数据。
export const crashCapturePaths: CrashCapturePaths = initializeCrashCapture(logger, false);
registerCrashEventMonitor(logger, crashCapturePaths);
