import type { ApiClient } from "@zcode/shared";
import type { ClientScenesResponse, IClientScenesService } from "./clientScenes.js";

// import { readApiJson } from "../providers/api/apiJson.js";
// import { ZCODE_CLIENT_SCENES_URL } from "../providers/api/apiEndpoints.js";

export function createClientScenesService(_dependencies: {
  apiClient: ApiClient;
}): IClientScenesService {
  return {
    // 暂停 Scenes 接口请求，返回空结果以兼容现有调用方。
    list: async (): Promise<ClientScenesResponse> => ({ code: 0, msg: "", data: [] }),
    // 原请求保留，恢复时再启用：
    // list: () =>
    //   readApiJson<ClientScenesResponse>(_dependencies.apiClient, ZCODE_CLIENT_SCENES_URL, {
    //     method: "GET",
    //   }),
  };
}
