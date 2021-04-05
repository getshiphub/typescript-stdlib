import * as testing from "../testing.ts";
import { env } from "../../../dist/deno/mod.ts";

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

Deno.test("env.get", () => {
  const tests: [string, boolean, string | undefined, string][] = [
    // var, set, default, expected
    ["STDLIB_TEST_ISAVAR", true, undefined, "true"],
    ["STDLIB_TEST_NOTAVAR", false, undefined, ""],
    ["STDLIB_TEST_NOTAVAR", false, "nope", "nope"],
  ];

  for (const [key, set, defaultValue, expected] of tests) {
    if (set) {
      Deno.env.set(key, expected);
    }

    const got = env.get(key, defaultValue);
    testing.assertEquals(got, expected);

    if (set) {
      Deno.env.delete(key);
    }
  }
});

Deno.test("env.lookup", () => {
  const tests: ([string, true, string] | [string, false, undefined])[] = [
    // var, set, expected
    ["STDLIB_TEST_ISAVAR", true, "true"],
    ["STDLIB_TEST_NOTAVAR", false, undefined],
  ];

  for (const [key, set, expected] of tests) {
    if (set) {
      Deno.env.set(key, expected as string);
    }

    const got = env.lookup(key);
    testing.assertEquals(got, expected);

    if (set) {
      Deno.env.delete(key);
    }
  }
});

Deno.test("env.set", () => {
  const key = "STDLIB_TEST_NOT_SET";
  testing.assertEquals(env.lookup(key), undefined);

  env.set(key, "now it is");
  testing.assertEquals(env.lookup(key), "now it is");

  Deno.env.delete(key);
});

Deno.test("env.unset", () => {
  const key = "STDLIB_TEST_NOT_SET";
  env.set(key, "now it is");
  testing.assertEquals(env.lookup(key), "now it is");

  env.unset(key);
  testing.assertEquals(env.lookup(key), undefined);
});

Deno.test("env.getAll", () => {
  const expected = new Map(Object.entries(Deno.env.toObject()));
  testing.assertEquals(env.getAll(), expected);
});

Deno.test("env.requireKeys", () => {
  env.set("STDLIB_TEST_ENV_FOO", "foo");
  env.set("STDLIB_TEST_ENV_BAR", "bar");
  env.requireKeys("STDLIB_TEST_ENV_FOO", "STDLIB_TEST_ENV_BAR");
});

Deno.test("env.requireKeys: not set", () => {
  env.unset("STDLIB_TEST_ENV_FOO");
  env.unset("STDLIB_TEST_ENV_BAR");
  testing.assertPanics(() => {
    env.requireKeys("STDLIB_TEST_ENV_FOO", "STDLIB_TEST_ENV_BAR");
  }, "required env vars missing: STDLIB_TEST_ENV_FOO, STDLIB_TEST_ENV_BAR");
});

Deno.test("env.expand", () => {
  const tests: [string, string][] = [
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
  ];

  for (const [s, expected] of tests) {
    testing.assertEquals(env.expand(s, testGet), expected);
  }
});

Deno.test("env.stringify", () => {
  const m = new Map([
    ["foo", "bar"],
    ["baz", "123"],
    ["HOME", "/usr/root"],
    ["quoted", `va"lu"e`],
    ["escape", "\n\r\\r!$"],
  ]);
  const s = env.stringify(m);

  testing.assertEquals(
    s,
    `HOME=/usr/root
baz=123
escape="\\n\\r\\\\r\\!\\$"
foo=bar
quoted="va\\"lu\\"e"`,
  );
});
