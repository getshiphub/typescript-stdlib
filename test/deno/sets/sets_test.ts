import * as testing from "../testing.ts";
import { sets } from "../../../dist/deno/mod.ts";

Deno.test("sets.union", () => {
  const tests = [
    // a, b, expected
    [new Set([1, 2, 3]), new Set([4, 5, 6]), new Set([1, 2, 3, 4, 5, 6])],
    [new Set([1, 2, 3, 4]), new Set([2, 4, 5, 6]), new Set([1, 2, 3, 4, 5, 6])],
  ];

  for (const [a, b, expected] of tests) {
    const c = sets.union(a, b);
    testing.assertEquals(c, expected);
  }
});

Deno.test("sets.intersection", () => {
  const tests = [
    // a, b, expected
    [new Set([1, 2, 3, 4]), new Set([2, 4, 5, 6]), new Set([2, 4])],
    [new Set([1, 2, 3]), new Set([4, 5, 6]), new Set()],
  ];

  for (const [a, b, expected] of tests) {
    const c = sets.intersection(a, b);
    testing.assertEquals(c, expected);
  }
});

Deno.test("sets.difference", () => {
  const tests = [
    // a, b, expected
    [new Set([1, 2, 3, 4]), new Set([2, 4, 5, 6]), new Set([1, 3])],
    [new Set([1, 2, 3]), new Set([1, 2, 3, 4, 5, 6]), new Set()],
  ];

  for (const [a, b, expected] of tests) {
    const c = sets.difference(a, b);
    testing.assertEquals(c, expected);
  }
});

Deno.test("sets.isSubset", () => {
  const tests: [Set<number>, Set<number>, boolean][] = [
    // a, b, expected
    [new Set([1, 2, 3]), new Set([1, 2, 3, 4, 5, 6]), true],
    [new Set([1, 2, 3]), new Set([1, 2, 4]), false],
  ];

  for (const [a, b, expected] of tests) {
    const c = sets.isSubset(a, b);
    testing.assertEquals(c, expected);
  }
});
