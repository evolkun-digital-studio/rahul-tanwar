import { describe, expect, it } from "vitest";
import { ConfigError, getAuthConfig } from "./env";

const good = {
  JWT_SECRET: "a-real-random-secret-value-1234",
  ADMIN_EMAIL: "admin@example.com",
  ADMIN_PASSWORD: "a-real-strong-password",
};
const env = (overrides: Record<string, string>) =>
  ({ ...good, ...overrides }) as unknown as NodeJS.ProcessEnv;

describe("getAuthConfig", () => {
  it("accepts real values in production", () => {
    expect(getAuthConfig(env({ NODE_ENV: "production" })).adminEmail).toBe("admin@example.com");
  });
  it("rejects missing variables", () => {
    expect(() => getAuthConfig({ JWT_SECRET: "x" } as unknown as NodeJS.ProcessEnv)).toThrow(
      ConfigError,
    );
  });
  it("rejects a short JWT_SECRET in production", () => {
    expect(() => getAuthConfig(env({ NODE_ENV: "production", JWT_SECRET: "short" }))).toThrow(
      /at least 16/,
    );
  });
  it("rejects the .env.example placeholder JWT_SECRET in production", () => {
    expect(() =>
      getAuthConfig(
        env({
          NODE_ENV: "production",
          JWT_SECRET: "replace-with-a-long-random-secret-at-least-16-chars",
        }),
      ),
    ).toThrow(/placeholder/);
  });
  it("rejects the .env.example placeholder ADMIN_PASSWORD in production", () => {
    expect(() =>
      getAuthConfig(
        env({ NODE_ENV: "production", ADMIN_PASSWORD: "replace-with-a-strong-password" }),
      ),
    ).toThrow(ConfigError);
  });
  it("still allows placeholder values outside production", () => {
    expect(() => getAuthConfig(env({ JWT_SECRET: "replace-with-test-secret-1234" }))).not.toThrow();
  });
});
