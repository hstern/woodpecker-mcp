import { describe, expect, test } from "bun:test";
import { parseListenAddr } from "./listen-addr";

describe("parseListenAddr", () => {
  test("parses host:port", () => {
    expect(parseListenAddr("0.0.0.0:8080")).toEqual({
      host: "0.0.0.0",
      port: 8080,
    });
  });

  test("treats :port as all interfaces (no host)", () => {
    expect(parseListenAddr(":8080")).toEqual({ port: 8080 });
  });

  test("parses a bare port", () => {
    expect(parseListenAddr("8080")).toEqual({ port: 8080 });
  });

  test("trims surrounding whitespace", () => {
    expect(parseListenAddr("  127.0.0.1:9000  ")).toEqual({
      host: "127.0.0.1",
      port: 9000,
    });
  });

  test.each(["", "abc", "0.0.0.0:0", "host:70000", "host:-1", ":nope"])(
    "rejects %p",
    (addr) => {
      expect(() => parseListenAddr(addr)).toThrow();
    }
  );
});
