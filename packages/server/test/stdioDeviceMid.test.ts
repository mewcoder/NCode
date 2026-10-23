import { mkdtemp, rm, stat } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterEach, describe, expect, it, vi } from "vitest";
import { ensureTelemetryDeviceMid } from "@zcode/services/node";
import { ensureRemoteServerDeviceMid } from "../src/stdioDeviceMid.js";

const endpoints = vi.hoisted(() => ({ rum: "", events: "" }));
vi.mock("@zcode/shared", async (importOriginal) => ({
  ...(await importOriginal<typeof import("@zcode/shared")>()),
  get ZCODE_ARMS_RUM_ENDPOINT() {
    return endpoints.rum;
  },
  get ZCODE_TELEMETRY_REPORT_ENDPOINT() {
    return endpoints.events;
  },
}));

afterEach(() => {
  endpoints.rum = "";
  endpoints.events = "";
  vi.unstubAllEnvs();
});

describe("ensureRemoteServerDeviceMid", () => {
  it("空构建端点下不初始化或写入 MID，旧启用环境变量无效", async () => {
    vi.stubEnv("ZCODE_ARMS_RUM_ENDPOINT", "https://example.test/rum");
    vi.stubEnv("ZCODE_TELEMETRY_REPORT_ENDPOINT", "https://example.test/events");
    const home = await mkdtemp(join(tmpdir(), "ncode-server-mid-"));
    const log = vi.fn();
    const ensureDeviceMid = vi.fn(() => ensureTelemetryDeviceMid({ homeDir: home }));
    try {
      await expect(ensureRemoteServerDeviceMid({ ensureDeviceMid, log })).resolves.toBeUndefined();
      expect(ensureDeviceMid).not.toHaveBeenCalled();
      expect(log).not.toHaveBeenCalled();
      await expect(stat(join(home, ".zcode", "v2", "telemetry-state.json"))).rejects.toMatchObject({
        code: "ENOENT",
      });
    } finally {
      await rm(home, { recursive: true, force: true });
    }
  });

  it.each(["rum", "events"] as const)(
    "%s 端点启用时确保 deviceMid 并返回，不打告警",
    async (key) => {
      endpoints[key] = "https://example.test/report";
      const log = vi.fn();
      const ensureDeviceMid = vi.fn(async () => "device-mid-remote");

      await expect(ensureRemoteServerDeviceMid({ ensureDeviceMid, log })).resolves.toBe(
        "device-mid-remote",
      );

      expect(ensureDeviceMid).toHaveBeenCalledTimes(1);
      expect(log).not.toHaveBeenCalled();
    },
  );

  it("确保失败时记录原因并继续启动，不抛错也不伪造设备 ID", async () => {
    endpoints.events = "https://example.test/events";
    const log = vi.fn();
    const ensureDeviceMid = vi.fn(async () => {
      throw new Error("Telemetry state lock timeout");
    });

    await expect(ensureRemoteServerDeviceMid({ ensureDeviceMid, log })).resolves.toBeUndefined();

    expect(log).toHaveBeenCalledTimes(1);
    expect(String(log.mock.calls[0]?.[0])).toContain("X-Device-Mid");
    expect(String(log.mock.calls[0]?.[1])).toContain("Telemetry state lock timeout");
  });
});
