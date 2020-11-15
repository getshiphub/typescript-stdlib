import * as testing from "../testing.ts";
import { colors, errors, log, util } from "../../../dist/deno/mod.ts";

const isoRegex = `\\d{4}-[01]\\d-[0-3]\\dT[0-2]\\d:[0-5]\\d:[0-5]\\d\\.\\d+([+-][0-2]\\d:[0-5]\\d|Z)`;

function createLogFixture(l?: Partial<log.Log>): log.Log {
  return {
    data: l?.data ?? {},
    date: l?.date ?? new Date(),
    level: l?.level ?? log.Level.debug,
    msg: l?.msg ?? "log message",
    out: l?.out,
  };
}

function bufToString(buf: Uint8Array): string {
  return new TextDecoder("utf-8").decode(buf);
}

Deno.test("log.JSONFormatter: format as json", () => {
  const l = createLogFixture({
    data: { foo: "bar" },
  });
  const f = new log.JSONFormatter();
  const s = bufToString(f.format(l).unwrap());
  const json = JSON.parse(s);

  testing.assertEquals(json, {
    time: l.date.toISOString(),
    level: "debug",
    msg: "log message",
    foo: "bar",
  });
});

Deno.test("log.JSONFormatter: prevent clashes with default fields", () => {
  const l = createLogFixture({
    data: {
      time: "noon",
      level: 56,
      msg: "some stuff",
    },
  });
  const f = new log.JSONFormatter();
  const s = bufToString(f.format(l).unwrap());
  const json = JSON.parse(s);

  testing.assertEquals(json, {
    time: l.date.toISOString(),
    level: "debug",
    msg: "log message",
    "fields.time": "noon",
    "fields.level": 56,
    "fields.msg": "some stuff",
  });
});

Deno.test("log.JSONFormatter: rename default fields", () => {
  const l = createLogFixture({
    data: {
      time: "noon",
      level: 56,
      msg: "some stuff",
    },
  });
  const f = new log.JSONFormatter({
    fieldMap: new Map([
      [log.FieldKey.time, "@time"],
      [log.FieldKey.level, "@level"],
      [log.FieldKey.msg, "@msg"],
    ]),
  });
  const s = bufToString(f.format(l).unwrap());
  const json = JSON.parse(s);

  testing.assertEquals(json, {
    "@time": l.date.toISOString(),
    "@level": "debug",
    "@msg": "log message",
    time: "noon",
    level: 56,
    msg: "some stuff",
  });
});

Deno.test("log.JSONFormatter: format errors properly", () => {
  const l = createLogFixture({
    data: {
      err1: errors.errorString("oops"),
      err2: errors.newError("boom!"),
    },
  });
  const f = new log.JSONFormatter();
  const s = bufToString(f.format(l).unwrap());
  const json = JSON.parse(s);

  testing.assertEquals(json, {
    time: l.date.toISOString(),
    level: "debug",
    msg: "log message",
    err1: "oops",
    err2: "boom!",
  });
});

Deno.test("log.JSONFormatter: nest fields under the specified key", () => {
  const l = createLogFixture({
    data: {
      foo: "bar",
      baz: 2,
    },
  });
  const f = new log.JSONFormatter({
    dataKey: "props",
  });
  const s = bufToString(f.format(l).unwrap());
  const json = JSON.parse(s);

  testing.assertEquals(json, {
    time: l.date.toISOString(),
    level: "debug",
    msg: "log message",
    props: {
      foo: "bar",
      baz: 2,
    },
  });
});

Deno.test("log.TextFormatter: format as text", () => {
  const l = createLogFixture({
    data: { foo: "bar" },
  });
  const f = new log.TextFormatter();
  const s = bufToString(f.format(l).unwrap());

  const regex = new RegExp(`time="${isoRegex}" level=debug msg="log message" foo=bar`);
  testing.assertMatch(s, regex);
});

