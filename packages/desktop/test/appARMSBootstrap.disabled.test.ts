import { beforeEach, describe, expect, it, vi } from "vitest";

const init = vi.fn((_config: unknown) => Promise.resolve());

vi.mock("@arms/rum-electron", () => ({
  default: { init, client: { useReporter: vi.fn() } },
}));

vi.mock("../src/main/desktopDeviceMid.js", () => ({
  ensureDesktopDeviceMidSync: vi.fn(() => "test-device-mid"),
}));

vi.mock("../src/main/desktopNetworkTelemetry.js", () => ({
  ingestArmsApiEventsFromBatch: vi.fn(),
}));

vi.mock("../src/main/desktopRuntimeEnv.js", () => ({
  desktopRuntimeEnv: "production",
  runtimeApplicationName: "ncode-test",
}));

vi.mock("../src/main/logger.js", () => ({
  logger: { info: vi.fn(), warn: vi.fn(), error: vi.fn() },
}));

// NCode 构建把 ARMS 端点固定为空；此时既不能初始化 SDK，也不能读取或创建设备身份。
vi.mock("@zcode/shared", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@zcode/shared")>();
  return {
    ...actual,
    ZCODE_ARMS_RUM_ENDPOINT: "",
    ZCODE_ENV: "production",
    ZCODE_VERSION: "0.0.0-test",
    mapZCodeEnvToArmsRumEnv: vi.fn(() => "prod"),
  };
});

describe("appARMSBootstrap with ARMS disabled at build time", () => {
  beforeEach(() => {
    vi.resetModules();
    init.mockClear();
  });

  it("skips SDK init and never creates a device identity", async () => {
    const { ensureDesktopDeviceMidSync } = await import("../src/main/desktopDeviceMid.js");
    const { armsInitPromise } = await import("../src/main/appARMSBootstrap.js");

    await expect(armsInitPromise).resolves.toBeUndefined();
    expect(init).not.toHaveBeenCalled();
    expect(ensureDesktopDeviceMidSync).not.toHaveBeenCalled();
  });
});
