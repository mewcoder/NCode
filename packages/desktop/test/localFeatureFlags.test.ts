import assert from "node:assert/strict";
import test from "node:test";
import { resolveLocalDesktopContextPromptEnabled } from "../src/main/localFeatureFlags.js";

test("local desktop feature flags default to disabled", () => {
  assert.equal(resolveLocalDesktopContextPromptEnabled({}), false);
});

test("local desktop feature flags require explicit opt-in", () => {
  assert.equal(
    resolveLocalDesktopContextPromptEnabled({
      ZCODE_DESKTOP_CONTEXT_PROMPT_ENABLED: "yes",
    }),
    true,
  );
});