Deno.test("log.TextFormatter: prevent clashes with default fields", () => {
  const l = createLogFixture({
    data: {
      time: "noon",
      level: 56,
      msg: "some stuff",
    },
  });
  const f = new log.TextFormatter();
  const s = bufToString(f.format(l).unwrap());

  const regex = new RegExp(
    `time="${isoRegex}" level=debug msg="log message" fields.level=56 fields.msg="some stuff" fields.time=noon`,
  );
  testing.assertMatch(s, regex);
});

Deno.test("log.TextFormatter: rename default fields", () => {
  const l = createLogFixture({
    data: {
      time: "noon",
      level: 56,
      msg: "some stuff",
    },
  });
  const f = new log.TextFormatter({
    fieldMap: new Map([
      [log.FieldKey.time, "@time"],
      [log.FieldKey.level, "@level"],
      [log.FieldKey.msg, "@msg"],
    ]),
  });
  const s = bufToString(f.format(l).unwrap());

  const regex = new RegExp(
    `@time="${isoRegex}" @level=debug @msg="log message" level=56 msg="some stuff" time=noon`,
  );
  testing.assertMatch(s, regex);
});

Deno.test("log.TextFormatter: force quotes", () => {
  const l = createLogFixture({
    data: { foo: "bar" },
  });
  const f = new log.TextFormatter({
    forceQuote: true,
  });
  const s = bufToString(f.format(l).unwrap());

  const regex = new RegExp(`time="${isoRegex}" level="debug" msg="log message" foo="bar"`);
  testing.assertMatch(s, regex);
});

Deno.test("log.TextFormatter: disable quoting", () => {
  const l = createLogFixture({
    data: { foo: "bar" },
  });
  const f = new log.TextFormatter({
    disableQuote: true,
  });
  const s = bufToString(f.format(l).unwrap());

  const regex = new RegExp(`time=${isoRegex} level=debug msg=log message foo=bar`);
  testing.assertMatch(s, regex);
});

Deno.test("log.TextFormatter: formats the text with color", () => {
  const l = createLogFixture({
    data: { foo: "bar" },
  });
  const f = new log.TextFormatter({
    forceColors: true,
    disableTimestamp: true,
  });
  const s = bufToString(f.format(l).unwrap());

  testing.assertEquals(s, `${colors.white("DEBU")} log message ${colors.white("foo")}=bar\n`);
});

Deno.test("log.TextFormatter: disable level truncation", () => {
  const l = createLogFixture({
    data: { foo: "bar" },
    level: log.Level.error,
  });
  const f = new log.TextFormatter({
    forceColors: true,
    disableTimestamp: true,
    disableLevelTruncation: true,
  });
  const s = bufToString(f.format(l).unwrap());

  testing.assertEquals(s, `${colors.red("ERROR")} log message ${colors.red("foo")}=bar\n`);
});

Deno.test("log.TextFormatter: pad the level", () => {
  const l = createLogFixture({
    data: { foo: "bar" },
    level: log.Level.info,
  });
  const f = new log.TextFormatter({
    forceColors: true,
    disableTimestamp: true,
    padLevelText: true,
  });
  const s = bufToString(f.format(l).unwrap());

  testing.assertEquals(s, `${colors.blue("INFO ")} log message ${colors.blue("foo")}=bar\n`);
});

Deno.test("log.TextFormatter: stringify values according to util.toString semantics", () => {
  const l = createLogFixture({
    data: {
      bool: true,
      error: errors.errorString("oh no"),
      nil: null,
      num: 10.5,
      obj: { a: 1, b: "prop" },
      semver: new util.SemVer(1, 12, 5),
      str: "hello",
      undef: undefined,
    },
  });
  const f = new log.TextFormatter({
    disableColors: true,
    disableTimestamp: true,
  });
  const s = bufToString(f.format(l).unwrap());

  const e = `level=debug msg="log message" bool=true error="oh no" nil=null num=10.5 obj="{ a: 1, b: "prop" }" semver=1.12.5 str=hello undef=undefined\n`;
  testing.assertEquals(s, e);
});
