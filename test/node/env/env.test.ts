/* eslint-disable no-template-curly-in-string */

import { env } from "../../../src";

// A controlled set of variables for testing expand.
function testGet(s: string): string {
  switch (s) {
    case "*":
      return "all the args";
    case "#":
      return "NARGS";
    case "$":
      return "PID";
    case "1":
      return "ARGUMENT1";
    case "HOME":
      return "/usr/root";
    case "H":
      return "(Value of H)";
    case "home_1":
      return "/usr/foo";
    case "_":
      return "underscore";
    default:
      return "";
  }
}

describe("env/env.ts", () => {
  test.each([
    // var, set, default, expected
    ["STDLIB_TEST_ISAVAR", true, undefined, "true"],
    ["STDLIB_TEST_NOTAVAR", false, undefined, ""],
    ["STDLIB_TEST_NOTAVAR", false, "nope", "nope"],
  ])("env.get: %#", (key, set, defaultValue, expected) => {
    if (set) {
      process.env[key] = expected;
    }

    const got = env.get(key, defaultValue);
    expect(got).toBe(expected);

    if (set) {
      delete process.env[key];
    }
  });

  test.each([
    // var, set, expected
    ["STDLIB_TEST_ISAVAR", true, "true"],
    ["STDLIB_TEST_NOTAVAR", false, undefined],
  ])("env.lookup: %#", (key, set, expected) => {
    if (set) {
      process.env[key] = expected;
    }

    const got = env.lookup(key);
    expect(got).toBe(expected);

    if (set) {
      delete process.env[key];
    }
  });

  test("env.set", () => {
    const key = "STDLIB_TEST_NOT_SET";
    expect(env.lookup(key)).toBeUndefined();

    env.set(key, "now it is");
    expect(env.lookup(key)).toBe("now it is");

    delete process.env[key];
  });

  test("env.unset", () => {
    const key = "STDLIB_TEST_NOT_SET";
    env.set(key, "now it is");
    expect(env.lookup(key)).toBe("now it is");

    env.unset(key);
    expect(env.lookup(key)).toBeUndefined();
  });

  test("env.getAll", () => {
    const expected = new Map(Object.entries(process.env));
    expect(env.getAll()).toEqual(expected);
  });

  test("env.requireKeys", () => {
    env.set("STDLIB_TEST_ENV_FOO", "foo");
    env.set("STDLIB_TEST_ENV_BAR", "bar");
    env.requireKeys("STDLIB_TEST_ENV_FOO", "STDLIB_TEST_ENV_BAR");
  });

  test("env.requireKeys: not set", () => {
    env.unset("STDLIB_TEST_ENV_FOO");
    env.unset("STDLIB_TEST_ENV_BAR");
    expect(() => {
      env.requireKeys("STDLIB_TEST_ENV_FOO", "STDLIB_TEST_ENV_BAR");
    }).toPanic("required env vars missing: STDLIB_TEST_ENV_FOO, STDLIB_TEST_ENV_BAR");
  });

  test.each([
    ["", ""],
    ["$*", "all the args"],
    ["$$", "PID"],
    ["${*}", "all the args"],
    ["$1", "ARGUMENT1"],
    ["${1}", "ARGUMENT1"],
    ["now is the time", "now is the time"],
    ["$HOME", "/usr/root"],
    ["$home_1", "/usr/foo"],
    ["${HOME}", "/usr/root"],
    ["${H}OME", "(Value of H)OME"],
    ["A$$$#$1$H$home_1*B", "APIDNARGSARGUMENT1(Value of H)/usr/foo*B"],
    ["start$+middle$^end$", "start$+middle$^end$"],
    ["mixed$|bag$$$", "mixed$|bagPID$"],
    ["$", "$"],
    ["$}", "$}"],
    ["${", ""], // invalid syntax; eat up the characters
    ["${}", ""], // invalid syntax; eat up the characters
  ])("env.expand: %s", (s, expected) => {
    expect(env.expand(s, testGet)).toBe(expected);
  });

  test("env.stringify", () => {
    const m = new Map([
      ["foo", "bar"],
      ["baz", "123"],
      ["HOME", "/usr/root"],
      ["quoted", `va"lu"e`],
      ["escape", "\n\r\\r!$"],
    ]);
    const s = env.stringify(m);

    expect(s).toBe(`HOME=/usr/root
baz=123
escape="\\n\\r\\\\r\\!\\$"
foo=bar
quoted="va\\"lu\\"e"`);
  });
});
