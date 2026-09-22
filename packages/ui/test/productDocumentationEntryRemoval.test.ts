import assert from "node:assert/strict";
import test from "node:test";
import { createQuickPickCommands } from "../src/quickpick/quickPickCommands.js";

test("command center does not expose the retired official product documentation entry", () => {
  const noop = () => {};
  const commands = createQuickPickCommands({
    allowOpenWorkspace: true,
    isSidebarVisible: true,
    themeTarget: "dark",
    shortcuts: {
      newTask: "",
      openWorkspace: "",
      toggleSidebar: "",
      toggleTerminal: "",
    },
    handlers: {
      createTask: noop,
      openWorkspace: noop,
      openSettings: noop,
      openSkillsSettings: noop,
      openMcpSettings: noop,
      switchTheme: noop,
      toggleSidebar: noop,
      toggleTerminal: noop,
      togglePreview: noop,
      openTerminalTab: noop,
      openBrowserTab: noop,
      openReviewTab: noop,
    },
  });

  assert.equal(
    commands.some((command) => command.id === "product-docs"),
    false,
  );
  assert.equal(
    commands.some((command) =>
      command.keywords.some((keyword) =>
        ["docs", "documentation", "product docs", "文档", "产品文档"].includes(keyword),
      ),
    ),
    false,
  );
});
