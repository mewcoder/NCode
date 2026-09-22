import assert from "node:assert/strict";
import test from "node:test";
import {
  resolveLocalDesktopContextPromptEnabled,
  resolveLocalRendererActionTraceConfig,
} from "../src/main/localFeatureFlags.js";

test("local desktop feature flags default to disabled", () => {
  assert.equal(resolveLocalDesktopContextPromptEnabled({}), false);
  assert.deepEqual(resolveLocalRendererActionTraceConfig({}), {
    enabled: false,
    sampleRatio: 0,
    enabledGroups: [],
    configVersion: "disabled",
  });
});

test("local desktop feature flags require explicit opt-in", () => {
  assert.equal(
    resolveLocalDesktopContextPromptEnabled({
      ZCODE_DESKTOP_CONTEXT_PROMPT_ENABLED: "yes",
    }),
    true,
  );
  assert.deepEqual(
    resolveLocalRendererActionTraceConfig({
      ZCODE_RENDERER_ACTION_TRACE_ENABLED: "on",
      ZCODE_LOCAL_TTFT_ENABLED: "true",
    }),
    {
      enabled: true,
      localTtftEnabled: true,
      sampleRatio: 1,
      enabledGroups: ["core", "settings"],
      configVersion: "local-explicit",
    },
  );
});
