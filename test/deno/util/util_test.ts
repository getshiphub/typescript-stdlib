import * as testing from "../testing.ts";
import { errors, util } from "../../../dist/deno/mod.ts";

Deno.test("util.toString", () => {
  const tests: [unknown, string][] = [
    [10, "10"],
    [-12.5, "-12.5"],
    [true, "true"],
    [false, "false"],
    ["hello", "hello"],
    [undefined, "undefined"],
    [null, "null"],
    [errors.errorString("oh no"), "oh no"],
    // Stringer
    [new util.SemVer(1, 5, 12), "1.5.12"],
    [{ a: 1, b: "hello" }, `{ a: 1, b: "hello" }`],
  ];

  for (const [v, expected] of tests) {
    testing.assertEquals(util.toString(v), expected);
  }
});

Deno.test("util.isObject", () => {
  const tests: [unknown, boolean][] = [
    [{ hello: "world" }, true],
    [null, false],
    [[1, 2], false],
  ];

  for (const [v, expected] of tests) {
    testing.assertEquals(util.isObject(v), expected);
  }
});

Deno.test("util.isTypedArray", () => {
  const tests: [unknown, boolean][] = [
    [new Uint8Array(), true],
    [new Uint8ClampedArray(), true],
    [new Uint16Array(), true],
    [new Uint32Array(), true],
    [new Int8Array(), true],
    [new Int16Array(), true],
    [new Int32Array(), true],
    [new Float32Array(), true],
    [new Float64Array(), true],
    [new DataView(new ArrayBuffer(0)), false],
    [[], false],
  ];

  for (const [v, expected] of tests) {
    testing.assertEquals(util.isTypedArray(v), expected);
  }
});

Deno.test("util.copy", () => {
  const tests: [unknown][] = [
    [new Date()],
    [
      new Map([
        ["a", { b: "hello" }],
        ["b", { b: "world" }],
      ]),
    ],
    [
      new Set([
        ["a", { b: "hello" }],
        ["b", { b: "world" }],
      ]),
    ],
    [new Int32Array([21, 31, 41])],
  ];

  for (const [v] of tests) {
    const copy = util.copy(v);
    testing.assertEquals(copy, v);
    testing.assertNotStrictEquals(copy, v);
  }
});

Deno.test("util.copy: null", () => {
  const v = null;
  const copy = util.copy(v);
  testing.assertEquals(copy, null);
});

Deno.test("util.merge: objects", () => {
  const obj1 = {
    a: 1,
    b: {
      c: "hello",
    },
  };
  const obj2 = {
    b: {
      d: true,
    },
    e: [1, 2, 3],
  };
  const merged = util.merge(obj1, obj2);

  testing.assertEquals(merged, {
    a: 1,
    b: {
      c: "hello",
      d: true,
    },
    e: [1, 2, 3],
  });
  testing.assertNotStrictEquals(merged.b, obj1.b);
  testing.assertNotStrictEquals(merged.b, obj2.b);
  testing.assertNotStrictEquals(merged.e, obj2.e);
});

Deno.test("util.merge: arrays", () => {
  const arr1 = [{ a: 1, b: true }];
  const arr2 = [{ a: 2, b: false }];
  const merged = util.merge(arr1, arr2);

  testing.assertEquals(merged, [
    { a: 1, b: true },
    { a: 2, b: false },
  ]);
  testing.assertNotStrictEquals(merged[0], arr1[0]);
  testing.assertNotStrictEquals(merged[1], arr2[0]);
});
