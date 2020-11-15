import * as testing from "../testing.ts";
import { time } from "../../../dist/deno/mod.ts";

Deno.test("time.monthString", () => {
  const s = time.monthString(time.Month.july);
  testing.assertEquals(s, "July");
});

Deno.test("time.dateMonth", () => {
  const d = new Date(2020, 5);
  testing.assertEquals(time.dateMonth(d), time.Month.june);
});

Deno.test("time.weekdayString", () => {
  const s = time.weekdayString(time.Weekday.thursday);
  testing.assertEquals(s, "Thursday");
});

Deno.test("time.dateWeekday", () => {
  const d = new Date(2020, 5, 4);
  testing.assertEquals(time.dateWeekday(d), time.Weekday.thursday);
});

Deno.test("time.toNanoseconds", () => {
  const tests: [number, number][] = [
    [-1000, -1000],
    [1000, 1000],
    [-1, -1],
    [1, 1],
  ];

  for (const [d, expected] of tests) {
    testing.assertEquals(time.toNanoseconds(d), expected);
  }
});

Deno.test("time.toMicroseconds", () => {
  const tests: [number, number][] = [
    [-1000, -1],
    [1000, 1],
  ];

  for (const [d, expected] of tests) {
    testing.assertEquals(time.toMicroseconds(d), expected);
  }
});

Deno.test("time.toMilliseconds", () => {
  const tests: [number, number][] = [
    [-1000000, -1],
    [1000000, 1],
  ];

  for (const [d, expected] of tests) {
    testing.assertEquals(time.toMilliseconds(d), expected);
  }
});

Deno.test("time.toSeconds", () => {
  const tests: [number, number][] = [[300000000, 0.3]];

  for (const [d, expected] of tests) {
    testing.assertEquals(time.toSeconds(d), expected);
  }
});

Deno.test("time.toMinutes", () => {
  const tests: [number, number][] = [
    [-60000000000, -1],
    [60000000000, 1],
    [-1, -1 / 60e9],
    [1, 1 / 60e9],
    [3000, 5e-8],
  ];

  for (const [d, expected] of tests) {
    testing.assertEquals(time.toMinutes(d), expected);
  }
});

Deno.test("time.toHours", () => {
  const tests: [number, number][] = [
    [-3600000000000, -1],
    [3600000000000, 1],
    [-1, -1 / 3600e9],
    [1, 1 / 3600e9],
    [36, 1e-11],
  ];

  for (const [d, expected] of tests) {
    testing.assertEquals(time.toHours(d), expected);
  }
});

Deno.test("time.durationString", () => {
  const tests: [number, string][] = [
    [0, "0s"],
    [1 * time.nanosecond, "1ns"],
    [1100 * time.nanosecond, "1.1µs"],
    [-1100 * time.nanosecond, "-1.1µs"],
    [2200 * time.microsecond, "2.2ms"],
    [3300 * time.millisecond, "3.3s"],
    [4 * time.minute + 5 * time.second, "4m5s"],
    [4 * time.minute + 5001 * time.millisecond, "4m5.001s"],
    [5 * time.hour + 6 * time.minute + 7001 * time.millisecond, "5h6m7.001s"],
    [8 * time.minute + 1 * time.nanosecond, "8m0.000000001s"],
  ];

  for (const [d, expected] of tests) {
    testing.assertEquals(time.durationString(d), expected);
  }
});
