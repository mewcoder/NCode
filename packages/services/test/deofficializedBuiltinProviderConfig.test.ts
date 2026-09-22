import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

test("bundled provider config excludes official account and off-peak rules", async () => {
  const text = await readFile("config/provider/zcode-builtin.json", "utf8");
  const config = JSON.parse(text) as {
    config: {
      providerConfigRules: { providerRules: unknown[]; templateRules: unknown[] };
      modelConfigRules: Record<string, unknown[]>;
    };
  };

  assert.deepEqual(config.config.providerConfigRules.providerRules, []);
  assert.doesNotMatch(text, /"type": "zhipu-account"/u);
  assert.doesNotMatch(text, /zcode-plan|off-peak/iu);
  assert.match(text, /zhipu-coding-plan-api-key/u);
  assert.ok(config.config.providerConfigRules.templateRules.length > 0);
});
