import { beforeEach, describe, expect, it, vi } from "vitest";

const sendCustom = vi.fn();

// 仅为已有上报映射测试显式启用隔离的 SDK mock；NCode 默认关闭另由契约测试覆盖。
vi.mock("@zcode/shared", async (importOriginal) => ({
  ...(await importOriginal<typeof import("@zcode/shared")>()),
  ZCODE_ARMS_RUM_ENDPOINT: "https://example.test/rum-fixture",
}));

vi.mock("@arms/rum-electron", () => ({
  default: { sendCustom },
}));

describe("desktopMcpTelemetry", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("maps lifecycle facts and drops legacy memory telemetry (PRT-019)", async () => {
    const { configureDesktopMcpTelemetry, reportMcpTelemetryToArms } =
      await import("../src/main/desktopMcpTelemetry.js");
    configureDesktopMcpTelemetry({
      appVersion: "3.6.1-test",
      armsEnv: "test",
      deviceMid: "device-a",
    });
    const base = { arch: "arm64", occurredAt: 1_000, platform: "darwin" } as const;

    reportMcpTelemetryToArms(
      {
        ...base,
        kind: "process_start",
        mcpId: "builtin:node_repl",
        mcpInstanceId: "mcp-instance-1",
        mcpIsolation: "workspace",
        mcpSource: "builtin",
      },
      "local",
    );
    reportMcpTelemetryToArms(
      {
        ...base,
        affectedSessionCount: 2,
        exitCode: 1,
        kind: "process_crash",
        mcpId: "builtin:node_repl",
        mcpInstanceId: "mcp-instance-1",
        mcpIsolation: "workspace",
        mcpSource: "builtin",
        signal: null,
        uptimeMs: 10_000,
      },
      "local",
    );
    reportMcpTelemetryToArms(
      {
        ...base,
        configuredCount: 3,
        connectedCount: 2,
        failedCount: 1,
        kind: "session_startup",
        processCount: 1,
        sessionId: "session-1",
      },
      "remote",
    );
    reportMcpTelemetryToArms(
      {
        ...base,
        kind: "memory",
        mcpId: "custom:123456789abc",
        mcpInstanceId: "mcp-instance-2",
        mcpIsolation: "session",
        mcpSource: "custom",
        memoryKb: 65_536,
        memoryScope: "process_tree",
        orphanSuspected: true,
        ownerSessionCount: 0,
        unownedSeconds: 61,
      },
      "remote",
    );

    expect(sendCustom.mock.calls.map(([payload]) => payload.name)).toEqual([
      "perf_mcp_process_start",
      "perf_mcp_process_crash",
      "perf_mcp_session_startup",
    ]);
    expect(sendCustom.mock.calls[0]?.[0]).toMatchObject({ group: "stability", value: 1 });
    expect(sendCustom.mock.calls[2]?.[0]).toMatchObject({ group: "stability", value: 1 });
    expect(JSON.stringify(sendCustom.mock.calls)).not.toContain("mcpServerName");
  });
});
