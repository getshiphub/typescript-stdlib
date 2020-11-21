import { log } from "../../../src";

describe("log/log.ts", () => {
  test.each([
    [log.Level.debug, "debug"],
    [log.Level.info, "info"],
    [log.Level.warn, "warn"],
    [log.Level.error, "error"],
  ])("log.levelString: %d, %s", (level, expected) => {
    expect(log.levelString(level)).toBe(expected);
  });

  test.each([
    ["debug", log.Level.debug],
    ["info", log.Level.info],
    ["warn", log.Level.warn],
    ["error", log.Level.error],
  ])("log.parseLevel: %s", (str, expectedLevel) => {
    expect(log.parseLevel(str).unwrap()).toBe(expectedLevel);
  });

  test("log.parseLevel: invalid level", () => {
    const err = log.parseLevel("oops").unwrapFailure();
    expect(err.error()).toBe("not a valid log level: oops");
  });
});
