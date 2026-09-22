import { useCallback, useEffect, useMemo, useState } from "react";
import type { ModelConnectivityResult } from "@zcode/shared";
import { Button } from "@/components/ui/button.js";
import { useConfirmDialog } from "@/hooks/useConfirmDialog.js";
import { useModelProviders } from "@/hooks/useModelProviders.js";
import { usePlatform } from "@/hooks/usePlatform.js";
import { useZCodeIntl } from "@/i18n/IntlProvider.js";
import { logger } from "@/logger.js";
import {
  addPendingSettingsSectionListener,
  consumePendingSettingsModelProviderTarget,
  type SettingsModelProviderTarget,
} from "@/lib/settingsNavigation.js";
import { sortModelProvidersForDisplay } from "@/lib/modelProviderOrdering.js";
import type { ProviderSettingsFormProvider } from "@/lib/providerSettingsFormTypes.js";
import {
  confirmAndDeleteModelProvider,
  refreshModelProviderSection,
} from "./model-provider-section/modelProviderActions.js";
import {
  createCustomProviderNodeKey,
  fuzzyMatch,
  handleEndpointSuggestionPopoverOpenAutoFocus,
  resolveEndpointSuggestionOpenRequest,
} from "./model-provider-section/utils.js";
import { ModelProviderSectionDetail } from "./model-provider-section/Detail.js";
import { ModelProviderSectionLayout } from "./model-provider-section/SectionLayout.js";
import { ProviderTemplatePicker } from "./model-provider-section/ProviderTemplatePicker.js";
import type {
  ModelProviderNavGroup,
  ModelProviderNavItem,
} from "./model-provider-section/constants.js";

export {
  fuzzyMatch,
  handleEndpointSuggestionPopoverOpenAutoFocus,
  resolveEndpointSuggestionOpenRequest,
} from "./model-provider-section/utils.js";

/**
 * 模型供应商设置只保留通用 Provider 配置。
 *
 * 账号/OAuth/官方套餐入口已经从 UI 和服务依赖中移除；Provider Registry 仍负责提供
 * API Key 与自定义供应商的名称、Logo、模型和执行状态，所以这里不复制或重写这些事实。
 */
