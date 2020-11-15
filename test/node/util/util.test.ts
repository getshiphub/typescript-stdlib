import { errors, util } from "../../../src";

describe("util/util.ts", () => {
  test.each([
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
    [{ a: 1, b: "hello" }, "{ a: 1, b: 'hello' }"],
  ])("util.toString: %s", (v, expected) => {
    expect(util.toString(v)).toBe(expected);
  });

  test.each([
    [{ hello: "world" }, true],
    [null, false],
    [[1, 2], false],
  ])("util.isObject: %s", (v, expected) => {
    expect(util.isObject(v)).toBe(expected);
  });

  test.each([
    ["Uint8Array", new Uint8Array(), true],
    ["Uint8ClampedArray", new Uint8ClampedArray(), true],
    ["Uint16Array", new Uint16Array(), true],
    ["Uint32Array", new Uint32Array(), true],
    ["Int8Array", new Int8Array(), true],
    ["Int16Array", new Int16Array(), true],
    ["Int32Array", new Int32Array(), true],
    ["Float32Array", new Float32Array(), true],
    ["Float64Array", new Float64Array(), true],
    ["DataView", new DataView(new ArrayBuffer(0)), false],
    ["Array", [], false],
  ])("util.isTypedArray: %s", (_name, v, expected) => {
    expect(util.isTypedArray(v)).toBe(expected);
  });

  test.each([
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
  ])("util.copy: %s", (v) => {
    const copy = util.copy(v);
    expect(copy).toEqual(v);
    expect(copy).not.toBe(v);
  });

  test("util.copy: null", () => {
    const v = null;
    const copy = util.copy(v);
    expect(copy).toBeNull();
  });

  test("util.merge: objects", () => {
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

    expect(merged).toEqual({
      a: 1,
      b: {
        c: "hello",
        d: true,
      },
      e: [1, 2, 3],
    });
    expect(merged.b).not.toBe(obj1.b);
    expect(merged.b).not.toBe(obj2.b);
    expect(merged.e).not.toBe(obj2.e);
  });

  test("util.merge: arrays", () => {
    const arr1 = [{ a: 1, b: true }];
    const arr2 = [{ a: 2, b: false }];
    const merged = util.merge(arr1, arr2);

    expect(merged).toEqual([
      { a: 1, b: true },
      { a: 2, b: false },
    ]);
    expect(merged[0]).not.toBe(arr1[0]);
    expect(merged[1]).not.toBe(arr2[0]);
  });
});
