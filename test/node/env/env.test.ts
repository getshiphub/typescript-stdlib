import { env } from "../../../src";

describe("env/env.ts", () => {
  test.each([
    // var, expected
    ["ISAVAR", true],
    ["NOTAVAR", false],
  ])("env.isEnvSet: %s, %s", (key, expected) => {
    if (expected) {
      process.env[key] = "true";
    }

    expect(env.isEnvSet(key)).toBe(expected);

    if (expected) {
      delete process.env[key];
    }
  });

  test.each([
    // var, set, default, expected
    ["ISAVAR", true, undefined, "true"],
    ["NOTAVAR", false, undefined, ""],
    ["NOTAVAR", false, "nope", "nope"],
  ])("env.getEnv: %#", (key, set, defaultValue, expected) => {
    if (set) {
      process.env[key] = expected;
    }

    const got = env.getEnv(key, defaultValue);
    expect(got).toBe(expected);

    if (set) {
      delete process.env[key];
    }
  });

  test("env.setEnv", () => {
    const key = "NOT_SET";
    expect(env.isEnvSet(key)).toBe(false);

    env.setEnv(key, "now it is");
    expect(env.getEnv(key)).toBe("now it is");

    delete process.env[key];
  });

  test("env.unsetEnv", () => {
    const key = "NOT_SET";
    env.setEnv(key, "now it is");
    expect(env.getEnv(key)).toBe("now it is");

    env.unsetEnv(key);
    expect(env.isEnvSet(key)).toBe(false);
  });
});
