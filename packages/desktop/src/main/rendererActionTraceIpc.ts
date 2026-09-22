import { ipcMain } from "electron";
import { PlatformChannels } from "@zcode/shared";
import type { RendererActionTraceBroker } from "./rendererActionTraceBroker.js";
import { resolveLocalRendererActionTraceConfig } from "./localFeatureFlags.js";

export function registerRendererActionTraceIpc(options: {
  broker: RendererActionTraceBroker;
  env?: Record<string, string | undefined>;
  logger: {
    warn(...args: unknown[]): void;
  };
}): () => void {
  type RendererInstanceBinding = {
    current?: string;
    stale: Set<string>;
    dispose: () => void;
  };
  const rendererInstances = new Map<number, RendererInstanceBinding>();
  const bindRendererLifecycle = (sender: Electron.WebContents, senderId: number) => {
    let awaitingNewInstance = false;
    const binding: RendererInstanceBinding = {
      stale: new Set(),
      dispose: () => {
        sender.removeListener("did-start-loading", reset);
        sender.removeListener("did-navigate", completeNavigation);
        sender.removeListener("render-process-gone", reset);
        sender.removeListener("destroyed", destroy);
      },
    };
    const reset = () => {
      if (binding.current) {
        binding.stale.add(binding.current);
        binding.current = undefined;
      }
      awaitingNewInstance = true;
    };
    const completeNavigation = () => {
      // did-start-loading 与 did-navigate 可能属于同一次加载，避免二次退休新实例。
      if (awaitingNewInstance) {
        awaitingNewInstance = false;
        return;
      }
      reset();
    };
    const destroy = () => {
      binding.dispose();
      rendererInstances.delete(senderId);
    };
    sender.on("did-start-loading", reset);
    sender.on("did-navigate", completeNavigation);
    sender.on("render-process-gone", reset);
    sender.once("destroyed", destroy);
    rendererInstances.set(senderId, binding);
    return binding;
  };
  const config = resolveLocalRendererActionTraceConfig(options.env ?? process.env);
  ipcMain.handle(PlatformChannels.GetRendererActionTraceConfig, () => config);
  ipcMain.on(PlatformChannels.ReportRendererActionTraceBatch, (event, batch: unknown) => {
    if (typeof batch !== "object" || batch === null) return;
    const rendererInstanceId = (batch as { rendererInstanceId?: unknown }).rendererInstanceId;
    if (typeof rendererInstanceId !== "string" || rendererInstanceId.length === 0) return;
    const senderId = event.sender.id;
    const binding =
      rendererInstances.get(senderId) ?? bindRendererLifecycle(event.sender, senderId);
    if (binding.stale.has(rendererInstanceId)) {
      options.logger.warn("[renderer-action-trace] stale renderer instance for sender", {
        senderId,
      });
      return;
    }
    if (binding.current && binding.current !== rendererInstanceId) {
      options.logger.warn("[renderer-action-trace] renderer instance changed for sender", {
        senderId,
      });
      return;
    }
    binding.current ??= rendererInstanceId;
    options.broker.enqueue(batch);
  });

  return () => {
    ipcMain.removeHandler(PlatformChannels.GetRendererActionTraceConfig);
    ipcMain.removeAllListeners(PlatformChannels.ReportRendererActionTraceBatch);
    for (const binding of rendererInstances.values()) binding.dispose();
    rendererInstances.clear();
  };
}
