import assert from "node:assert/strict";
import test from "node:test";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import {
  CodingPlanUpgradeDialogProvider,
  useCodingPlanUpgradeDialog,
} from "../src/settings/CodingPlanUpgradeDialogProvider.js";

test("disabled purchase provider keeps its context without loading account services", () => {
  function Consumer() {
    const { inventory, openCodingPlanUpgrade } = useCodingPlanUpgradeDialog();
    assert.equal(inventory.status, "ready");
    assert.equal(inventory.entryPlanList, "");
    inventory.retry();
    assert.equal(openCodingPlanUpgrade({ providerId: "bigmodel-coding-plan" }), false);
    return createElement("span", null, "available");
  }

  assert.equal(
    renderToStaticMarkup(
      createElement(CodingPlanUpgradeDialogProvider, null, createElement(Consumer)),
    ),
    "<span>available</span>",
  );
});
