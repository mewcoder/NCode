import type { IClientConfigService } from "./contract.js";

/** 普通与强刷读取都只返回本地默认值，不发出事件或等待持久化。 */
export async function readLocalClientConfig(service: IClientConfigService) {
  return service.getSnapshot({ forceRefresh: true });
}
