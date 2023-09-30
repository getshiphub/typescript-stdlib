import { strconv } from "../../../src";

describe("strconv/format.ts", () => {
  test.each([
    [true, "true"],
    [false, "false"],
  ])("strconv.formatBool: %s", (b, expected) => {
    expect(strconv.formatBool(b)).toBe(expected);
  });

  test.each([
    [0, "0"],
    [1, "1"],
    [-1, "-1"],
    [12345678, "12345678"],
    [-98765432, "-98765432"],
  ])("strconv.formatInt: base 10: %d", (int, expected) => {
    expect(strconv.formatInt(int)).toBe(expected);
  });

  test.each([
    [0, 2, "0"],
    [10, 2, "1010"],
    [-1, 2, "-1"],
    [-8, 8, "-10"],
    [0o57635, 8, "57635"],
    [14, 8, "16"],
    [16, 16, "10"],
    [-0x12345abcdef, 16, "-12345abcdef"],
    [95, 16, "5f"],
  ])("strconv.formatInt: %d base %d", (int, base, expected) => {
    expect(strconv.formatInt(int, base)).toBe(expected);
  });

  test("strconv.formatInt: invalid integer", () => {
    expect(() => {
      strconv.formatInt(1.1);
    }).toPanic("formatInt: i must be a valid integer");
  });

  test("strconv.formatInt: base not an integer", () => {
    expect(() => {
      strconv.formatInt(5, 2.1);
    }).toPanic("formatInt: base must be a valid integer");
  });

  test("strconv.formatInt: invalid base", () => {
    expect(() => {
      strconv.formatInt(5, 1);
    }).toPanic("formatInt: illegal number base: 1");

    expect(() => {
      strconv.formatInt(5, 50);
    }).toPanic("formatInt: illegal number base: 50");
  });

  test.each([
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
  ])("strconv.formatFloat: %f with fixed format and precision %d", (float, prec, expected) => {
    expect(strconv.formatFloat(float, "f", prec)).toBe(expected);
  });

  test.each([
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
  ])(
    "strconv.formatFloat: %f with exponential format and precision %d",
    (float, prec, expected) => {
      expect(strconv.formatFloat(float, "e", prec)).toBe(expected);
    },
  );
});
