import { mkdtemp, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { PassThrough, Writable } from "node:stream";
import { afterEach, describe, expect, it, vi } from "vitest";
import { DatabaseSync } from "node:sqlite";
import { zcodeProtocolMethods, zcodeStorageStartupStateSchema } from "@zcode/shared";
import { runZCodeProtocolAgent } from "../src/zcode-protocol-entrypoint.js";
import { openProtocolStartupStorage } from "../src/zcode-protocol/storage-startup.js";
import { createSqliteSessionStore } from "@zcode/adapters/storage";
import {
  createMessageId,
  createPartId,
  createProjectId,
  createSessionId,
  type ModelId,
  type ModelProviderId,
} from "@zcode/contracts";
import {
  applyConversationDeltas,
  conversationTopicFrameSchema,
  routedTopicWireFrameSchema,
  V4_METHODS,
  V4_NOTIFICATIONS,
  type ConversationSnapshot,
} from "@zcode/shared/zcode-protocol-v4";
import * as providerStartup from "../src/app/process-provider-registry-runtime.js";
import {
  createNodeProviderRuntimePathEnv,
  encodeProviderConfigFile,
  serializeZCodeBuiltinRelease,
} from "@zcode/provider-node";
import { ModelConfigRules, ProviderConfigMap, ProviderTemplateMap } from "@zcode/provider";
import { createApiKeyProviderConfig } from "./provider-config-fixtures.js";

const dirs: string[] = [];
afterEach(async () => {
  vi.restoreAllMocks();
  for (const dir of dirs.splice(0)) await rm(dir, { recursive: true, force: true });
});
describe("迁移前的 stdio 启动控制帧", () => {
  it.each(["desktop-continuous", "web-remote-replayable"])(
    "HF04：%s 的历史首帧不等 Provider，初始化失败后保留正文并可重试",
    async (clientMode) => {
      const dir = await mkdtemp(join(tmpdir(), "zcode-history-startup-"));
      dirs.push(dir);
      const dbPath = join(dir, "db.sqlite");
      const sessionId = createSessionId("startup-history");
      const store = await createSqliteSessionStore({ dbPath });
      await store.createSession({
        id: sessionId,
        projectID: createProjectId("startup-project"),
        slug: "startup-history",
        directory: dir,
        path: dir,
        title: "E2E_HISTORY_PROTOCOL_STARTUP",
        version: "test",
        time: { created: 1, updated: 1 },
      });
      const messageId = createMessageId("startup-user");
      await store.saveMessage({
        id: messageId,
        sessionID: sessionId,
        role: "user",
        time: { created: 1 },
        agent: "zcode-agent",
        model: {
          providerID: "history-fixture" as ModelProviderId,
          modelID: "fixture-model" as ModelId,
        },
        tools: {},
      });
      await store.savePart({
        id: createPartId("startup-text"),
        messageID: messageId,
        sessionID: sessionId,
        type: "text",
        text: "E2E_HISTORY_PROTOCOL_STARTUP durable history",
      });
      store.close();
      const firstProviderAttempt =
        Promise.withResolvers<
          Awaited<ReturnType<typeof providerStartup.startProcessProviderRegistryRuntime>>
        >();
      void firstProviderAttempt.promise.catch(() => undefined);
      const start = vi
        .spyOn(providerStartup, "startProcessProviderRegistryRuntime")
        .mockReturnValueOnce(firstProviderAttempt.promise);
      const fixture = startReadonlyProtocol(dir);
      const params = {
        topic: `conversation/${sessionId}`,
        connectionId: "startup-test",
        clientMode,
        historyFirst: true,
      };
      try {
        fixture.send(1, zcodeProtocolMethods.sessionLifecycleGetState, { sessionId });
        await vi.waitFor(() =>
          expect(fixture.packets.find((packet) => packet.id === 1)).toMatchObject({
            result: { state: "unloaded" },
          }),
        );
        expect(start).not.toHaveBeenCalled();
        fixture.send(2, V4_METHODS.conversationSubscribe, params);
        await vi.waitFor(() => {
          expect(fixture.snapshot()?.runtimeInitialization?.status).toBe("initializing");
          expect(start).toHaveBeenCalledTimes(1);
        });
        expect(JSON.stringify(fixture.snapshot()?.rows)).toContain("durable history");
        firstProviderAttempt.reject(new Error("E2E Provider preparation unavailable"));
        await vi.waitFor(() =>
          expect(fixture.snapshot()?.runtimeInitialization?.status).toBe("failed"),
        );
        const snapshots = fixture.snapshots();
        expect(snapshots[0].runtimeInitialization?.status).toBe("initializing");
        expect(JSON.stringify(snapshots[0].rows)).toContain("durable history");
        expect(JSON.stringify(fixture.snapshot()?.rows)).toContain("durable history");
        expect(start).toHaveBeenCalledTimes(1);
        const failed = fixture.snapshot()!.runtimeInitialization!;
        fixture.send(3, V4_METHODS.conversationSubscribe, {
          ...params,
          retryInitialization: failed.attemptId,
        });
        await vi.waitFor(() => expect(start).toHaveBeenCalledTimes(2));
        await vi.waitFor(() => {
          const current = fixture.snapshot()?.runtimeInitialization;
          expect(current?.status).toBe("failed");
          expect(current?.attemptId).not.toBe(failed.attemptId);
        });
        expect(JSON.stringify(fixture.snapshot()?.rows)).toContain("durable history");
        const builtin = join(dir, "builtin.json");
        const personal = join(dir, "personal.json");
        await writeFile(
          builtin,
          serializeZCodeBuiltinRelease({
            schemaVersion: 1,
            revision: 1,
            config: {
              providers: ProviderConfigMap.empty(),
              providerTemplates: ProviderTemplateMap.empty(),
              modelConfigRules: ModelConfigRules.empty(),
            },
          }),
        );
        await writeFile(
          personal,
          JSON.stringify(
            encodeProviderConfigFile({
              providers: new ProviderConfigMap([
                [
                  "history-fixture",
                  createApiKeyProviderConfig({
                    apiFormat: "anthropic-messages",
                    apiKey: "fixture-key-not-a-secret",
                    baseURL: "https://history-fixture.invalid",
                    models: ["fixture-model"],
                  }),
                ],
              ]),
              models: ModelConfigRules.empty(),
              defaultModelSelection: { providerId: "history-fixture", modelId: "fixture-model" },
            }),
          ),
        );
        await writeFile(join(dir, "config.json"), JSON.stringify({ features: { mcp: false } }));
        Object.assign(
          fixture.env,
          createNodeProviderRuntimePathEnv({
            zcodeBuiltinFilePath: builtin,
            personalFilePath: personal,
          }),
        );
        fixture.send(4, V4_METHODS.conversationSubscribe, {
          ...params,
          retryInitialization: fixture.snapshot()!.runtimeInitialization!.attemptId,
        });
        await vi.waitFor(
          () => expect(fixture.snapshot()?.runtimeInitialization?.status).toBe("ready"),
          { timeout: 10_000 },
        );
        expect(start).toHaveBeenCalledTimes(3);
        expect(JSON.stringify(fixture.snapshot()?.rows)).toContain("durable history");
      } finally {
        firstProviderAttempt.reject(new Error("E2E startup fixture closed"));
        await fixture.close();
      }
    },
  );

  it("HF04：执行准备单飞，EOF 不等 Registry，迟到资源只释放一次", async () => {
    const dir = await mkdtemp(join(tmpdir(), "zcode-runtime-startup-close-"));
    dirs.push(dir);
    const ready =
      Promise.withResolvers<
        Awaited<ReturnType<typeof providerStartup.startProcessProviderRegistryRuntime>>
      >();
    const dispose = vi.fn();
    const start = vi
      .spyOn(providerStartup, "startProcessProviderRegistryRuntime")
      .mockReturnValue(ready.promise);
    const fixture = startReadonlyProtocol(dir);
    try {
      fixture.send(1, zcodeProtocolMethods.providerRefreshRegistry, { reason: "first" });
      fixture.send(2, zcodeProtocolMethods.providerRefreshRegistry, { reason: "second" });
      await vi.waitFor(() => expect(start).toHaveBeenCalledTimes(1));
      await fixture.close();
      expect(dispose).not.toHaveBeenCalled();
      ready.resolve({ dispose } as Awaited<
        ReturnType<typeof providerStartup.startProcessProviderRegistryRuntime>
      >);
      await vi.waitFor(() => expect(dispose).toHaveBeenCalledTimes(1));
    } finally {
      ready.resolve({ dispose } as Awaited<
        ReturnType<typeof providerStartup.startProcessProviderRegistryRuntime>
      >);
      await fixture.close();
    }
  });

  it("HF04：未配置 Provider 时仍可启动只读协议，不提前准备执行资源", async () => {
    const dir = await mkdtemp(join(tmpdir(), "zcode-readonly-startup-"));
    dirs.push(dir);
    const input = new PassThrough();
    const packets: Array<{ id?: number; result?: unknown; error?: unknown }> = [];
    let pending = "";
    const output = new Writable({
      write(chunk, _encoding, callback) {
        pending += String(chunk);
        const lines = pending.split("\n");
        pending = lines.pop()!;
        for (const line of lines) if (line) packets.push(JSON.parse(line));
        callback();
      },
    });
    const running = runZCodeProtocolAgent({
      env: {
        ZCODE_SESSION_DB_PATH: join(dir, "db.sqlite"),
        ZCODE_STORAGE_DIR: dir,
        ZCODE_LOG_DIR: join(dir, "log"),
      },
      input,
      output,
    });
    void running.catch(() => undefined);
    try {
      input.write(
        `${JSON.stringify({ id: 1, method: zcodeProtocolMethods.runtimeCapabilities, params: {} })}\n`,
      );
      await vi.waitFor(() => {
        expect(packets.find((packet) => packet.id === 1)).toMatchObject({
          result: { historyFirst: true },
        });
      });
    } finally {
      input.end();
      await running;
    }
  });

  it("真实 Writable 回调完成前不执行 SQL；无账号/Provider 参数也能准备数据库", async () => {
    const dir = await mkdtemp(join(tmpdir(), "zcode-storage-wire-"));
    dirs.push(dir);
    const dbPath = join(dir, "db.sqlite");
    const packets: unknown[] = [];
    let release!: () => void;
    let observed!: () => void;
    const barrier = new Promise<void>((resolve) => {
      observed = resolve;
    });
    const output = new Writable({
      write(chunk, _encoding, callback) {
        const packet = JSON.parse(String(chunk));
        packets.push(packet);
        if (
          packet.params.phase === "migrating" &&
          packet.params.migrationId === "0001_base_session_store"
        ) {
          release = () => callback();
          observed();
        } else callback();
      },
    });
    const diagnostics: unknown[] = [];
    const opening = openProtocolStartupStorage({
      dbPath,
      output,
      onProgress: (progress) => {
        diagnostics.push(progress);
      },
    });
    await barrier;
    const reader = new DatabaseSync(dbPath);
    try {
      expect(
        reader.prepare("SELECT 1 FROM sqlite_schema WHERE name='session'").get(),
      ).toBeUndefined();
    } finally {
      reader.close();
      release();
    }
    const store = await opening;
    try {
      const states = packets.map((packet) => {
        const envelope = packet as { method: string; params: unknown };
        expect(envelope.method).toBe("startup/storageState");
        return zcodeStorageStartupStateSchema.parse(envelope.params);
      });
      expect(states.at(-1)?.phase).toBe("ready");
      expect(new Set(states.map((s) => s.attemptId)).size).toBe(1);
      expect(states.map((s) => s.sequence)).toEqual(states.map((_, i) => i + 1));
      expect(JSON.stringify(packets)).not.toContain(dir);
      expect(diagnostics).toEqual(states);
    } finally {
      store.close();
    }
  });
});

function startReadonlyProtocol(dir: string) {
  const input = new PassThrough();
  const packets: Array<{ id?: number; method?: string; params?: unknown; result?: unknown }> = [];
  let pending = "";
  const output = new Writable({
    write(chunk, _encoding, callback) {
      pending += String(chunk);
      const lines = pending.split("\n");
      pending = lines.pop()!;
      for (const line of lines) {
        if (!line) continue;
        const packet = JSON.parse(line);
        packets.push(packet);
        if (packet.method === zcodeProtocolMethods.sessionRequestRuntimePreferences) {
          input.write(
            `${JSON.stringify({
              id: packet.id,
              result: {
                askUserQuestionAutoResolutionEnabled: true,
                memoryEnabled: false,
                nativeSearchEnhancementsEnabled: true,
              },
            })}\n`,
          );
        }
      }
      callback();
    },
  });
  const env = {
    HOME: dir,
    USERPROFILE: dir,
    ZCODE_DATA_BASE_DIR: dir,
    ZCODE_SESSION_DB_PATH: join(dir, "db.sqlite"),
    ZCODE_STORAGE_DIR: dir,
    ZCODE_LOG_DIR: join(dir, "log"),
  };
  const running = runZCodeProtocolAgent({
    env,
    input,
    output,
  });
  void running.catch(() => undefined);
  const snapshots = () => {
    let current: ConversationSnapshot | undefined;
    const result: ConversationSnapshot[] = [];
    for (const packet of packets) {
      if (packet.method !== V4_NOTIFICATIONS.conversationFrame) continue;
      const wire = routedTopicWireFrameSchema.parse(packet.params);
      if (wire.kind !== "complete") continue;
      const frame = conversationTopicFrameSchema.parse(wire.frame);
      if (frame.payload.kind === "snapshot") current = frame.payload.snapshot;
      else if (current) current = applyConversationDeltas(current, frame.payload.deltas);
      if (current) result.push(current);
    }
    return result;
  };
  return {
    env,
    packets,
    snapshots,
    snapshot: () => snapshots().at(-1),
    send: (id: number, method: string, params: unknown) =>
      input.write(`${JSON.stringify({ id, method, params })}\n`),
    close: async () => {
      input.end();
      await running;
    },
  };
}
