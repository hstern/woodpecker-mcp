export type WoodpeckerAuthConfig = {
  listenAddr?: string;
  token?: string;
};

/**
 * Enforce the auth invariant shared by both transports:
 *
 *   - stdio (no LISTEN_ADDR): a fixed WOODPECKER_TOKEN is required.
 *   - HTTP (LISTEN_ADDR set): the token is read per request from the
 *     `Authorization: Bearer` header, so WOODPECKER_TOKEN is optional.
 *
 * Throws on the only invalid combination — neither set — so misconfiguration
 * fails fast at startup instead of on the first tool call.
 */
export const requireWoodpeckerAuth = (config: WoodpeckerAuthConfig): void => {
  if (config.listenAddr || config.token) {
    return;
  }

  throw new Error(
    "WOODPECKER_TOKEN is required unless LISTEN_ADDR is set. In HTTP mode (LISTEN_ADDR set) the Woodpecker token is read per request from the Authorization: Bearer header."
  );
};
