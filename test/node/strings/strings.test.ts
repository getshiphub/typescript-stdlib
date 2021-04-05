import { strings } from "../../../src";

function isDigit(s: string): boolean {
  return s >= "0" && s <= "9";
}

function isLetter(s: string): boolean {
  return (s >= "A" && s <= "Z") || (s >= "a" && s <= "z");
}

function isEmoji(s: string): boolean {
  return s === "😂" || s === "😠";
}

describe("strings/strings.ts", () => {
  test.each([
    ["0", 48],
    ["a", 97],
    ["A", 65],
    ["/", 47],
    ["☺", 9786],
    ["😂", 128514],
  ])("strings.toCodePoint: %s", (s, cp) => {
    expect(strings.toCodePoint(s)).toBe(cp);
  });

  test("strings.toCodePoint: s is empty", () => {
    expect(() => {
      strings.toCodePoint("");
    }).toPanic("strings.toCodePoint: empty string");
  });

  test.each([
    ["", "", 1],
    ["", "notempty", 0],
    ["notempty", "", 9],
    ["smaller", "not smaller", 0],
    ["12345678987654321", "6", 2],
    ["611161116", "6", 3],
    ["notequal", "NotEqual", 0],
    ["equal", "equal", 1],
    ["abc1231231123q", "123", 3],
    ["11111", "11", 2],
    ["a😂b", "", 4],
  ])(`strings.count: "%s", "%s"`, (s, substr, expectedCount) => {
    expect(strings.count(s, substr)).toBe(expectedCount);
  });

  test.each([
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
  ])(`strings.indexAny: "%s", "%s"`, (str, chars, expectedIndex) => {
    expect(strings.indexAny(str, chars)).toBe(expectedIndex);
  });

  test.each([
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
  ])(`strings.lastIndexAny: "%s", "%s"`, (str, chars, expectedIndex) => {
    expect(strings.lastIndexAny(str, chars)).toBe(expectedIndex);
  });

  test.each([
    ["abcd", "ab", "cd"],
    ["abcd", "cd", "abcd"],
  ])(`strings.trimPrefix: "%s", "%s"`, (str, prefix, expected) => {
    expect(strings.trimPrefix(str, prefix)).toBe(expected);
  });

  test.each([
    ["abcd", "cd", "ab"],
    ["abcd", "ab", "abcd"],
  ])(`strings.trimSuffix: "%s", "%s"`, (str, prefix, expected) => {
    expect(strings.trimSuffix(str, prefix)).toBe(expected);
  });

  test.each([
    ["no digit", "abc", isDigit, -1],
    ["digit", "a1b2c", isDigit, 1],
    ["no letter", "0123", isLetter, -1],
    ["letter", "a1b2c", isLetter, 0],
    ["no emoji", "abc", isEmoji, -1],
    ["emoji", "a😂b😠c", isEmoji, 1],
  ])(`strings.indexFunc: "%s", "%s"`, (_name, s, f, expectedIndex) => {
    expect(strings.indexFunc(s, f)).toBe(expectedIndex);
  });

  test.each([
    ["no digit", "abc", isDigit, -1],
    ["digit", "a1b2c", isDigit, 3],
    ["no letter", "0123", isLetter, -1],
    ["letter", "a1b2c", isLetter, 4],
    ["no emoji", "abc", isEmoji, -1],
    ["emoji", "a😂b😠c", isEmoji, "a😂b".length],
  ])(`strings.lastIndexFunc: "%s", "%s"`, (_name, s, f, expectedIndex) => {
    expect(strings.lastIndexFunc(s, f)).toBe(expectedIndex);
  });
});
