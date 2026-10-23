import type { ZCodeRuntimeEnv } from "@zcode/shared";

// NCode 已关闭 Browser RUM；保留既有调用签名，不加载 SDK 或安排重试定时器。
export function initArmsBrowserRumOnce(_runtimeEnv: ZCodeRuntimeEnv): boolean {
  return false;
}

export function scheduleArmsBrowserRumInit(_runtimeEnv: ZCodeRuntimeEnv, _maxAttempts = 50): void {}
