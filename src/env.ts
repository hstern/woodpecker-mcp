import { createEnv } from "@t3-oss/env-core";
import { z } from "zod";

export const env = createEnv({
  server: {
    WOODPECKER_URL: z.string().url(),
    WOODPECKER_TOKEN: z.string().min(1),
  },
  runtimeEnv: process.env,
});
