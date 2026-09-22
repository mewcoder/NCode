import type {
  OffPeakCodingPlanSupport,
  OffPeakTaskCreateResult,
  OffPeakTakeNumberAvailability,
  ZCodeOffPeakTask,
  ZCodeOffPeakTaskCreateParams,
} from "@zcode/shared";
import type { IOffPeakTaskService, OffPeakUpdateTaskParams } from "./offPeakTask.js";

/**
 * 去官方化后的兼容服务：保留 RPC/service descriptor，避免旧客户端和历史数据失效，
 * 但不打开闲时任务数据库、网络客户端、票据轮询或调度器。
 */
export function createDisabledOffPeakTaskService(): IOffPeakTaskService {
  const unavailable: OffPeakCodingPlanSupport = {
    supported: false,
    reason: "connection_unavailable",
  };
  const unavailableForTakeNumber: OffPeakTakeNumberAvailability = {
    canTakeNumber: false,
  };
  const disabledResult = (providerName = ""): OffPeakTaskCreateResult => ({
    ok: false,
    failureStage: "ticket_request",
    errorCategory: "network",
    errorCode: "disabled",
    providerName,
  });

  return {
    async getCodingPlanSupport() {
      return unavailable;
    },
    async getTakeNumberAvailability() {
      return unavailableForTakeNumber;
    },
    async createTask(_params: ZCodeOffPeakTaskCreateParams) {
      return disabledResult();
    },
    async cancelTask(_offPeakTaskId: string): Promise<ZCodeOffPeakTask | null> {
      return null;
    },
    async pauseTask(_offPeakTaskId: string): Promise<ZCodeOffPeakTask | null> {
      return null;
    },
    async continueTask(_offPeakTaskId: string): Promise<ZCodeOffPeakTask | null> {
      return null;
    },
    async deleteTask(_offPeakTaskId: string): Promise<void> {
      // 历史任务表只保留兼容数据，不再由本地运行时修改。
    },
    async deleteHistory(_offPeakTaskId: string): Promise<ZCodeOffPeakTask | null> {
      return null;
    },
    async updateTask(
      _offPeakTaskId: string,
      _params: OffPeakUpdateTaskParams,
    ): Promise<ZCodeOffPeakTask | null> {
      return null;
    },
    async list(): Promise<ZCodeOffPeakTask[]> {
      return [];
    },
    async get(_offPeakTaskId: string): Promise<ZCodeOffPeakTask | null> {
      return null;
    },
  };
}
