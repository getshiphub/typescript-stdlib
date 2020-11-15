import { time } from "../../../src";

describe("time/duration.ts", () => {
  test("time.monthString", () => {
    const s = time.monthString(time.Month.july);
    expect(s).toBe("July");
  });

  test("time.dateMonth", () => {
    const d = new Date(2020, 5);
    expect(time.dateMonth(d)).toBe(time.Month.june);
  });

  test("time.weekdayString", () => {
    const s = time.weekdayString(time.Weekday.thursday);
    expect(s).toBe("Thursday");
  });

  test("time.dateWeekday", () => {
    const d = new Date(2020, 5, 4);
    expect(time.dateWeekday(d)).toBe(time.Weekday.thursday);
  });

  test.each([
    [-1000, -1000],
    [1000, 1000],
    [-1, -1],
    [1, 1],
  ])("time.toNanoseconds: %d", (d, expected) => {
    expect(time.toNanoseconds(d)).toBe(expected);
  });

  test.each([
    [-1000, -1],
    [1000, 1],
  ])("time.toMicroseconds: %d", (d, expected) => {
    expect(time.toMicroseconds(d)).toBe(expected);
  });

  test.each([
    [-1000000, -1],
    [1000000, 1],
  ])("time.toMilliseconds: %d", (d, expected) => {
    expect(time.toMilliseconds(d)).toBe(expected);
  });

  test.each([[300000000, 0.3]])("time.toSeconds: %d", (d, expected) => {
    expect(time.toSeconds(d)).toBe(expected);
  });

  test.each([
    [-60000000000, -1],
    [60000000000, 1],
    [-1, -1 / 60e9],
    [1, 1 / 60e9],
    [3000, 5e-8],
  ])("time.toMinutes: %d", (d, expected) => {
    expect(time.toMinutes(d)).toBe(expected);
  });

  test.each([
    [-3600000000000, -1],
    [3600000000000, 1],
    [-1, -1 / 3600e9],
    [1, 1 / 3600e9],
    [36, 1e-11],
  ])("time.toHours: %d", (d, expected) => {
    expect(time.toHours(d)).toBe(expected);
  });

  test.each([
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
  ])("time.durationString: %d, %s", (d, expected) => {
    expect(time.durationString(d)).toBe(expected);
  });
});
