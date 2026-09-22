import assert from "node:assert/strict";
import test from "node:test";
import { sortPluginStoreEntries } from "@zcode/shared";

test("plugin entries use the built-in local category order", () => {
  const items = [
    { id: "z", category: "utilities", displayName: "Zulu" },
    { id: "a", category: "productivity", displayName: "Alpha" },
    { id: "b", category: "other", displayName: "Beta" },
  ];

  assert.deepEqual(
    sortPluginStoreEntries(items, (item) => item, "en-US").map((item) => item.id),
    ["a", "z", "b"],
  );
});
