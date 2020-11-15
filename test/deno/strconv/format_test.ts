import * as testing from "../testing.ts";
import { strconv } from "../../../dist/deno/mod.ts";

Deno.test("strconv.formatBool", () => {
  const tests: [boolean, string][] = [
    [true, "true"],
    [false, "false"],
  ];

  for (const [b, expected] of tests) {
    testing.assertEquals(strconv.formatBool(b), expected);
  }
});

Deno.test("strconv.formatInt: base 10", () => {
  const tests: [number, string][] = [
    [0, "0"],
    [1, "1"],
    [-1, "-1"],
    [12345678, "12345678"],
    [-98765432, "-98765432"],
  ];

  for (const [int, expected] of tests) {
    testing.assertEquals(strconv.formatInt(int), expected);
  }
});

Deno.test("strconv.formatInt: custom base", () => {
  const tests: [number, number, string][] = [
    [0, 2, "0"],
    [10, 2, "1010"],
    [-1, 2, "-1"],
    [-8, 8, "-10"],
    [0o57635, 8, "57635"],
    [14, 8, "16"],
    [16, 16, "10"],
    [-0x12345abcdef, 16, "-12345abcdef"],
    [95, 16, "5f"],
  ];

  for (const [int, base, expected] of tests) {
    testing.assertEquals(strconv.formatInt(int, base), expected);
  }
});

Deno.test("strconv.formatInt: invalid integer", () => {
  testing.assertPanics(() => {
    strconv.formatInt(1.1);
  }, "formatInt: i must be a valid integer");
});

Deno.test("strconv.formatInt: base not an integer", () => {
  testing.assertPanics(() => {
    strconv.formatInt(5, 2.1);
  }, "formatInt: base must be a valid integer");
});

Deno.test("strconv.formatInt: invalid base", () => {
  testing.assertPanics(() => {
    strconv.formatInt(5, 1);
  }, "formatInt: illegal number base: 1");

  testing.assertPanics(() => {
    strconv.formatInt(5, 50);
  }, "formatInt: illegal number base: 50");
});

Deno.test("strconv.formatFloat: fixed format and precision", () => {
  const tests: [number, number | undefined, string][] = [
    [1, 5, "1.00000"],
    [0, 5, "0.00000"],
    [-1, 5, "-1.00000"],
    [12, 5, "12.00000"],
    [123456700, 5, "123456700.00000"],
    [1.2345e6, 5, "1234500.00000"],
    [0.9, 1, "0.9"],
    [0.09, 1, "0.1"],
    [0.0999, 1, "0.1"],
    [0.05, 1, "0.1"],
    [0.05, 0, "0"],
    [0.5, 1, "0.5"],
    [0.5, 0, "1"],
    [1.5, 0, "2"],
    [123456, undefined, "123456"],
    [12345.6789, undefined, "12345.6789"],
    [12345.6789, 0, "12346"],
    [12345.6789, 1, "12345.7"],
    [12345.6789, 6, "12345.678900"],
  ];

  for (const [float, prec, expected] of tests) {
    testing.assertEquals(strconv.formatFloat(float, "f", prec), expected);
  }
});

Deno.test("strconv.formatFloat: exponential format and precision", () => {
  const tests: [number, number | undefined, string][] = [
    [1, 5, "1.00000e+0"],
    [0, 5, "0.00000e+0"],
    [-1, 5, "-1.00000e+0"],
    [12, 5, "1.20000e+1"],
    [123456700, 5, "1.23457e+8"],
    [1.2345e6, 5, "1.23450e+6"],
    [1e23, 17, "9.99999999999999916e+22"],
    [1e23, undefined, "1e+23"],
    [123456, 2, "1.23e+5"],
    [12345.6789, undefined, "1.23456789e+4"],
    [12345.6789, 0, "1e+4"],
  ];

  for (const [float, prec, expected] of tests) {
    testing.assertEquals(strconv.formatFloat(float, "e", prec), expected);
  }
});

Deno.test("strconv.formatFloat: invalid format", () => {
  testing.assertPanics(() => {
    // @ts-expect-error: Test invalid argument
    strconv.formatFloat(1.1, "h");
  }, `formatFloat: invalid fmt "h", must be either "f" or "e"`);
});
