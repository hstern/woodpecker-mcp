import { createEnv } from "@t3-oss/env-core";
import { z } from "zod";
import { requireWoodpeckerAuth } from "@/utils/auth-config";

export const env = createEnv({
  server: {
    WOODPECKER_URL: z.string().url(),
    // Optional: required for stdio, but in HTTP mode (LISTEN_ADDR set) the
    // token comes per request from the Authorization: Bearer header.
    WOODPECKER_TOKEN: z.string().min(1).optional(),
    // When set (e.g. "0.0.0.0:8080" or ":8080") the server runs as a
    // Streamable HTTP endpoint instead of stdio.
    LISTEN_ADDR: z.string().min(1).optional(),
  },
  runtimeEnv: process.env,
});

requireWoodpeckerAuth({
  listenAddr: env.LISTEN_ADDR,
  token: env.WOODPECKER_TOKEN,
});
