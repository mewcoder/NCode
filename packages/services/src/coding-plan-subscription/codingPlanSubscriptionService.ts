import type { ApiClient } from "@zcode/shared";
import {
  createDynamicWorkflowClientConfig,
  DEFAULT_ZCODE_MODEL_CONTEXT_BUDGET_STRATEGY,
} from "@zcode/shared";
import type { ICredentialService } from "../credential/credential.js";
import type { ICodingPlanSubscriptionService } from "./codingPlanSubscription.js";
import type { ModelSelectionView } from "@zcode/provider";

interface CodingPlanSubscriptionServiceDependencies {
  apiClient: ApiClient;
  credentialService: Pick<ICredentialService, "load">;
  resolveOffPeakModelSelectionView?: () => Promise<ModelSelectionView>;
}

/**
 * 账号套餐、购买、额度灰度和闲时任务均不属于 API Key Provider 运行时。
 * 保留接口形状只是为了兼容旧 Renderer/远程 Host channel；所有需要账号或套餐的
 * 操作 fail-closed，绝不创建任何官方套餐 provider，也不发起远端请求。
 */
export function createDisabledCodingPlanSubscriptionService(): ICodingPlanSubscriptionService {
  const unavailable = () => Promise.reject(new Error("官方账号套餐已禁用，请配置 API Key"));
  return {
    batchPreview: unavailable,
    getStaticProducts: unavailable,
    getStaticTeamProducts: unavailable,
    getStartPlanPreview: async () => null,
    getOffPeakClientConfig: async () => ({
      enabled: false,
      modelSelectionView: { revision: 0, providers: [] },
    }),
    getDynamicWorkflowClientConfig: async () =>
      createDynamicWorkflowClientConfig("disabled", "default"),
    getModelContextBudgetStrategy: async () => DEFAULT_ZCODE_MODEL_CONTEXT_BUDGET_STRATEGY,
    getForceUpdateConfig: async () => null,
    productInfo: unavailable,
    preview: unavailable,
    createSign: unavailable,
    updateSign: unavailable,
    checkPayment: unavailable,
    checkPendingOrders: unavailable,
    queryStripeCards: unavailable,
    bindStripeCard: unavailable,
    unbindStripeCard: unavailable,
    payStripe: unavailable,
    checkPaypalSupport: unavailable,
    createPaypalSetupToken: unavailable,
    subscribePaypal: unavailable,
    getEnterprisePricing: unavailable,
    getEnterpriseBalance: unavailable,
    calculateEnterpriseOrder: unavailable,
    createEnterpriseOrder: unavailable,
    getEnterprisePendingOrders: unavailable,
    cancelEnterpriseOrder: unavailable,
    continueEnterpriseOrderPayment: unavailable,
    checkEnterpriseOrderStatus: unavailable,
  };
}

/**
 * 旧工厂名保留给兼容调用方；官方套餐购买 provider 已移除。
 * 动态工作流、强制更新和旧 channel 仍返回本地默认值，购买与账号操作全部 fail-closed。
 */
export function createCodingPlanSubscriptionService(
  _dependencies: CodingPlanSubscriptionServiceDependencies,
): ICodingPlanSubscriptionService {
  // 保留工厂名和接口形状，避免旧 Host/Renderer channel 失配；不再实例化任何官方套餐 Provider。
  return createDisabledCodingPlanSubscriptionService();
}
