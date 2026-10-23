import { afterEach, describe, expect, it, vi } from "vitest";

const { sdkLoaded } = vi.hoisted(() => ({ sdkLoaded: vi.fn() }));
vi.mock("@arms/rum-electron", () => {
  sdkLoaded();
  throw new Error("关闭态不能加载 SDK");
});

describe("NCode 桌面遥测关闭边界", () => {
  afterEach(() => vi.unstubAllEnvs());

  it("旧上报环境变量不能加载 SDK", async () => {
    vi.stubEnv("OTEL_EXPORTER_OTLP_ENDPOINT", "https://example.test/telemetry");
    vi.stubEnv("ZCODE_ARMS_RUM_ENDPOINT", "https://example.test/rum");
    const { desktopRum } = await import("./index.js");
    expect(desktopRum).toBeUndefined();
    expect(sdkLoaded).not.toHaveBeenCalled();
  });

  it("批次不被读取或入队，关闭可重复执行", async () => {
    const { createDisabledTelemetrySink } = await import("./index.js");
    const inspect = vi.fn(() => {
      throw new Error("关闭出口不能序列化或检查批次");
    });
    const batch = {
      toJSON: inspect,
      get spans() {
        return inspect();
      },
    };
    const sink = createDisabledTelemetrySink();
    expect(sink.enqueue(batch)).toBe(false);
    expect(sink.enqueue(batch)).toBe(false);
    await Promise.all([sink.flush(), sink.shutdown(), sink.shutdown()]);
    expect(sink.enqueue(batch)).toBe(false);
    expect(inspect).not.toHaveBeenCalled();
    expect(sdkLoaded).not.toHaveBeenCalled();
  });
});
