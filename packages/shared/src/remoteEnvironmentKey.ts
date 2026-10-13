import { parseServerEndpointUrl, type RemoteTarget } from "./remoteTarget.js";
import { buildSshRemoteHostKey } from "./remoteSshHostKey.js";
import { resolveServerIdentityId } from "./remote-workspace-identity.js";

/**
 * Provider Provisioning 等 Environment 级状态的稳定身份；不得混用 workspace/session 身份。
 */
export function buildRemoteEnvironmentKey(target: RemoteTarget): string {
  switch (target.kind) {
    case "ssh":
      return `ssh:${buildSshRemoteHostKey(target)}`;
    case "wsl":
      return `wsl:${target.distro?.trim() || "<default>"}\0${target.user?.trim() || "<default>"}`;
    case "docker":
      return `docker:${target.container.trim()}`;
    case "server": {
      if (!parseServerEndpointUrl(target.url)) {
        throw new Error("Server URL must use HTTP(S) or WS(S) and must not contain userinfo.");
      }
      return `server:${target.serverId?.trim() || resolveServerIdentityId(target)}`;
    }
  }
}
