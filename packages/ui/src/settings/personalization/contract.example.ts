import type { GlobalAgentsInstructionsService } from "./contract.js";

/** UI 读写的端口由本机 Host 提供；不构造第二份文件服务。 */
export async function readGlobalInstructionsExample(service: GlobalAgentsInstructionsService) {
  const [path, content] = await Promise.all([
    service.getGlobalAgentsInstructionsPath(),
    service.readGlobalAgentsInstructions(),
  ]);
  return { path, content };
}
