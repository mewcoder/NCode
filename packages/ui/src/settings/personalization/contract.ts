/** 复用本机 Host 的文件读写接口；写入返回时已完成持久化，不增加缓存或广播。 */
export interface GlobalAgentsInstructionsService {
  getGlobalAgentsInstructionsPath(): Promise<string>;
  readGlobalAgentsInstructions(): Promise<string>;
  writeGlobalAgentsInstructions(content: string): Promise<void>;
}
