import { bytes, log } from "../../../src";

describe("log/logger.ts", () => {
  test("logger.isLevelEnabled: true", () => {
    const logger = new log.StandardLogger({
      level: log.Level.info,
    });
    expect(logger.isLevelEnabled(log.Level.info)).toBe(true);
    expect(logger.isLevelEnabled(log.Level.error)).toBe(true);
  });

  test("logger.isLevelEnabled: false", () => {
    const logger = new log.StandardLogger({
      level: log.Level.warn,
    });
    expect(logger.isLevelEnabled(log.Level.debug)).toBe(false);
    expect(logger.isLevelEnabled(log.Level.info)).toBe(false);
  });

  test("logger.debug", () => {
    const b = new bytes.DynamicBuffer();
    const logger = new log.StandardLogger({
      out: b,
      formatter: new log.TextFormatter({ disableTimestamp: true }),
      level: log.Level.debug,
    });
    logger.debug("log message");

    expect(b.toString()).toBe(`level=debug msg="log message"\n`);
  });

  test("logger.info", () => {
    const b = new bytes.DynamicBuffer();
    const logger = new log.StandardLogger({
      out: b,
      formatter: new log.TextFormatter({ disableTimestamp: true }),
      level: log.Level.info,
    });
    logger.info("log message");

    expect(b.toString()).toBe(`level=info msg="log message"\n`);
  });

  test("logger.warn", () => {
    const b = new bytes.DynamicBuffer();
    const logger = new log.StandardLogger({
      out: b,
      formatter: new log.TextFormatter({ disableTimestamp: true }),
      level: log.Level.warn,
    });
    logger.warn("log message");

    expect(b.toString()).toBe(`level=warn msg="log message"\n`);
  });

  test("logger.error", () => {
    const b = new bytes.DynamicBuffer();
    const logger = new log.StandardLogger({
      out: b,
      formatter: new log.TextFormatter({ disableTimestamp: true }),
      level: log.Level.error,
    });
    logger.error("log message");

    expect(b.toString()).toBe(`level=error msg="log message"\n`);
  });

  test("no log", () => {
    const b = new bytes.DynamicBuffer();
    const logger = new log.StandardLogger({
      out: b,
      formatter: new log.TextFormatter({ disableTimestamp: true }),
      level: log.Level.info,
    });
    logger.debug("log message");

    expect(b.toString()).toBe("");
  });

  test("log with fields", () => {
    const b = new bytes.DynamicBuffer();
    const logger = new log.StandardLogger({
      out: b,
      formatter: new log.TextFormatter({ disableTimestamp: true }),
      level: log.Level.info,
    });
    logger.info("log message", { foo: "bar", baz: 1 });

    expect(b.toString()).toBe(`level=info msg="log message" baz=1 foo=bar\n`);
  });

  test("logger.addFields", () => {
    const b = new bytes.DynamicBuffer();
    const logger = new log.StandardLogger({
      out: b,
      formatter: new log.TextFormatter({ disableTimestamp: true }),
      level: log.Level.info,
    });
    logger.addFields({ foo: "bar", baz: 1 });
    logger.info("log message");

    expect(b.toString()).toBe(`level=info msg="log message" baz=1 foo=bar\n`);
  });

  test("overwrite global field with local field", () => {
    const b = new bytes.DynamicBuffer();
    const logger = new log.StandardLogger({
      out: b,
      formatter: new log.TextFormatter({ disableTimestamp: true }),
      level: log.Level.info,
    });
    logger.addFields({ foo: "bar", baz: 1 });
    logger.info("log message", { baz: "foo" });

    expect(b.toString()).toBe(`level=info msg="log message" baz=foo foo=bar\n`);
  });
});
