import * as testing from "../testing.ts";
import { env } from "../../../dist/deno/mod.ts";

Deno.test("env.isEnvSet", () => {
  const tests: [string, boolean][] = [
    // var, expected
    ["ISAVAR", true],
    ["NOTAVAR", false],
  ];

  for (const [key, expected] of tests) {
    if (expected) {
      Deno.env.set(key, "true");
    }

    testing.assertEquals(env.isEnvSet(key), expected);

    if (expected) {
      Deno.env.delete(key);
    }
  }
});

Deno.test("env.getEnv", () => {
  const tests: [string, boolean, string | undefined, string][] = [
    // var, set, default, expected
    ["ISAVAR", true, undefined, "true"],
    ["NOTAVAR", false, undefined, ""],
    ["NOTAVAR", false, "nope", "nope"],
  ];

  for (const [key, set, defaultValue, expected] of tests) {
    if (set) {
      Deno.env.set(key, expected);
    }

    const got = env.getEnv(key, defaultValue);
    testing.assertEquals(got, expected);

    if (set) {
      Deno.env.delete(key);
    }
  }
});

Deno.test("env.setEnv", () => {
  const key = "NOT_SET";
  testing.assertEquals(env.isEnvSet(key), false);

  env.setEnv(key, "now it is");
  testing.assertEquals(env.getEnv(key), "now it is");

  Deno.env.delete(key);
});

Deno.test("env.setEnv", () => {
  const key = "NOT_SET";
  env.setEnv(key, "now it is");
  testing.assertEquals(env.getEnv(key), "now it is");

  env.unsetEnv(key);
  testing.assertEquals(env.isEnvSet(key), false);
});

Deno.test("env.requireKeys", () => {
  env.setEnv("STDLIB_TEST_ENV_FOO", "foo");
  env.setEnv("STDLIB_TEST_ENV_BAR", "bar");
  env.requireKeys("STDLIB_TEST_ENV_FOO", "STDLIB_TEST_ENV_BAR");
});

Deno.test("env.requireKeys: not set", () => {
  env.unsetEnv("STDLIB_TEST_ENV_FOO");
  env.unsetEnv("STDLIB_TEST_ENV_BAR");
  testing.assertPanics(() => {
    env.requireKeys("STDLIB_TEST_ENV_FOO", "STDLIB_TEST_ENV_BAR");
  }, "required env vars missing: STDLIB_TEST_ENV_FOO, STDLIB_TEST_ENV_BAR");
});
