import * as testing from "../testing.ts";
import { errors, strconv } from "../../../dist/deno/mod.ts";

Deno.test("strconv.parseBool", () => {
  const tests: [string, boolean][] = [
    ["1", true],
    ["t", true],
    ["T", true],
    ["true", true],
    ["TRUE", true],
    ["True", true],
    ["0", false],
    ["f", false],
    ["F", false],
    ["false", false],
    ["FALSE", false],
    ["False", false],
  ];

  for (const [str, expected] of tests) {
    testing.assertEquals(strconv.parseBool(str).unwrap(), expected);
  }
});

Deno.test("strconv.parseBool: error", () => {
  const err = strconv.parseBool("abc").unwrapFailure() as strconv.NumError;
  testing.assert(strconv.isNumError(err));
  testing.assertEquals(err.func, "parseBool");
  testing.assertEquals(err.num, "abc");
  testing.assertEquals(err.cause(), strconv.errSyntax);
});

Deno.test("strconv.parseInt: fast method", () => {
  const tests: [string, number][] = [
    ["0", 0],
    ["-0", -0],
    ["1", 1],
    ["-1", -1],
    ["12345", 12345],
    ["-12345", -12345],
    ["012345", 12345],
    ["-012345", -12345],
  ];

  for (const [str, expected] of tests) {
    testing.assertEquals(strconv.parseInt(str).unwrap(), expected);
  }
});

Deno.test("strconv.parseInt: infer base 0", () => {
  const tests: [string, number][] = [
    ["0", 0],
    ["-0", -0],
    ["1", 1],
    ["-1", -1],
    ["12345", 12345],
    ["-12345", -12345],
    ["012345", 0o12345],
    ["-012345", -0o12345],
    ["0x12345", 0x12345],
    ["-0X12345", -0x12345],
    ["98765432100", 98765432100],
    ["-98765432100", -98765432100],
    ["922337203685477", 922337203685477],
    ["-922337203685477", -922337203685477],
    ["0b101", 5],
    ["0B101", 5],
    ["0o377", 255],
    ["0O377", 255],
  ];

  for (const [str, expected] of tests) {
    testing.assertEquals(strconv.parseInt(str, 0).unwrap(), expected);
  }
});

Deno.test("strconv.parseInt: custom base", () => {
  const tests: [string, number, number][] = [
    ["0", 2, 0],
    ["-1", 2, -1],
    ["1010", 2, 10],
    ["1000000000000000", 2, 0b1000000000000000],
    ["0", 8, 0],
    ["-10", 8, -8],
    ["57635436545", 8, 0o57635436545],
    ["100000000", 8, 0o100000000],
    ["0", 16, 0],
    ["10", 16, 16],
    ["-12345abcdef", 16, -0x12345abcdef],
    ["ab20ef", 16, 0xab20ef],
    ["25", 10, 25],
    ["g", 17, 16],
  ];

  for (const [str, base, expected] of tests) {
    testing.assertEquals(strconv.parseInt(str, base).unwrap(), expected);
  }
});

Deno.test("strconv.parseInt: underscores", () => {
  const tests: [string, number][] = [
    ["0x_1_2_3_4_5", 0x12345],
    ["-0x_1_2_3_4_5", -0x12345],
    ["0_1_2_3_4_5", 0o12345],
    ["-0_1_2_3_4_5", -0o12345],
    ["0o1_2_3_4_5", 0o12345],
    ["-0o1_2_3_4_5", -0o12345],
    ["1_2_3_4_5", 12345],
    ["-1_2_3_4_5", -12345],
    ["0b_1_0_1", 5],
    ["-0b_1_0_1", -5],
  ];

  for (const [str, expected] of tests) {
    testing.assertEquals(strconv.parseInt(str, 0).unwrap(), expected);
  }
});

