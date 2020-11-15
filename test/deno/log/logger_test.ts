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

// TODO(@cszatmary): figure out how to mock Deno.exit
// Deno.test("logger.fatal", () => {
//   let exitCode = 0;
//   const spyExit = jest.spyOn(runtime, "exit").mockImplementation(((code) => {
//     exitCode = code as number;
//   }) as (code?: number) => never);

//   const b = new bytes.DynamicBuffer();
//   const logger = new log.StandardLogger({
//     out: b,
//     formatter: new log.TextFormatter({ disableTimestamp: true }),
//     level: log.Level.fatal,
//   });
//   logger.fatal("log message");

//   testing.assertEquals(b.toString(), `level=fatal msg="log message"\n`);
//   testing.assertEquals(exitCode, 1);
//   spyExit.mockRestore();
// });

Deno.test("logger.panic", () => {
  const b = new bytes.DynamicBuffer();
  const logger = new log.StandardLogger({
    out: b,
    formatter: new log.TextFormatter({ disableTimestamp: true }),
    level: log.Level.panic,
  });

  testing.assertPanics(() => {
    logger.panic("log message");
  });

  testing.assertEquals(b.toString(), `level=panic msg="log message"\n`);
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

Deno.test("logger.addField", () => {
  const b = new bytes.DynamicBuffer();
  const logger = new log.StandardLogger({
    out: b,
    formatter: new log.TextFormatter({ disableTimestamp: true }),
    level: log.Level.info,
  });
  logger.addField("foo", "bar");
  logger.info("log message", { baz: 1 });

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
