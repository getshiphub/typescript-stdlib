import * as testing from "../testing.ts";
import { bytes } from "../../../dist/deno/mod.ts";

Deno.test("bytes.copy", () => {
  const src = new Uint8Array([0x10, 0xff, 0xab, 0x23]);
  const dest = new Uint8Array(4);
  const n = bytes.copy(dest, src);

  testing.assertEquals(n, 4);
  testing.assertEquals(dest, new Uint8Array([0x10, 0xff, 0xab, 0x23]));
});

Deno.test("bytes.copy: src larger than dest", () => {
  const src = new Uint8Array([0x10, 0xff, 0xab, 0x23, 0xef, 0x5d]);
  const dest = new Uint8Array(4);
  const n = bytes.copy(dest, src);

  testing.assertEquals(n, 4);
  testing.assertEquals(dest, new Uint8Array([0x10, 0xff, 0xab, 0x23]));
});

Deno.test("bytes.equal", () => {
  const tests: [Uint8Array, Uint8Array, boolean][] = [
    [
      new Uint8Array([0x10, 0xff, 0xab, 0x23]),
      new Uint8Array([0x10, 0xff, 0xab, 0x23, 0xef, 0x5d]),
      false,
    ],
    [new Uint8Array([0x10, 0xff, 0xab, 0x23]), new Uint8Array([0x10, 0xff, 0xab, 0x54]), false],
    [new Uint8Array([0x10, 0xff, 0xab, 0x23]), new Uint8Array([0x10, 0xff, 0xab, 0x23]), true],
  ];

  for (const [a, b, expected] of tests) {
    testing.assertEquals(bytes.equal(a, b), expected);
  }
});

Deno.test("bytes.hasPrefix", () => {
  const tests: [Uint8Array, Uint8Array, boolean][] = [
    [new Uint8Array([0x10, 0xff, 0xab, 0x23, 0xef, 0x5d]), new Uint8Array([0x10, 0xff]), true],
    [new Uint8Array([0x10, 0xff, 0xab, 0x23, 0xef, 0x5d]), new Uint8Array([0xdc, 0xff]), false],
    [new Uint8Array([0xdc]), new Uint8Array([0xdc, 0xff]), false],
  ];

  for (const [b, prefix, expected] of tests) {
    testing.assertEquals(bytes.hasPrefix(b, prefix), expected);
  }
});

Deno.test("bytes.hasSuffix", () => {
  const tests: [Uint8Array, Uint8Array, boolean][] = [
    [new Uint8Array([0x10, 0xff, 0xab, 0x23, 0xef, 0x5d]), new Uint8Array([0xef, 0x5d]), true],
    [new Uint8Array([0x10, 0xff, 0xab, 0x23, 0xef, 0x5d]), new Uint8Array([0xef, 0xdc]), false],
    [new Uint8Array([0xdc]), new Uint8Array([0xdc, 0xff]), false],
  ];

  for (const [b, suffix, expected] of tests) {
    testing.assertEquals(bytes.hasSuffix(b, suffix), expected);
  }
});

Deno.test("bytes.join", () => {
  const tests: [Uint8Array[], Uint8Array, Uint8Array][] = [
    [[], new Uint8Array([0xac, 0xdb]), new Uint8Array()],
    [
      [new Uint8Array([0x10, 0xff, 0xab])],
      new Uint8Array([0xac, 0xdb]),
      new Uint8Array([0x10, 0xff, 0xab]),
    ],
    [
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
  ];

  for (const [s, sep, expected] of tests) {
    testing.assertEquals(bytes.join(s, sep), expected);
  }
});

Deno.test("bytes.repeat", () => {
  const tests: [Uint8Array, number, Uint8Array][] = [
    [new Uint8Array([0x10, 0xff, 0xab]), 0, new Uint8Array()],
    [
      new Uint8Array([0x10, 0xff, 0xab]),
      3,
      new Uint8Array([0x10, 0xff, 0xab, 0x10, 0xff, 0xab, 0x10, 0xff, 0xab]),
    ],
  ];

  for (const [b, count, expected] of tests) {
    testing.assertEquals(bytes.repeat(b, count), expected);
  }
});

Deno.test("bytes.repeat: panic", () => {
  const tests: [Uint8Array, number, string][] = [
    [new Uint8Array([0x10, 0xff, 0xab]), -2, "bytes: negative repeat count"],
    [new Uint8Array([0x10, 0xff, 0xab]), 1.2, "bytes: count must be an integer"],
  ];

  for (const [b, count, expected] of tests) {
    testing.assertPanics(() => {
      bytes.repeat(b, count);
    }, expected);
  }
});

Deno.test("bytes.trimPrefix", () => {
  const tests: [Uint8Array, Uint8Array, Uint8Array][] = [
    [
      new Uint8Array([0x10, 0xff, 0xab, 0x23, 0xef, 0x5d]),
      new Uint8Array([0x10, 0xff]),
      new Uint8Array([0xab, 0x23, 0xef, 0x5d]),
    ],
    [
      new Uint8Array([0x10, 0xff, 0xab, 0x23, 0xef, 0x5d]),
      new Uint8Array([0xdc, 0xff]),
      new Uint8Array([0x10, 0xff, 0xab, 0x23, 0xef, 0x5d]),
    ],
  ];

  for (const [b, prefix, expected] of tests) {
    testing.assertEquals(bytes.trimPrefix(b, prefix), expected);
  }
});

Deno.test("bytes.trimSuffix", () => {
  const tests: [Uint8Array, Uint8Array, Uint8Array][] = [
    [
      new Uint8Array([0x10, 0xff, 0xab, 0x23, 0xef, 0x5d]),
      new Uint8Array([0xef, 0x5d]),
      new Uint8Array([0x10, 0xff, 0xab, 0x23]),
    ],
    [
      new Uint8Array([0x10, 0xff, 0xab, 0x23, 0xef, 0x5d]),
      new Uint8Array([0xef, 0xdc]),
      new Uint8Array([0x10, 0xff, 0xab, 0x23, 0xef, 0x5d]),
    ],
  ];

  for (const [b, suffix, expected] of tests) {
    testing.assertEquals(bytes.trimSuffix(b, suffix), expected);
  }
});
