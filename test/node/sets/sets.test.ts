import { sets } from "../../../src";

describe("sets.ts", () => {
  test.each([
    // a, b, expected
    [new Set([1, 2, 3]), new Set([4, 5, 6]), new Set([1, 2, 3, 4, 5, 6])],
    [new Set([1, 2, 3, 4]), new Set([2, 4, 5, 6]), new Set([1, 2, 3, 4, 5, 6])],
  ])("sets.union: %#", (a, b, expected) => {
    const c = sets.union(a, b);
    expect(c).toEqual(expected);
  });

  test.each([
    // a, b, expected
    [new Set([1, 2, 3, 4]), new Set([2, 4, 5, 6]), new Set([2, 4])],
    [new Set([1, 2, 3]), new Set([4, 5, 6]), new Set()],
  ])("sets.intersection: %#", (a, b, expected) => {
    const c = sets.intersection(a, b);
    expect(c).toEqual(expected);
  });

  test.each([
    // a, b, expected
    [new Set([1, 2, 3, 4]), new Set([2, 4, 5, 6]), new Set([1, 3])],
    [new Set([1, 2, 3]), new Set([1, 2, 3, 4, 5, 6]), new Set()],
  ])("sets.difference: %#", (a, b, expected) => {
    const c = sets.difference(a, b);
    expect(c).toEqual(expected);
  });

  test.each([
    // a, b, expected
    [new Set([1, 2, 3]), new Set([1, 2, 3, 4, 5, 6]), true],
    [new Set([1, 2, 3]), new Set([1, 2, 4]), false],
  ])("sets.isSubset: %#", (a, b, expected) => {
    const c = sets.isSubset(a, b);
    expect(c).toEqual(expected);
  });
});