export function ModelProviderSection({
  workspacePath = "",
  connectivityWorkspacePath,
  connectivityWorkspaceRequired = false,
  pendingModelProviderTarget,
  onConsumePendingModelProviderTarget,
}: {
  workspacePath?: string;
  connectivityWorkspacePath?: string;
  connectivityWorkspaceRequired?: boolean;
  pendingModelProviderTarget?: SettingsModelProviderTarget;
  onConsumePendingModelProviderTarget?: () => void;
} = {}) {
  const { intl, locale } = useZCodeIntl();
  const confirmDialog = useConfirmDialog();
  const platform = usePlatform();
  const {
    modelProviders,
    providerTemplates,
    displayOrder,
    loading,
    loadError,
    reload,
    refreshing,
    refresh,
    saveProvider,
    createPersonalProvider,
    addPersonalModel,
    savePersonalModelDraft,
    setPersonalModelEnabled,
    deletePersonalModel,
    deleteProvider,
    reorderProviderModels,
    saveDisplayOrder,
    reorderableProviderIds,
    testModelConnectivity,
  } = useModelProviders({
    workspacePath,
    connectivityWorkspacePath,
    connectivityWorkspaceRequired,
    connectivityUnavailableMessage: intl.formatMessage({
      id: "settings.modelProvider.testModel.localWorkspaceUnavailable",
    }),
  });

  const [initialTarget] = useState(() => consumePendingSettingsModelProviderTarget());
  const [pendingCreatedProviderId, setPendingCreatedProviderId] = useState<string | null>(null);
  const [selectedNodeKey, setSelectedNodeKey] = useState<string | null>(() =>
    initialTarget?.providerId ? createCustomProviderNodeKey(initialTarget.providerId) : null,
  );
  const [invalidProviderTarget, setInvalidProviderTarget] = useState(false);
  const [templatePickerOpen, setTemplatePickerOpen] = useState(false);
  const [creatingProvider, setCreatingProvider] = useState(false);

  const visibleProviders = useMemo(
    () => sortModelProvidersForDisplay(modelProviders, displayOrder),
    [displayOrder, modelProviders],
  );
  const navigationGroups = useMemo<ModelProviderNavGroup[]>(
    () => [
      {
        id: "custom",
        title: intl.formatMessage({ id: "settings.modelProvider.customTitle" }),
        items: visibleProviders.map(
          (provider): ModelProviderNavItem => ({
            key: createCustomProviderNodeKey(provider.providerId),
            type: "custom",
            label: provider.providerName?.trim() || provider.providerId,
            provider,
          }),
        ),
      },
    ],
    [intl, visibleProviders],
  );
  const navigationItems = navigationGroups.flatMap((group) => group.items);
  const selectedNavItem =
    navigationItems.find((item) => item.key === selectedNodeKey) ?? navigationItems[0] ?? null;

  useEffect(() => {
    if (
      pendingCreatedProviderId &&
      visibleProviders.some((provider) => provider.providerId === pendingCreatedProviderId)
    ) {
      setSelectedNodeKey(createCustomProviderNodeKey(pendingCreatedProviderId));
      setPendingCreatedProviderId(null);
    }
  }, [pendingCreatedProviderId, visibleProviders]);

  useEffect(() => {
    if (selectedNodeKey && navigationItems.some((item) => item.key === selectedNodeKey)) {
      return;
    }
    if (navigationItems.length > 0) {
      setSelectedNodeKey(navigationItems[0]!.key);
    } else if (!loading) {
      setSelectedNodeKey(null);
    }
  }, [loading, navigationItems, selectedNodeKey]);

  const applyProviderTarget = useCallback(
    (target: SettingsModelProviderTarget | undefined) => {
      const providerId = target?.providerId.trim();
      if (!providerId) return false;
      const exists = visibleProviders.some((provider) => provider.providerId === providerId);
      if (!exists) {
        if (!loading) {
          logger.warn("[ModelProviderSection] 无法打开目标供应商", { providerId });
          setInvalidProviderTarget(true);
        }
        return false;
      }
      setInvalidProviderTarget(false);
      setTemplatePickerOpen(false);
      setSelectedNodeKey(createCustomProviderNodeKey(providerId));
      return true;
    },
    [loading, visibleProviders],
  );

  useEffect(() => {
    if (applyProviderTarget(initialTarget ?? pendingModelProviderTarget)) {
      onConsumePendingModelProviderTarget?.();
    }
  }, [
    applyProviderTarget,
    initialTarget,
    onConsumePendingModelProviderTarget,
    pendingModelProviderTarget,
  ]);

  useEffect(
    () =>
      addPendingSettingsSectionListener((section, detail) => {
        if (section !== "modelProvider") return;
        if (
          applyProviderTarget(
            detail?.modelProviderId ? { providerId: detail.modelProviderId } : undefined,
          )
        ) {
          onConsumePendingModelProviderTarget?.();
        }
      }),
    [applyProviderTarget, onConsumePendingModelProviderTarget],
  );

  const handleSave = useCallback(
    async (provider: ProviderSettingsFormProvider) => {
      try {
        await saveProvider(provider);
      } catch (error) {
        logger.error("[ModelProviderSection] 保存模型供应商失败", error);
        throw error;
      }
    },
    [saveProvider],
  );

  const handleDelete = useCallback(
    (provider: ProviderSettingsFormProvider) =>
      confirmAndDeleteModelProvider({
        provider,
        confirmDialog,
        intl,
        deleteProvider,
      }),
    [confirmDialog, deleteProvider, intl],
  );

  const handleCreateProvider = useCallback(
    async (input: { templateId?: string; providerName?: string }) => {
      setCreatingProvider(true);
      try {
        const created = await createPersonalProvider({ ...input, locale });
        setPendingCreatedProviderId(created.providerId);
        setSelectedNodeKey(createCustomProviderNodeKey(created.providerId));
        setTemplatePickerOpen(false);
      } catch (error) {
        setPendingCreatedProviderId(null);
        throw error;
      } finally {
        setCreatingProvider(false);
      }
    },
    [createPersonalProvider, locale],
  );

  const handleReorderProviderIds = useCallback(
    async (providerIds: string[]) => {
      await saveDisplayOrder({ providerIds });
    },
    [saveDisplayOrder],
  );

  const handleTestModel = useCallback(
    (providerId: string, modelId: string): Promise<ModelConnectivityResult> =>
      testModelConnectivity(providerId, modelId),
    [testModelConnectivity],
  );

  if (loadError) {
    return (
      <div className="flex min-h-64 flex-col items-center justify-center gap-3 text-ui-base">
        <p className="text-destructive">{loadError.message}</p>
        <Button type="button" variant="outline" onClick={reload}>
          {intl.formatMessage({ id: "common.retry" })}
        </Button>
      </div>
    );
  }

  return (
    <ModelProviderSectionLayout
      description={intl.formatMessage({ id: "settings.modelProviderDescription" })}
      refreshLabel={intl.formatMessage({ id: "settings.modelProvider.refresh" })}
      loadingLabel={intl.formatMessage({ id: "common.loading" })}
      loading={loading || refreshing}
      onRefresh={() => {
        void refreshModelProviderSection({ refresh });
      }}
      addProviderLabel={intl.formatMessage({ id: "settings.modelProvider.addProviderAction" })}
      onAddProvider={() => setTemplatePickerOpen(true)}
      navigationGroups={navigationGroups}
      selectedNodeKey={selectedNavItem?.key ?? selectedNodeKey}
      onSelectNavItem={(item) => {
        setInvalidProviderTarget(false);
        setTemplatePickerOpen(false);
        setSelectedNodeKey(item.key);
      }}
      onReorderProviderIds={handleReorderProviderIds}
      reorderableProviderIds={reorderableProviderIds}
    >
      {invalidProviderTarget && !templatePickerOpen ? (
        <p role="alert" className="mb-3 text-ui-base text-destructive">
          {intl.formatMessage({ id: "settings.modelProvider.navigationUnavailable" })}
        </p>
      ) : null}
      {templatePickerOpen ? (
        <ProviderTemplatePicker
          templates={providerTemplates}
          creating={creatingProvider}
          onBack={() => setTemplatePickerOpen(false)}
          onCreateFromTemplate={(templateId) => handleCreateProvider({ templateId })}
          onCreateCustom={(label) => handleCreateProvider({ providerName: label })}
        />
      ) : (
        <ModelProviderSectionDetail
          selectedNavItem={selectedNavItem}
          loading={loading || refreshing}
          onSave={handleSave}
          onAddPersonalModel={addPersonalModel}
          onSavePersonalModelDraft={savePersonalModelDraft}
          onSetPersonalModelEnabled={setPersonalModelEnabled}
          onDeletePersonalModel={deletePersonalModel}
          onDelete={handleDelete}
          onReorderProviderModels={reorderProviderModels}
          onTestModel={handleTestModel}
          onOpenApiKeyUrl={(url) => platform.openExternal(url)}
        />
      )}
    </ModelProviderSectionLayout>
  );
}
