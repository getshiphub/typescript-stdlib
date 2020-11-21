import * as testing from "../testing.ts";
import { log } from "../../../dist/deno/mod.ts";

Deno.test("log.levelString", () => {
  const tests: [log.Level, string][] = [
    [log.Level.debug, "debug"],
    [log.Level.info, "info"],
    [log.Level.warn, "warn"],
    [log.Level.error, "error"],
  ];

  for (const [level, expected] of tests) {
    testing.assertEquals(log.levelString(level), expected);
  }
});

Deno.test("log.levelString", () => {
  const tests: [string, log.Level][] = [
    ["debug", log.Level.debug],
    ["info", log.Level.info],
    ["warn", log.Level.warn],
    ["error", log.Level.error],
  ];

  for (const [str, expected] of tests) {
    testing.assertEquals(log.parseLevel(str).unwrap(), expected);
  }
});

Deno.test("log.parseLevel: invalid level", () => {
  const err = log.parseLevel("oops").unwrapFailure();
  testing.assertEquals(err.error(), "not a valid log level: oops");
});
