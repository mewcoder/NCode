/** 公开 RPC 接口与本地实现工厂；业务消费者不接触网络、缓存或 endpoint。 */
export { IClientConfigService } from "./clientConfig.js";
export { createClientConfigService } from "./clientConfigService.js";
