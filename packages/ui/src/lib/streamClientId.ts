/**
 * 设备标识符 —— renderer 进程内单例缓存
 *
 * 生成策略：
 * - 桌面端：使用 main 进程提供的 deviceMid（基于 userData 路径的 SHA-256，稳定且唯一）
 * - 浏览器端：使用物理属性指纹（browserPlatform + screen.width/height + colorDepth），
 *   在同一浏览器设备上保持稳定
 */
import { createUuid } from "@zcode/shared";

let cachedStreamClientId: string | null = null;

/**
 * 设置稳定的设备 ID（由 platform.getDeviceId() 提供）。
 * 必须在首次调用 getStreamClientId() 之前调用。
 */
export function setStreamClientId(deviceId: string): void {
  const normalizedDeviceId = deviceId.trim();
  if (!normalizedDeviceId) {
    // deviceId 注入异常时如果写入空字符串，所有实例会共享 "renderer:"，
    // owner/observer 过滤会误判成同一客户端。这里回退到进程内稳定随机值，避免跨实例碰撞。
    cachedStreamClientId = cachedStreamClientId ?? `renderer:fallback-${createUuid()}`;
    return;
  }
  cachedStreamClientId = `renderer:${normalizedDeviceId}`;
}

/**
 * 生成浏览器端物理属性指纹。
 * 用于 Web 端在 platform.getDeviceId() 返回之前生成稳定的设备 ID。
 */
export function generateBrowserDeviceFingerprint(): string {
  const nav = globalThis.navigator as Navigator & { platform?: string };
  const platform = nav?.platform ?? "";
  const screenWidth = globalThis.screen?.width;
  const screenHeight = globalThis.screen?.height;
  const colorDepth = globalThis.screen?.colorDepth;
  const parts = [
    platform,
    screenWidth !== undefined ? String(screenWidth) : "",
    screenHeight !== undefined ? String(screenHeight) : "",
    colorDepth !== undefined ? String(colorDepth) : "",
  ];
  return parts.filter(Boolean).join("|");
}