Deno.test("strconv.parseInt: range error", () => {
  const tests: [string][] = [
    ["9223372036854775809"],
    ["-9223372036854775809"],
    ["18446744073709551616"],
    ["18446744073709551620"],
    ["0x10000000000000000"],
    ["02000000000000000000000"],
    ["1000000000000000000000000000000000000000000000000000000000000000"],
    ["1000000000000000000000000000000000000000000000000000000000000001"],
  ];

  for (const [str] of tests) {
    const err = strconv.parseInt(str, 0).unwrapFailure();
    testing.assertEquals(errors.cause(err), strconv.errRange);
  }
});

Deno.test("strconv.parseInt: syntax error", () => {
  const tests: [string, number][] = [
    ["", 0],
    ["12345x", 0],
    ["-12345x", 0],
    ["0x", 0],
    ["0X", 0],
    ["0xabcdefg123", 0],
    ["123456789abc", 0],
    ["0b", 0],
    ["0B", 0],
    ["0o", 0],
    ["0O", 0],
    ["-_0x12345", 0],
    ["_-0x12345", 0],
    ["_0x12345", 0],
    ["0x__12345", 0],
    ["0x1__2345", 0],
    ["0x1234__5", 0],
    ["0x12345_", 0],
    ["1__2345", 0],
    ["1234__5", 0],
    ["12345_", 0],
    ["1_2_3", 10],
    ["_123", 10],
    ["1__23", 10],
    ["123_", 10],
    ["1_2_3", 16],
    ["_123", 16],
    ["1__23", 16],
    ["123_", 16],
    ["1_2_3", 8],
    ["_123", 8],
    ["1__23", 8],
    ["123_", 8],
    ["1_2_3", 2],
    ["_123", 2],
    ["1__23", 2],
    ["123_", 2],
  ];

  for (const [str, base] of tests) {
    const err = strconv.parseInt(str, base).unwrapFailure();
    testing.assertEquals(errors.cause(err), strconv.errSyntax);
  }
});

Deno.test("strconv.parseInt: invalid base", () => {
  const err = strconv.parseInt("123", 40).unwrapFailure();
  testing.assertEquals(err.error(), `strconv.parseInt: parsing "123": invalid base 40`);
  testing.assertEquals(err.detailedError(), `strconv.parseInt: parsing "123": invalid base 40`);
});

Deno.test("strconv.parseFloat", () => {
  const tests: [string, number][] = [
    ["1.11", 1.11],
    ["+1.11", 1.11],
    ["-1.11", -1.11],
  ];

  for (const [str, expected] of tests) {
    testing.assertEquals(strconv.parseFloat(str).unwrap(), expected);
  }
});

Deno.test("strconv.parseFloat: NumError", () => {
  const tests: [string][] = [["1.111abc"], [""]];

  for (const [str] of tests) {
    const err = strconv.parseFloat(str).unwrapFailure() as strconv.NumError;
    testing.assertEquals(strconv.isNumError(err), true);
    testing.assertEquals(err.func, "parseFloat");
    testing.assertEquals(err.num, str);
    testing.assertEquals(err.cause(), strconv.errSyntax);
  }
});

Deno.test("strconv.parseFloat: NaN", () => {
  const tests: [string][] = [["NaN"], ["nan"], ["NAN"]];

  for (const [str] of tests) {
    const v = strconv.parseFloat(str).unwrap();
    testing.assert(Number.isNaN(v));
  }
});

Deno.test("strconv.parseFloat: infinity", () => {
  const tests: [string][] = [["infinity"], ["+infinity"], ["Infinity"], ["INFINITY"]];

  for (const [str] of tests) {
    testing.assertEquals(strconv.parseFloat(str).unwrap(), Infinity);
  }
});

Deno.test("strconv.parseFloat: negative infinity", () => {
  const tests: [string][] = [["-infinity"], ["-Infinity"], ["-INFINITY"]];

  for (const [str] of tests) {
    testing.assertEquals(strconv.parseFloat(str).unwrap(), -Infinity);
  }
});
