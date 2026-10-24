import { clearAppData } from "../helpers/desktop-app.js";
import {
  prepareV4ConversationE2E,
  sendV4Prompt,
  waitForV4AssistantMessageContaining,
  waitForV4ConversationState,
} from "../helpers/v4-conversation.js";
import {
  getUpstreamRequestToolNames,
  waitForUpstreamRequest,
} from "../helpers/conversation-session-network.js";

// 只验证 NCode 固定 onDemand 的改动面：普通消息不激活，/workflow 激活。
// 本地回放仅返回文本，不调用 CreateWorkflow，不绕过其确认流程。
describe("NCode 工作流命令启用策略", () => {
  after(async () => {
    await browser.electron.restoreAllMocks();
    await clearAppData();
  });

  it("NWF-01 普通消息不暴露 CreateWorkflow，/workflow 后暴露", async function () {
    this.timeout(120_000);
    await prepareV4ConversationE2E();
    await assertToolsForMessage("E2E_NWF_ORDINARY", false);
    await assertToolsForMessage("E2E_NWF_COMMAND", true);
  });
});

async function assertToolsForMessage(marker: string, workflow: boolean) {
  await sendV4Prompt(
    `${workflow ? "/workflow " : ""}${marker}: Reply with exactly ncode-workflow-ok.`,
  );
  const query = {
    includes: [marker],
    excludes: ["Generate a concise title", "CRITICAL: Respond with TEXT ONLY"],
  };
  await waitForUpstreamRequest(query, `没有捕获 ${marker} 的主请求`, 60_000);
  const tools = await getUpstreamRequestToolNames(query);
  expect(tools.includes("CreateWorkflow")).toBe(workflow);
  await waitForV4AssistantMessageContaining("ncode-workflow-ok");
  await waitForV4ConversationState(
    (s) => s.state === "idle" && s.queueCount === 0,
    "工作流验收消息未收口",
    60_000,
  );
}
