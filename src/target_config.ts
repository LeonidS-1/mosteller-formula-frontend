type SharedEnv = Record<string, string | undefined>;

const DEFAULT_LAN_IP = "192.168.0.100";
const DEFAULT_API_PORT = "8080";
const DEFAULT_MEDIA_PORT = "9000";
const DEFAULT_MEDIA_BUCKET = "test";

function trimSlashes(value: string): string {
  return value.replace(/^\/+|\/+$/g, "");
}

function readBool(value: string | undefined, fallback: boolean): boolean {
  if (value == null) return fallback;
  return value === "true";
}

export function resolveTargetConfig(env: SharedEnv = {}) {
  const lanIp = env.VITE_LAN_IP || DEFAULT_LAN_IP;
  const apiPort = env.VITE_API_PORT || DEFAULT_API_PORT;
  const mediaPort = env.VITE_MEDIA_PORT || DEFAULT_MEDIA_PORT;
  const mediaBucket = trimSlashes(env.VITE_MEDIA_BUCKET || DEFAULT_MEDIA_BUCKET);
  const useDevProxy = readBool(env.VITE_USE_DEV_PROXY, true);

  const apiOrigin = `http://${lanIp}:${apiPort}`;
  const mediaOrigin = `http://${lanIp}:${mediaPort}`;
  const mediaBaseDirect = `${mediaOrigin}/${mediaBucket}`;

  return {
    lanIp,
    apiPort,
    mediaPort,
    mediaBucket,
    useDevProxy,
    apiOrigin,
    mediaOrigin,
    apiBaseUrl: useDevProxy ? "/api" : `${apiOrigin}/api`,
    mediaBaseUrl: useDevProxy ? `/minio/${mediaBucket}` : mediaBaseDirect,
    viteApiProxyTarget: apiOrigin,
    viteMediaProxyTarget: mediaOrigin,
  } as const;
}

const viteEnv = (import.meta as ImportMeta & { env?: SharedEnv }).env ?? {};

export const TARGET_CONFIG = resolveTargetConfig(viteEnv);
