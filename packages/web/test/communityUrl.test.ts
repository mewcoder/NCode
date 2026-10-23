import { expect, it, vi } from "vitest";
import { resolveWebCommunityUrl, resolveWebHelpConfig } from "../src/communityUrl.js";

it("NCode Web 帮助只用本地配置，endpoint 不能启用远端读取", async () => {
  const fetchImpl = vi.fn<typeof fetch>(async () => {
    throw new Error("不应请求远端");
  });
  const options = {
    fetchImpl,
    endpointOrigin: "https://config.example.test",
    localConfig: {
      community_urls: { "zh-CN": "https://local.example.test/community" },
      feedback_url: "https://local.example.test/feedback",
      feedback_use_external_form: false,
    },
  };
  expect((await resolveWebHelpConfig(options)).feedback_url).toBe(options.localConfig.feedback_url);
  expect(await resolveWebCommunityUrl("zh-CN", options)).toBe(
    options.localConfig.community_urls["zh-CN"],
  );
  expect(fetchImpl).not.toHaveBeenCalled();
});
