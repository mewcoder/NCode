import type { ModelConnectivityResult } from "@zcode/shared";
import type { SavePersonalModelDraftInput } from "@zcode/provider";
import { useZCodeIntl } from "@/i18n/IntlProvider.js";
import {
  getProviderFormApiKeyManagementUrl,
  type ProviderSettingsFormProvider,
} from "@/lib/providerSettingsFormTypes.js";
import { ModelProviderLoadingCard } from "./StatusCards.js";
import { InlineEditableProviderCard } from "./InlineEditableProviderCard.js";
import type { ModelProviderNavItem } from "./constants.js";

/**
 * Provider 详情只负责通用配置编辑。
 *
 * 账号套餐的登录、购买、升级和解绑属于已移除的官方账号边界；API Key Provider
 * 仍然完整保留名称、Logo、Endpoint、Key、模型编辑和连通性测试。
 */
export function ModelProviderSectionDetail({
  selectedNavItem,
  presetLoading,
  onSave,
  onAddPersonalModel,
  onSavePersonalModelDraft,
  onSetPersonalModelEnabled,
  onDeletePersonalModel,
  onDelete,
  onReorderProviderModels,
  onTestModel,
  onOpenApiKeyUrl,
}: {
  selectedNavItem: ModelProviderNavItem | null;
  presetLoading: boolean;
  onSave: (config: ProviderSettingsFormProvider) => void | Promise<void>;
  onAddPersonalModel?: (
    providerId: string,
    modelId: string,
    config: ProviderSettingsFormProvider["models"][number]["personalConfig"],
    useRecommendedConfig?: boolean,
  ) => Promise<unknown>;
  onSavePersonalModelDraft?: (input: SavePersonalModelDraftInput) => Promise<unknown>;
  onSetPersonalModelEnabled?: (
    providerId: string,
    modelId: string,
    enabled: boolean,
  ) => Promise<unknown>;
  onDeletePersonalModel?: (providerId: string, modelId: string) => Promise<unknown>;
  onDelete: (provider: ProviderSettingsFormProvider) => Promise<void>;
  onReorderProviderModels?: (providerId: string, modelIds: string[]) => Promise<void>;
  onTestModel: (providerId: string, modelId: string) => Promise<ModelConnectivityResult>;
  onOpenApiKeyUrl: (url: string) => void;
}) {
  const { intl } = useZCodeIntl();

  if (presetLoading && !selectedNavItem) {
    return <ModelProviderLoadingCard loadingLabel={intl.formatMessage({ id: "common.loading" })} />;
  }

  if (!selectedNavItem || selectedNavItem.type !== "custom") {
    return (
      <div className="flex min-h-40 items-center justify-center rounded-xl border border-dashed border-border p-6 text-center text-ui-base text-foreground-subtle">
        {intl.formatMessage({ id: "settings.modelProvider.empty" })}
      </div>
    );
  }

  return renderProviderCard({
    provider: selectedNavItem.provider,
    onSave,
    onAddPersonalModel,
    onSavePersonalModelDraft,
    onSetPersonalModelEnabled,
    onDeletePersonalModel,
    onDelete,
    onReorderProviderModels,
    onTestModel,
    onOpenApiKeyUrl,
  });
}

function renderProviderCard({
  provider,
  onSave,
  onAddPersonalModel,
  onSavePersonalModelDraft,
  onSetPersonalModelEnabled,
  onDeletePersonalModel,
  onDelete,
  onReorderProviderModels,
  onTestModel,
  onOpenApiKeyUrl,
}: {
  provider: ProviderSettingsFormProvider;
  onSave: (config: ProviderSettingsFormProvider) => void | Promise<void>;
  onAddPersonalModel?: (
    providerId: string,
    modelId: string,
    config: ProviderSettingsFormProvider["models"][number]["personalConfig"],
    useRecommendedConfig?: boolean,
  ) => Promise<unknown>;
  onSavePersonalModelDraft?: (input: SavePersonalModelDraftInput) => Promise<unknown>;
  onSetPersonalModelEnabled?: (
    providerId: string,
    modelId: string,
    enabled: boolean,
  ) => Promise<unknown>;
  onDeletePersonalModel?: (providerId: string, modelId: string) => Promise<unknown>;
  onDelete: (provider: ProviderSettingsFormProvider) => Promise<void>;
  onReorderProviderModels?: (providerId: string, modelIds: string[]) => Promise<void>;
  onTestModel: (providerId: string, modelId: string) => Promise<ModelConnectivityResult>;
  onOpenApiKeyUrl: (url: string) => void;
}) {
  const apiKeyUrl = getProviderFormApiKeyManagementUrl(provider);
  return (
    <InlineEditableProviderCard
      provider={provider}
      onSave={onSave}
      onAddPersonalModel={onAddPersonalModel}
      onSavePersonalModelDraft={onSavePersonalModelDraft}
      onSetPersonalModelEnabled={onSetPersonalModelEnabled}
      onDeletePersonalModel={onDeletePersonalModel}
      onDelete={() => onDelete(provider)}
      onReorderModelIds={
        onReorderProviderModels
          ? (modelIds) => onReorderProviderModels(provider.providerId, modelIds)
          : undefined
      }
      onTestModel={onTestModel}
      presetApiKeyUrl={apiKeyUrl}
      onOpenPresetApiKey={apiKeyUrl ? () => onOpenApiKeyUrl(apiKeyUrl) : undefined}
      readOnlyEndpoints={false}
      nameEditable
    />
  );
}
