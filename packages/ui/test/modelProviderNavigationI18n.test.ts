import { afterEach, describe, expect, it, vi } from "vitest";
import type { ProviderSettingsFormProvider } from "@/lib/providerSettingsFormTypes.js";

function createCustomProvider(): ProviderSettingsFormProvider {
  return {
    providerId: "custom-provider",
    executable: true,
    enabled: true,
    hasPersonalConfig: true,
    personalConfig: { group: "standard-personal", personalModelIds: ["glm-5"] },
    config: {
      label: "Custom Provider",
      group: "standard-personal",
      access: { type: "api-key", apiKey: "sk-demo" },
      api: { type: "openai-chat-completions", baseUrl: "https://example.com/v1" },
      personalModelIds: ["glm-5"],
    },
    models: [{ modelId: "glm-5", config: {}, hasPersonalConfig: true }],
  };
}

function createIntl(messages: Record<string, string>) {
  return {
    formatMessage: ({ id }: { id: string }) => messages[id] ?? id,
  };
}

describe("model provider navigation i18n", () => {
  afterEach(() => {
    vi.doUnmock("react");
    vi.resetModules();
  });

  it("语言切换时刷新自定义供应商分组标题，添加入口不再混入导航", async () => {
    type MemoState = {
      deps: readonly unknown[] | undefined;
      value: unknown;
    };
    const memoStates: MemoState[] = [];
    let hookIndex = 0;
    const renderStart = () => {
      hookIndex = 0;
    };

    vi.resetModules();
    vi.doMock("react", async (importOriginal) => {
      const actual = await importOriginal<typeof import("react")>();
      return {
        ...actual,
        useEffect: vi.fn(),
        useMemo: vi.fn((factory: () => unknown, deps?: readonly unknown[]) => {
          const index = hookIndex;
          hookIndex += 1;
          const previous = memoStates[index];
          const unchanged =
            previous?.deps &&
            deps &&
            previous.deps.length === deps.length &&
            previous.deps.every((dependency, dependencyIndex) =>
              Object.is(dependency, deps[dependencyIndex]),
            );
          if (unchanged) {
            return previous.value;
          }
          const value = factory();
          memoStates[index] = { deps, value };
          return value;
        }),
      };
    });

    const { useModelProviderNavigation } =
      await import("@/settings/model-provider-section/useModelProviderNavigation.js");
    const provider = createCustomProvider();
    const codingPlanEntitlements = {};
    const commonOptions = {
      presetProviders: [],
      modelProviders: [provider],
      codingPlanEntitlements,
      selectedNodeKey: null,
      setSelectedNodeKey: vi.fn(),
    };

    renderStart();
    const zhResult = useModelProviderNavigation({
      ...commonOptions,
      intl: createIntl({
        "settings.modelProvider.customTitle": "自定义供应商",
        "settings.modelProvider.createCustomProvider": "创建自定义供应商",
      }),
    });

    renderStart();
    const enResult = useModelProviderNavigation({
      ...commonOptions,
      intl: createIntl({
        "settings.modelProvider.customTitle": "Custom Providers",
        "settings.modelProvider.createCustomProvider": "Create Custom Provider",
      }),
    });

    expect(zhResult.navigationGroups.find((group) => group.id === "custom")?.title).toBe(
      "自定义供应商",
    );
    const enCustomGroup = enResult.navigationGroups.find((group) => group.id === "custom");
    expect(enCustomGroup?.title).toBe("Custom Providers");
    expect(enCustomGroup?.items).toHaveLength(1);
    expect(enCustomGroup?.items[0]?.type).toBe("custom");
    expect(
      enResult.navigationGroups.flatMap((group) => group.items).map((item) => item.type),
    ).toEqual(["custom"]);
  });
  it.each([false, true])(
    "历史套餐选中项回落到可见供应商或空选中（有供应商=%s）",
    async (hasProvider) => {
      vi.resetModules();
      vi.doMock("react", async (importOriginal) => {
        const actual = await importOriginal<typeof import("react")>();
        return {
          ...actual,
          useMemo: (factory: () => unknown) => factory(),
          useEffect: (effect: () => void) => effect(),
        };
      });
      const { useModelProviderNavigation } =
        await import("@/settings/model-provider-section/useModelProviderNavigation.js");
      const setSelectedNodeKey = vi.fn();
      useModelProviderNavigation({
        presetProviders: [],
        modelProviders: hasProvider ? [createCustomProvider()] : [],
        selectedNodeKey: "preset:account:zai-start-plan",
        setSelectedNodeKey,
        intl: createIntl({}),
      });
      expect(setSelectedNodeKey).toHaveBeenCalledWith(
        hasProvider ? "custom:custom-provider" : null,
      );
    },
  );
  it.each(
    ([null, "bigmodel", "zai"] as const).flatMap((providerFamilyDomain) =>
      [false, true].flatMap((modelProvidersLoading) =>
        [false, true].map((entitled) => ({
          providerFamilyDomain,
          modelProvidersLoading,
          entitled,
        })),
      ),
    ),
  )(
    "NCode 仅展示 API Key 导航（$providerFamilyDomain / loading=$modelProvidersLoading / entitled=$entitled）",
    async ({ providerFamilyDomain, modelProvidersLoading, entitled }) => {
      vi.resetModules();
      vi.doMock("react", async (importOriginal) => {
        const actual = await importOriginal<typeof import("react")>();
        return { ...actual, useMemo: (factory: () => unknown) => factory(), useEffect: vi.fn() };
      });
      const { BUILTIN_MODEL_PROVIDER_IDS } = await import("@zcode/shared");
      const { useModelProviderNavigation } =
        await import("@/settings/model-provider-section/useModelProviderNavigation.js");
      const result = useModelProviderNavigation({
        presetProviders: [
          { id: BUILTIN_MODEL_PROVIDER_IDS.zaiStartPlan, displayName: "Z.ai", provider: null },
          {
            id: BUILTIN_MODEL_PROVIDER_IDS.bigmodelStartPlan,
            displayName: "BigModel",
            provider: null,
          },
        ],
        modelProviders: [createCustomProvider()],
        providerFamilyDomain,
        entitledAccountProviderIds: entitled
          ? new Set([
              BUILTIN_MODEL_PROVIDER_IDS.zaiIndividualCodingPlan,
              BUILTIN_MODEL_PROVIDER_IDS.bigmodelTeamCodingPlan,
            ])
          : new Set(),
        modelProvidersLoading,
        selectedNodeKey: "preset:account:zai-start-plan",
        setSelectedNodeKey: vi.fn(),
        intl: createIntl({}),
      });
      expect(result.navigationGroups.map((group) => group.id)).toEqual(["custom"]);
      expect(result.navigationItems.map((item) => item.type)).toEqual(["custom"]);
      expect(result.selectedNavItem).toBeNull();
    },
  );
});
