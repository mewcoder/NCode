import { afterEach, describe, expect, it, vi } from "vitest";

const { init, sdkLoaded } = vi.hoisted(() => ({ init: vi.fn(), sdkLoaded: vi.fn() }));

vi.mock("@arms/rum-electron/browser", () => {
  sdkLoaded();
  return { default: { init } };
});

describe("ARMS Browser init", () => {
  afterEach(() => {
    init.mockReset();
    vi.resetModules();
    vi.unstubAllGlobals();
    vi.useRealTimers();
  });

  it("无 ARMS 端点时不初始化 SDK，即使已有事件桥", async () => {
    vi.stubGlobal("__ZCODE_ENV__", "production");
    vi.stubGlobal("ArmsEventBridge", { send: vi.fn() });
    const { initArmsBrowserRumOnce } = await import("../src/shared/armsBrowserInit.js");

    expect(initArmsBrowserRumOnce("development")).toBe(false);
    expect(init).not.toHaveBeenCalled();
    expect(sdkLoaded).not.toHaveBeenCalled();
  });

  it("Browser RUM 的兼容入口不加载 SDK 或创建重试定时器", async () => {
    vi.useFakeTimers();
    const { scheduleArmsBrowserRumInit } = await import("../src/shared/armsBrowserInit.js");
    scheduleArmsBrowserRumInit("production");
    expect(vi.getTimerCount()).toBe(0);
    expect(sdkLoaded).not.toHaveBeenCalled();
  });
});
