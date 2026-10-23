// @vitest-environment jsdom
import { createElement } from "react";
import { act, cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { PersonalizationSection } from "./index.js";

const { local, toast, intl, language } = vi.hoisted(() => ({
  local: {
    getGlobalAgentsInstructionsPath: vi.fn(),
    readGlobalAgentsInstructions: vi.fn(),
    writeGlobalAgentsInstructions: vi.fn(),
  },
  toast: vi.fn(),
  intl: {
    formatMessage: ({ id }: { id: string }, values?: Record<string, string>) =>
      values?.path ? `${id}:${values.path}` : id,
  },
  language: { intl: null as { formatMessage: (descriptor: { id: string }) => string } | null },
}));

vi.mock("@/hooks/useWorkspaceServices.js", () => ({
  useBaseWorkspaceServices: () => ({ settingsSyncService: local }),
}));
vi.mock("@/i18n/IntlProvider.js", () => ({
  useZCodeIntl: () => ({ intl: language.intl ?? intl }),
}));
vi.mock("@/components/ui/toast.js", () => ({ toast }));
vi.mock("@/logger.js", () => ({ logger: { warn: vi.fn() } }));
vi.mock("@/settings/SettingsPageParts.js", () => ({
  SettingsGroupCard: ({ children }: { children: import("react").ReactNode }) => children,
}));

beforeEach(() => {
  vi.resetAllMocks();
  language.intl = null;
  local.getGlobalAgentsInstructionsPath.mockResolvedValue("/local/.zcode/AGENTS.md");
  local.readGlobalAgentsInstructions.mockResolvedValue("原有指令");
  local.writeGlobalAgentsInstructions.mockResolvedValue(undefined);
});
afterEach(cleanup);

const textbox = () => screen.getByRole("textbox") as HTMLTextAreaElement;
const save = () => screen.getByRole("button", { name: "common.save" }) as HTMLButtonElement;

describe("本机全局指令编辑契约", () => {
  it("切换语言只更新文案，保留未保存草稿且不重新读取", async () => {
    const view = render(createElement(PersonalizationSection));
    await waitFor(() => expect(textbox().value).toBe("原有指令"));
    fireEvent.change(textbox(), { target: { value: "未保存的指令" } });
    language.intl = { formatMessage: ({ id }) => `en:${id}` };
    view.rerender(createElement(PersonalizationSection));
    await act(async () => {});
    expect(screen.getByLabelText("en:settings.customInstructions")).toBeDefined();
    expect(textbox().value).toBe("未保存的指令");
    const button = screen.getByRole("button", { name: "en:common.save" }) as HTMLButtonElement;
    expect(button.disabled).toBe(false);
    expect(local.readGlobalAgentsInstructions).toHaveBeenCalledTimes(1);
    expect(local.getGlobalAgentsInstructionsPath).toHaveBeenCalledTimes(1);
    expect(local.writeGlobalAgentsInstructions).not.toHaveBeenCalled();
    fireEvent.click(button);
    await waitFor(() => expect(toast).toHaveBeenCalledWith("en:settings.customInstructionsSaved"));
    expect(local.writeGlobalAgentsInstructions).toHaveBeenCalledExactlyOnceWith("未保存的指令");
  });

  it("读取在途切换语言不重读，迟到失败使用当前语言提示", async () => {
    let failRead!: (error: Error) => void;
    local.readGlobalAgentsInstructions.mockReturnValue(
      new Promise<string>((_resolve, reject) => {
        failRead = reject;
      }),
    );
    const view = render(createElement(PersonalizationSection));
    language.intl = { formatMessage: ({ id }) => `en:${id}` };
    view.rerender(createElement(PersonalizationSection));
    expect(local.readGlobalAgentsInstructions).toHaveBeenCalledTimes(1);
    expect(textbox().disabled).toBe(true);
    await act(async () => failRead(new Error("read failed")));
    expect(toast).toHaveBeenCalledExactlyOnceWith("en:settings.customInstructionsLoadFailed");
    expect(textbox().disabled).toBe(true);
    expect(local.writeGlobalAgentsInstructions).not.toHaveBeenCalled();
  });

  it("通过本机 hook 加载实际路径，修改后沿既有接口保存", async () => {
    render(createElement(PersonalizationSection));
    await waitFor(() => expect(textbox().value).toBe("原有指令"));
    expect(
      screen.getByText("settings.customInstructionsFilePath:/local/.zcode/AGENTS.md"),
    ).toBeDefined();
    expect(save().disabled).toBe(true);
    fireEvent.change(textbox(), { target: { value: "新的指令\n" } });
    fireEvent.click(save());
    await waitFor(() => expect(toast).toHaveBeenCalledWith("settings.customInstructionsSaved"));
    expect(local.writeGlobalAgentsInstructions).toHaveBeenCalledExactlyOnceWith("新的指令\n");
    expect(save().disabled).toBe(true);
  });

  it("读取尚未完成时禁止编辑与保存", () => {
    local.readGlobalAgentsInstructions.mockReturnValue(new Promise(() => {}));
    render(createElement(PersonalizationSection));
    expect(textbox().disabled).toBe(true);
    expect(save().disabled).toBe(true);
    expect(local.writeGlobalAgentsInstructions).not.toHaveBeenCalled();
  });

  it("读取失败不能用空内容覆盖原文件", async () => {
    local.readGlobalAgentsInstructions.mockRejectedValue(new Error("read failed"));
    render(createElement(PersonalizationSection));
    await waitFor(() =>
      expect(toast).toHaveBeenCalledWith("settings.customInstructionsLoadFailed"),
    );
    expect(textbox().disabled).toBe(true);
    fireEvent.click(save());
    expect(local.writeGlobalAgentsInstructions).not.toHaveBeenCalled();
  });

  it("保存失败保留草稿并允许重试", async () => {
    local.writeGlobalAgentsInstructions.mockRejectedValueOnce(new Error("write failed"));
    render(createElement(PersonalizationSection));
    await waitFor(() => expect(textbox().value).toBe("原有指令"));
    fireEvent.change(textbox(), { target: { value: "尚未保存" } });
    fireEvent.click(save());
    await waitFor(() =>
      expect(toast).toHaveBeenCalledWith("settings.customInstructionsSaveFailed"),
    );
    expect(textbox().value).toBe("尚未保存");
    expect(save().disabled).toBe(false);
    fireEvent.click(save());
    await waitFor(() => expect(toast).toHaveBeenCalledWith("settings.customInstructionsSaved"));
  });

  it("离开后重新进入重新读取，旧挂载的迟到结果不污染新草稿", async () => {
    let finishOldRead!: (content: string) => void;
    local.readGlobalAgentsInstructions.mockImplementationOnce(
      () =>
        new Promise<string>((resolve) => {
          finishOldRead = resolve;
        }),
    );
    const first = render(createElement(PersonalizationSection));
    first.unmount();
    local.readGlobalAgentsInstructions.mockResolvedValue("重新读取的内容");
    render(createElement(PersonalizationSection));
    await waitFor(() => expect(textbox().value).toBe("重新读取的内容"));
    await act(async () => finishOldRead("已卸载的旧内容"));
    expect(textbox().value).toBe("重新读取的内容");
    expect(local.readGlobalAgentsInstructions).toHaveBeenCalledTimes(2);
  });
});
