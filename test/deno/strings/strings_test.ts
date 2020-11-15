import * as testing from "../testing.ts";
import { strings } from "../../../dist/deno/mod.ts";

function isDigit(s: string): boolean {
  return s >= "0" && s <= "9";
}

function isLetter(s: string): boolean {
  return (s >= "A" && s <= "Z") || (s >= "a" && s <= "z");
}

function isEmoji(s: string): boolean {
  return s === "😂" || s === "😠";
}

Deno.test("strings.toCodePoint", () => {
  const tests: [string, number][] = [
    ["0", 48],
    ["a", 97],
    ["A", 65],
    ["/", 47],
    ["☺", 9786],
    ["😂", 128514],
  ];

  for (const [s, cp] of tests) {
    testing.assertEquals(strings.toCodePoint(s), cp);
  }
});

Deno.test("strings.toCodePoint: s is empty", () => {
  testing.assertPanics(() => {
    strings.toCodePoint("");
  }, "strings.toCodePoint: empty string");
});

Deno.test("strings.indexAny", () => {
  const tests: [string, string, number][] = [
    ["a", "a", 0],
    ["aaa", "a", 0],
    ["abc", "xcz", 2],
    ["ab😂cd", "xy😂z", 2],
    ["a😂b😠c😂f", "cxy", "a😂b😠".length],
    // Failure cases
    ["", "", -1],
    ["", "a", -1],
    ["a", "", -1],
    ["abc", "xyz", -1],
  ];

  for (const [str, chars, expectedIndex] of tests) {
    testing.assertEquals(strings.indexAny(str, chars), expectedIndex);
  }
});

Deno.test("strings.lastIndexAny", () => {
  const tests: [string, string, number][] = [
    ["a", "a", 0],
    ["aaa", "a", 2],
    ["abc", "xcz", 2],
    ["ab😂cd", "xy😂z", 2],
    ["a😂b😠c😂f", "cxy", "a😂b😠".length],
    // Failure cases
    ["", "", -1],
    ["", "a", -1],
    ["a", "", -1],
    ["a", "xyz", -1],
    ["abc", "xyz", -1],
  ];

  for (const [str, chars, expectedIndex] of tests) {
    testing.assertEquals(strings.lastIndexAny(str, chars), expectedIndex);
  }
});

Deno.test("strings.trimPrefix", () => {
  const tests: [string, string, string][] = [
    ["abcd", "ab", "cd"],
    ["abcd", "cd", "abcd"],
  ];

  for (const [str, prefix, expected] of tests) {
    testing.assertEquals(strings.trimPrefix(str, prefix), expected);
  }
});

Deno.test("strings.trimSuffix", () => {
  const tests: [string, string, string][] = [
    ["abcd", "cd", "ab"],
    ["abcd", "ab", "abcd"],
  ];

  for (const [str, prefix, expected] of tests) {
    testing.assertEquals(strings.trimSuffix(str, prefix), expected);
  }
});

Deno.test("strings.indexFunc", () => {
  const tests: [string, (c: string) => boolean, number][] = [
    ["abc", isDigit, -1],
    ["a1b2c", isDigit, 1],
    ["0123", isLetter, -1],
    ["a1b2c", isLetter, 0],
    ["abc", isEmoji, -1],
    ["a😂b😠c", isEmoji, 1],
  ];

  for (const [s, f, expectedIndex] of tests) {
    testing.assertEquals(strings.indexFunc(s, f), expectedIndex);
  }
});

Deno.test("strings.indexFunc", () => {
  const tests: [string, (c: string) => boolean, number][] = [
    ["abc", isDigit, -1],
    ["a1b2c", isDigit, 3],
    ["0123", isLetter, -1],
    ["a1b2c", isLetter, 4],
    ["abc", isEmoji, -1],
    ["a😂b😠c", isEmoji, "a😂b".length],
  ];

  for (const [s, f, expectedIndex] of tests) {
    testing.assertEquals(strings.lastIndexFunc(s, f), expectedIndex);
  }
});
