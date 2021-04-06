/* eslint-disable no-template-curly-in-string */

import path from "path";
import { env } from "../../../src";

const testdatadir = path.join(__dirname, "..", "..", "testdata", "env");

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

describe("env/dotenv.ts", () => {
  test("env.parse", () => {
    const result = env.parse("ONE=1\nTWO='2'\nTHREE = \"3\"");
    const expected = new Map([
      ["ONE", "1"],
      ["TWO", "2"],
      ["THREE", "3"],
    ]);
    expect(result.unwrap()).toEqual(expected);
  });

  test("env.read", () => {
    const result = env.read(filepaths.complex, filepaths.exported, filepaths.plain);
    expect(result.unwrap()).toEqual(expectedVars);
  });

  test("env.read: parsing error", () => {
    const result = env.read(filepaths.invalid);
    expect(result.isFailure()).toBe(true);
  });

  test.each([
    ["load", env.load],
    ["overload", env.overload],
  ])("env.%s", (_name, fn) => {
    clearenv();
    const err = fn(filepaths.complex, filepaths.exported, filepaths.plain);
    expect(err).toBeUndefined();
    for (const [k, v] of expectedVars) {
      expect(env.lookup(k)).toBe(v);
    }
  });

  test.each([
    ["load", env.load],
    ["overload", env.overload],
  ])("env.%s: no such file", (_name, fn) => {
    const err = fn("somefilethatwillneverexistever.env");
    expect(err).not.toBeUndefined();
  });

  test("env.load does not override", () => {
    clearenv();
    const existing = new Map([
      ["TEST_PLAIN_A", "do_not_override"],
      ["TEST_PLAIN_B", ""],
    ]);
    seedenv(existing);
    const err = env.load(filepaths.plain);
    expect(err).toBeUndefined();
    for (const [k, v] of existing) {
      expect(env.get(k)).toBe(v);
    }
  });

  test("env.overload does override", () => {
    clearenv();
    const existing = new Map([
      ["TEST_PLAIN_A", "do_not_override"],
      ["TEST_PLAIN_B", ""],
    ]);
    seedenv(existing);
    const err = env.overload(filepaths.plain);
    expect(err).toBeUndefined();
    for (const [k] of existing) {
      expect(env.get(k)).toBe(expectedVars.get(k));
    }
  });

  test("env.read: roundtrip", () => {
    const result = env.read(filepaths.complex, filepaths.exported, filepaths.plain);
    const m = result.unwrap();
    const roundtripped = env.parse(env.stringify(m)).unwrap();
    expect(roundtripped).toEqual(m);
  });
});
