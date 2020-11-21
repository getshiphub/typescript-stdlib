import * as testing from "../testing.ts";
import { bytes, log } from "../../../dist/deno/mod.ts";

Deno.test("logger.isLevelEnabled: true", () => {
  const logger = new log.StandardLogger({
    level: log.Level.info,
  });
  testing.assertEquals(logger.isLevelEnabled(log.Level.info), true);
  testing.assertEquals(logger.isLevelEnabled(log.Level.error), true);
});

Deno.test("logger.isLevelEnabled: false", () => {
  const logger = new log.StandardLogger({
    level: log.Level.warn,
  });
  testing.assertEquals(logger.isLevelEnabled(log.Level.debug), false);
  testing.assertEquals(logger.isLevelEnabled(log.Level.info), false);
});

Deno.test("logger.debug", () => {
  const b = new bytes.DynamicBuffer();
  const logger = new log.StandardLogger({
    out: b,
    formatter: new log.TextFormatter({ disableTimestamp: true }),
    level: log.Level.debug,
  });
  logger.debug("log message");

  testing.assertEquals(b.toString(), `level=debug msg="log message"\n`);
});

Deno.test("logger.info", () => {
  const b = new bytes.DynamicBuffer();
  const logger = new log.StandardLogger({
    out: b,
    formatter: new log.TextFormatter({ disableTimestamp: true }),
    level: log.Level.info,
  });
  logger.info("log message");

  testing.assertEquals(b.toString(), `level=info msg="log message"\n`);
});

Deno.test("logger.warn", () => {
  const b = new bytes.DynamicBuffer();
  const logger = new log.StandardLogger({
    out: b,
    formatter: new log.TextFormatter({ disableTimestamp: true }),
    level: log.Level.warn,
  });
  logger.warn("log message");

  testing.assertEquals(b.toString(), `level=warn msg="log message"\n`);
});

Deno.test("logger.error", () => {
  const b = new bytes.DynamicBuffer();
  const logger = new log.StandardLogger({
    out: b,
    formatter: new log.TextFormatter({ disableTimestamp: true }),
    level: log.Level.error,
  });
  logger.error("log message");

  testing.assertEquals(b.toString(), `level=error msg="log message"\n`);
});

Deno.test("no log", () => {
  const b = new bytes.DynamicBuffer();
  const logger = new log.StandardLogger({
    out: b,
    formatter: new log.TextFormatter({ disableTimestamp: true }),
    level: log.Level.info,
  });
  logger.debug("log message");

  testing.assertEquals(b.toString(), "");
});

Deno.test("log with fields", () => {
  const b = new bytes.DynamicBuffer();
  const logger = new log.StandardLogger({
    out: b,
    formatter: new log.TextFormatter({ disableTimestamp: true }),
    level: log.Level.info,
  });
  logger.info("log message", { foo: "bar", baz: 1 });

  testing.assertEquals(b.toString(), `level=info msg="log message" baz=1 foo=bar\n`);
});

Deno.test("logger.addFields", () => {
  const b = new bytes.DynamicBuffer();
  const logger = new log.StandardLogger({
    out: b,
    formatter: new log.TextFormatter({ disableTimestamp: true }),
    level: log.Level.info,
  });
  logger.addFields({ foo: "bar", baz: 1 });
  logger.info("log message");

  testing.assertEquals(b.toString(), `level=info msg="log message" baz=1 foo=bar\n`);
});

Deno.test("overwrite global field with local field", () => {
  const b = new bytes.DynamicBuffer();
  const logger = new log.StandardLogger({
    out: b,
    formatter: new log.TextFormatter({ disableTimestamp: true }),
    level: log.Level.info,
  });
  logger.addFields({ foo: "bar", baz: 1 });
  logger.info("log message", { baz: "foo" });

  testing.assertEquals(b.toString(), `level=info msg="log message" baz=foo foo=bar\n`);
});
