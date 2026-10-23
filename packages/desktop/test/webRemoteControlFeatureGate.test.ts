// @vitest-environment jsdom
import { readFile } from "node:fs/promises";
import { resolve } from "node:path";
import { createElement, type ReactNode } from "react";
import { act, cleanup, renderHook } from "@testing-library/react";
import ts from "typescript";
import { afterEach, describe, expect, it, vi } from "vitest";
import { NCODE_FEATURE_POLICY } from "@zcode/shared";
import {
  WebRemoteControlFeatureProvider,
  useWebRemoteControlFeatureEnabled,
} from "@/WebRemoteControlFeatureProvider.js";
import { useWebRemoteControlStatus } from "@/hooks/useWebRemoteControlStatus.js";
import { createWebRemoteControlFeatureGate } from "../src/main/webRemoteControlFeatureGate.js";

const { platform, dispose } = vi.hoisted(() => {
  const dispose = vi.fn();
  return {
    dispose,
    platform: {
      getWebRemoteControlStatus: vi.fn(async () => ({ status: "idle" })),
      onWebRemoteControlStatusChanged: vi.fn(() => dispose),
    },
  };
});
vi.mock("@/hooks/usePlatform.js", () => ({ useOptionalPlatform: () => platform }));
afterEach(() => {
  cleanup();
  vi.useRealTimers();
  vi.clearAllMocks();
});

async function rendererFeatureEnabled(): Promise<boolean | undefined> {
  const source = ts.createSourceFile(
    "main.tsx",
    await readFile(resolve(import.meta.dirname, "../src/renderer/src/main.tsx"), "utf8"),
    ts.ScriptTarget.Latest,
    true,
    ts.ScriptKind.TSX,
  );
  let root: ts.JsxSelfClosingElement | undefined;
  const visit = (node: ts.Node) => {
    if (ts.isJsxSelfClosingElement(node) && node.tagName.getText(source) === "Root") root = node;
    ts.forEachChild(node, visit);
  };
  visit(source);
  expect(root).toBeDefined();
  const attribute = root!.attributes.properties.find(
    (item) =>
      ts.isJsxAttribute(item) && item.name.getText(source) === "webRemoteControlFeatureEnabled",
  );
  if (!attribute) return undefined;
  if (
    !ts.isJsxAttribute(attribute) ||
    !attribute.initializer ||
    !ts.isJsxExpression(attribute.initializer)
  )
    throw new Error("桌面远控开关必须显式读取本地策略");
  const expression = attribute.initializer.expression;
  if (
    !expression ||
    !ts.isPropertyAccessExpression(expression) ||
    expression.expression.getText(source) !== "NCODE_FEATURE_POLICY"
  )
    throw new Error("桌面远控开关必须显式读取本地策略");
  const value = NCODE_FEATURE_POLICY[expression.name.text as keyof typeof NCODE_FEATURE_POLICY];
  if (typeof value !== "boolean") throw new Error("远控策略必须为 boolean");
  return value;
}

function useBothStatusConsumers() {
  const enabled = useWebRemoteControlFeatureEnabled();
  useWebRemoteControlStatus({ enabled });
  return useWebRemoteControlStatus({ enabled });
}

describe("createWebRemoteControlFeatureGate", () => {
  it("桌面实际 Root 参数关闭 Root 和侧栏的状态轮询及订阅", async () => {
    const enabled = await rendererFeatureEnabled();
    vi.useFakeTimers();
    const wrapper = ({ children }: { children: ReactNode }) =>
      createElement(WebRemoteControlFeatureProvider, { enabled, children });
    const { result } = renderHook(useBothStatusConsumers, { wrapper });
    await act(async () => {
      await vi.advanceTimersByTimeAsync(3000);
    });
    expect(result.current.status).toBe("idle");
    expect(platform.getWebRemoteControlStatus).not.toHaveBeenCalled();
    expect(platform.onWebRemoteControlStatusChanged).not.toHaveBeenCalled();
    expect(vi.getTimerCount()).toBe(0);
  });

  it("显式启用的隔离消费者保留轮询，卸载释放订阅和计时器", async () => {
    vi.useFakeTimers();
    const wrapper = ({ children }: { children: ReactNode }) =>
      createElement(WebRemoteControlFeatureProvider, { enabled: true, children });
    const { unmount } = renderHook(useBothStatusConsumers, { wrapper });
    await act(async () => {
      await vi.advanceTimersByTimeAsync(3000);
    });
    expect(platform.getWebRemoteControlStatus).toHaveBeenCalledTimes(8);
    expect(platform.onWebRemoteControlStatusChanged).toHaveBeenCalledTimes(2);
    unmount();
    expect(dispose).toHaveBeenCalledTimes(2);
    expect(vi.getTimerCount()).toBe(0);
  });

  it("allows development wiring", () => {
    const gate = createWebRemoteControlFeatureGate(true);

    expect(gate.isEnabled()).toBe(true);
    expect(() => gate.assertEnabled()).not.toThrow();
  });

  it("rejects production wiring before QR material is returned", () => {
    const gate = createWebRemoteControlFeatureGate(false);

    expect(gate.isEnabled()).toBe(false);
    expect(() => gate.assertEnabled()).toThrow("Web remote control is disabled");
  });
});
