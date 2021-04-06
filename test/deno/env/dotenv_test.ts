import * as testing from "../testing.ts";
import { env } from "../../../dist/deno/mod.ts";

// TODO(@cszatmary): Need to implement path, this is hacky, but it works for now
const path = {
  sep: Deno.build.os === "windows" ? "\\" : "/",
  dirname(p: string): string {
    const parts = p.split(path.sep);
    parts.pop();
    return parts.join(path.sep);
  },
  join(...parts: string[]): string {
    return parts.join(path.sep);
  },
};

const dirname = path.dirname(new URL(import.meta.url).pathname);
const testdatadir = path.join(dirname, "..", "..", "testdata", "env");

const filepaths = {
  complex: path.join(testdatadir, "complex.env"),
  exported: path.join(testdatadir, "exported.env"),
  invalid: path.join(testdatadir, "invalid.env"),
  plain: path.join(testdatadir, "plain.env"),
};

const expectedVars = new Map([
  ["TEST_EXPORTED_A", "postgres://localhost:5432/database?sslmode=disable"],
  ["TEST_EXPORTED_B", "\\n"],
  ["TEST_PLAIN_A", "1"],
  ["TEST_PLAIN_B", "2"],
  ["TEST_PLAIN_C", "3"],
  ["TEST_PLAIN_D", "4"],
  ["TEST_PLAIN_E", "5"],
  ["TEST_PLAIN_F", ""],
  ["TEST_PLAIN_G", ""],
  ["TEST_QUOTE_A", "1"],
  ["TEST_QUOTE_B", "2"],
  ["TEST_QUOTE_C", ""],
  ["TEST_QUOTE_D", "\\n"],
  ["TEST_QUOTE_E", "1"],
  ["TEST_QUOTE_F", "2"],
  ["TEST_QUOTE_G", ""],
  ["TEST_QUOTE_H", "\n"],
  ["TEST_QUOTE_I", "echo 'asd'"],
  ["TEST_EXPAND_A", "1"],
  ["TEST_EXPAND_B", "1"],
  ["TEST_EXPAND_C", "1"],
  ["TEST_EXPAND_D", "11"],
  ["TEST_EXPAND_E", ""],
  ["TEST_EXPAND_F", "the value is: 1"],
  ["TEST_EXPAND_G", "the value is: ${TEST_EXPAND_A}"],
  ["TEST_EXPAND_H", "the value is: ${TEST_EXPAND_A}"],
  ["TEST_COMMENT_A", "# this is not a comment"],
]);

function clearenv(): void {
  for (const [k] of expectedVars) {
    env.unset(k);
  }
}

function seedenv(m: Map<string, string>): void {
  for (const [k, v] of m) {
    env.set(k, v);
  }
}

Deno.test("env.parse", () => {
  const result = env.parse("ONE=1\nTWO='2'\nTHREE = \"3\"");
  const expected = new Map([
    ["ONE", "1"],
    ["TWO", "2"],
    ["THREE", "3"],
  ]);
  testing.assertEquals(result.unwrap(), expected);
});

Deno.test("env.read", () => {
  const result = env.read(filepaths.complex, filepaths.exported, filepaths.plain);
  testing.assertEquals(result.unwrap(), expectedVars);
});

Deno.test("env.read: parsing error", () => {
  const result = env.read(filepaths.invalid);
  testing.assert(result.isFailure());
});

Deno.test("env.load/overload", () => {
  const tests = [env.load, env.overload];

  for (const fn of tests) {
    clearenv();
    const err = fn(filepaths.complex, filepaths.exported, filepaths.plain);
    testing.assertEquals(err, undefined);
    for (const [k, v] of expectedVars) {
      testing.assertEquals(env.lookup(k), v);
    }
  }
});

Deno.test("env.load/overload: no such file", () => {
  const tests = [env.load, env.overload];

  for (const fn of tests) {
    const err = fn("somefilethatwillneverexistever.env");
    testing.assertNotEquals(err, undefined);
  }
});

Deno.test("env.load does not override", () => {
  clearenv();
  const existing = new Map([
    ["TEST_PLAIN_A", "do_not_override"],
    ["TEST_PLAIN_B", ""],
  ]);
  seedenv(existing);
  const err = env.load(filepaths.plain);
  testing.assertEquals(err, undefined);
  for (const [k, v] of existing) {
    testing.assertEquals(env.get(k), v);
  }
});

Deno.test("env.overload does override", () => {
  clearenv();
  const existing = new Map([
    ["TEST_PLAIN_A", "do_not_override"],
    ["TEST_PLAIN_B", ""],
  ]);
  seedenv(existing);
  const err = env.overload(filepaths.plain);
  testing.assertEquals(err, undefined);
  for (const [k] of existing) {
    testing.assertEquals(env.get(k), expectedVars.get(k));
  }
});

Deno.test("env.read: roundtrip", () => {
  const result = env.read(filepaths.complex, filepaths.exported, filepaths.plain);
  const m = result.unwrap();
  const roundtripped = env.parse(env.stringify(m)).unwrap();
  testing.assertEquals(roundtripped, m);
});
