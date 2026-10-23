import { afterEach, expect, it, vi } from "vitest";
import type { ApiClient } from "@zcode/shared";
import { createClientScenesService } from "../src/client-scenes/clientScenesService.js";
const policy = vi.hoisted(() => ({ clientScenes: undefined as boolean | undefined }));
vi.mock("@zcode/shared", async (importOriginal) => {
  const original = await importOriginal<typeof import("@zcode/shared")>();
  return {
    ...original,
    NCODE_FEATURE_POLICY: {
      ...original.NCODE_FEATURE_POLICY,
      get clientScenes() {
        return policy.clientScenes ?? original.NCODE_FEATURE_POLICY.clientScenes;
      },
    },
  };
});
afterEach(() => {
  policy.clientScenes = undefined;
});
it("NCode 实际默认策略关闭场景与模板，重复读取空目录也不请求远端", async () => {
  const request = vi.fn(async () => {
    throw new Error("不应请求模板");
  });
  const service = createClientScenesService({ apiClient: { request } });
  const empty = {
    code: 0,
    msg: "",
    data: [],
  };
  expect(await Promise.all([service.list(), service.list()])).toEqual([empty, empty]);
  expect(request).not.toHaveBeenCalled();
});
it("模板开启时沿用原有 scenes 请求", async () => {
  policy.clientScenes = true;
  const request = vi.fn<ApiClient["request"]>(async () =>
    Response.json({ code: 0, msg: "", data: [] }),
  );
  await createClientScenesService({ apiClient: { request } }).list();
  expect(request).toHaveBeenCalledOnce();
  expect(new URL(String(request.mock.calls[0]?.[0])).pathname).toBe("/api/v1/client/scenes");
});
