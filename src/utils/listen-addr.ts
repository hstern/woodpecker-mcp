const MAX_PORT = 65_535;

export type ListenAddr = {
  host?: string;
  port: number;
};

/**
 * Parse a LISTEN_ADDR value into a host/port pair for `http.Server.listen`.
 *
 * Accepts `host:port` (e.g. `0.0.0.0:8080`), `:port` (all interfaces), or a
 * bare `port`. A missing/empty host yields `undefined` so Node binds every
 * interface.
 */
export const parseListenAddr = (addr: string): ListenAddr => {
  const trimmed = addr.trim();
  const lastColon = trimmed.lastIndexOf(":");
  const portText = lastColon === -1 ? trimmed : trimmed.slice(lastColon + 1);
  const port = Number(portText);

  if (!Number.isInteger(port) || port <= 0 || port > MAX_PORT) {
    throw new Error(
      `Invalid LISTEN_ADDR "${addr}": expected "host:port", ":port", or "port" with a port in 1-${MAX_PORT}.`
    );
  }

  const host = lastColon > 0 ? trimmed.slice(0, lastColon) : undefined;
  return host ? { host, port } : { port };
};
