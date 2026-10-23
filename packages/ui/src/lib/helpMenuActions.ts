import type { IPlatformService } from "@zcode/shared";
import type { IntlInstance } from "@/i18n/IntlProvider.js";
import { runExportLogsAction } from "@/lib/exportLogsAction.js";

export interface HelpMenuActionHandlers {
  exportLogs: () => void;
}

/**
 * 帮助菜单只保留本地工具动作：NCode 关闭了问题反馈、用户社群和产品文档跳转，
 * 因此这里不再构造对应 handler，避免留下可被误用的官方上报/跳转通路。
 */
export function createHelpMenuActionHandlers({
  platform,
  intl,
}: {
  platform: Pick<IPlatformService, "exportLogs">;
  intl: IntlInstance;
}): HelpMenuActionHandlers {
  return {
    exportLogs: () => {
      void runExportLogsAction(platform, intl);
    },
  };
}
