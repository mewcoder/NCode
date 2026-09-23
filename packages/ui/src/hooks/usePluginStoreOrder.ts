import { useCallback, useEffect, useRef, useState } from "react";
import type { PluginStoreOrder } from "@zcode/shared";
import { useServices } from "@/hooks/useServices.js";
import { logger } from "@/logger.js";

const LOCAL_PLUGIN_STORE_ORDER: PluginStoreOrder = { code: {}, work: {} };

/** NCode 默认采用本地排序；远端读取实现保留，供需要时对照和恢复。 */
export function usePluginStoreOrder(enabled = false) {
  const { clientConfigService: service } = useServices();
  const [snapshot, setSnapshot] = useState<{
    service: typeof service;
    order: PluginStoreOrder | null;
  }>();
  const generation = useRef(0);
  const refresh = useCallback(
    async (forceRefresh = false) => {
      if (!enabled) return;
      const current = ++generation.current;
      try {
        const { pluginStoreOrder: order } = await service.getSnapshot({ forceRefresh });
        if (generation.current === current) setSnapshot({ service, order });
      } catch {
        if (generation.current === current) {
          logger.warn("[PluginStoreOrder] 配置读取失败，保留当前排序");
        }
      }
    },
    [enabled, service],
  );

  useEffect(() => {
    if (enabled) void refresh();
    return () => {
      generation.current += 1;
    };
  }, [enabled, refresh]);

  return {
    order: enabled
      ? snapshot?.service === service
        ? snapshot.order
        : null
      : LOCAL_PLUGIN_STORE_ORDER,
    refresh,
  };
}
