import { bytes } from "../../../src";

describe("bytes/bytes.ts", () => {
  test("bytes.copy", () => {
    const src = new Uint8Array([0x10, 0xff, 0xab, 0x23]);
    const dest = new Uint8Array(4);
    const n = bytes.copy(dest, src);

    expect(n).toBe(4);
    expect(dest).toEqual(new Uint8Array([0x10, 0xff, 0xab, 0x23]));
  });

  test("bytes.copy: src larger than dest", () => {
    const src = new Uint8Array([0x10, 0xff, 0xab, 0x23, 0xef, 0x5d]);
    const dest = new Uint8Array(4);
    const n = bytes.copy(dest, src);

    expect(n).toBe(4);
    expect(dest).toEqual(new Uint8Array([0x10, 0xff, 0xab, 0x23]));
  });

  test.each([
    [
      "different lengths",
      new Uint8Array([0x10, 0xff, 0xab, 0x23]),
      new Uint8Array([0x10, 0xff, 0xab, 0x23, 0xef, 0x5d]),
      false,
    ],
    [
      "not equal",
      new Uint8Array([0x10, 0xff, 0xab, 0x23]),
      new Uint8Array([0x10, 0xff, 0xab, 0x54]),
      false,
    ],
    [
      "equal",
      new Uint8Array([0x10, 0xff, 0xab, 0x23]),
      new Uint8Array([0x10, 0xff, 0xab, 0x23]),
      true,
    ],
  ])("bytes.equal: %s", (_name, a, b, expected) => {
    expect(bytes.equal(a, b)).toBe(expected);
  });

  test.each([
    [
      "has prefix",
      new Uint8Array([0x10, 0xff, 0xab, 0x23, 0xef, 0x5d]),
      new Uint8Array([0x10, 0xff]),
      true,
    ],
    [
      "no prefix",
      new Uint8Array([0x10, 0xff, 0xab, 0x23, 0xef, 0x5d]),
      new Uint8Array([0xdc, 0xff]),
      false,
    ],
    ["prefix longer than bytes", new Uint8Array([0xdc]), new Uint8Array([0xdc, 0xff]), false],
  ])("bytes.hasPrefix: %s", (_name, b, prefix, expected) => {
    expect(bytes.hasPrefix(b, prefix)).toBe(expected);
  });

  test.each([
    [
      "has suffix",
      new Uint8Array([0x10, 0xff, 0xab, 0x23, 0xef, 0x5d]),
      new Uint8Array([0xef, 0x5d]),
      true,
    ],
    [
      "no suffix",
      new Uint8Array([0x10, 0xff, 0xab, 0x23, 0xef, 0x5d]),
      new Uint8Array([0xef, 0xdc]),
      false,
    ],
    ["suffix longer than bytes", new Uint8Array([0xdc]), new Uint8Array([0xdc, 0xff]), false],
  ])("bytes.hasSuffix: %s", (_name, b, suffix, expected) => {
    expect(bytes.hasSuffix(b, suffix)).toBe(expected);
  });

  test.each([
    ["empty array", [], new Uint8Array([0xac, 0xdb]), new Uint8Array()],
    [
      "single element",
      [new Uint8Array([0x10, 0xff, 0xab])],
      new Uint8Array([0xac, 0xdb]),
      new Uint8Array([0x10, 0xff, 0xab]),
    ],
    [
      "multiple elements",
      [
        new Uint8Array([0x10, 0xff, 0xab]),
        new Uint8Array([0x23, 0xef, 0x5d]),
        new Uint8Array([0x3b, 0x1f, 0x9c]),
      ],
      new Uint8Array([0xac, 0xdb]),
      new Uint8Array([
        0x10,
        0xff,
        0xab,
        0xac,
        0xdb,
        0x23,
        0xef,
        0x5d,
        0xac,
        0xdb,
        0x3b,
        0x1f,
        0x9c,
      ]),
    ],
  ])("bytes.join: %s", (_name, s, sep, expected) => {
    expect(bytes.join(s, sep)).toEqual(expected);
  });

  test.each([
    [0, new Uint8Array([0x10, 0xff, 0xab]), new Uint8Array()],
    [
      3,
      new Uint8Array([0x10, 0xff, 0xab]),
      new Uint8Array([0x10, 0xff, 0xab, 0x10, 0xff, 0xab, 0x10, 0xff, 0xab]),
    ],
  ])("bytes.repeat: %d", (count, b, expected) => {
    expect(bytes.repeat(b, count)).toEqual(expected);
  });

  test.each([
    [-2, new Uint8Array([0x10, 0xff, 0xab]), "bytes: negative repeat count"],
    [1.2, new Uint8Array([0x10, 0xff, 0xab]), "bytes: count must be an integer"],
  ])("bytes.repeat: panic: %c", (count, b, expected) => {
    expect(() => {
      bytes.repeat(b, count);
    }).toPanic(expected);
  });

  test.each([
    [
      "has prefix",
      new Uint8Array([0x10, 0xff, 0xab, 0x23, 0xef, 0x5d]),
      new Uint8Array([0x10, 0xff]),
      new Uint8Array([0xab, 0x23, 0xef, 0x5d]),
    ],
    [
      "no prefix",
      new Uint8Array([0x10, 0xff, 0xab, 0x23, 0xef, 0x5d]),
      new Uint8Array([0xdc, 0xff]),
      new Uint8Array([0x10, 0xff, 0xab, 0x23, 0xef, 0x5d]),
    ],
  ])("bytes.trimPrefix: %s", (_name, b, prefix, expected) => {
    expect(bytes.trimPrefix(b, prefix)).toEqual(expected);
  });

  test.each([
    [
      "has suffix",
      new Uint8Array([0x10, 0xff, 0xab, 0x23, 0xef, 0x5d]),
      new Uint8Array([0xef, 0x5d]),
      new Uint8Array([0x10, 0xff, 0xab, 0x23]),
    ],
    [
      "no suffix",
      new Uint8Array([0x10, 0xff, 0xab, 0x23, 0xef, 0x5d]),
      new Uint8Array([0xef, 0xdc]),
      new Uint8Array([0x10, 0xff, 0xab, 0x23, 0xef, 0x5d]),
    ],
  ])("bytes.trimSuffix: %s", (_name, b, suffix, expected) => {
    expect(bytes.trimSuffix(b, suffix)).toEqual(expected);
  });
});
