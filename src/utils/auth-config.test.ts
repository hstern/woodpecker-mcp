import { describe, expect, test } from "bun:test";
import { requireWoodpeckerAuth } from "./auth-config";

const TOKEN_REQUIRED_REGEX = /WOODPECKER_TOKEN is required/;

describe("requireWoodpeckerAuth", () => {
  test("accepts a token (stdio mode)", () => {
    expect(() => requireWoodpeckerAuth({ token: "secret" })).not.toThrow();
  });

  test("accepts LISTEN_ADDR without a token (HTTP mode)", () => {
    expect(() => requireWoodpeckerAuth({ listenAddr: ":8080" })).not.toThrow();
  });

  test("accepts both", () => {
    expect(() =>
      requireWoodpeckerAuth({ listenAddr: ":8080", token: "secret" })
    ).not.toThrow();
  });

  test("throws when neither is set", () => {
    expect(() => requireWoodpeckerAuth({})).toThrow(TOKEN_REQUIRED_REGEX);
  });
});
