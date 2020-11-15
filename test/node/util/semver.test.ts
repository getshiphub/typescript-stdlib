import { inspect } from "util";
import { util } from "../../../src";

describe("util/semver.ts", () => {
  test("util.SemVer: new", () => {
    const sv = new util.SemVer(1, 5, 12);
    expect(sv.major).toBe(1);
    expect(sv.minor).toBe(5);
    expect(sv.patch).toBe(12);
    expect(sv.toString()).toBe("1.5.12");
  });

  test("util.SemVer: new: major not an integer", () => {
    expect(() => {
      // eslint-disable-next-line no-new
      new util.SemVer(1.2, 5, 12);
    }).toPanic("SemVer.new: major version is not a valid integer: 1.2");
  });

  test("util.SemVer: new: minor not an integer", () => {
    expect(() => {
      // eslint-disable-next-line no-new
      new util.SemVer(1, 5.2, 12);
    }).toPanic("SemVer.new: minor version is not a valid integer: 5.2");
  });

  test("util.SemVer: new: patch not an integer", () => {
    expect(() => {
      // eslint-disable-next-line no-new
      new util.SemVer(1, 5, 12.2);
    }).toPanic("SemVer.new: patch version is not a valid integer: 12.2");
  });

  test("util.SemVer: compare: less than", () => {
    const sv = new util.SemVer(1, 5, 12);
    const svMajor = new util.SemVer(2, 5, 12);
    const svMinor = new util.SemVer(1, 7, 12);
    const svPatch = new util.SemVer(1, 5, 20);
    expect(sv.compare(svMajor)).toBe(-1);
    expect(sv.compare(svMinor)).toBe(-1);
    expect(sv.compare(svPatch)).toBe(-1);
  });

  test("util.SemVer: compare: greater than", () => {
    const sv = new util.SemVer(1, 5, 12);
    const svMajor = new util.SemVer(0, 5, 12);
    const svMinor = new util.SemVer(1, 3, 12);
    const svPatch = new util.SemVer(1, 5, 8);
    expect(sv.compare(svMajor)).toBe(1);
    expect(sv.compare(svMinor)).toBe(1);
    expect(sv.compare(svPatch)).toBe(1);
  });

  test("util.SemVer: compare: equal", () => {
    const sv = new util.SemVer(1, 5, 12);
    const svOther = new util.SemVer(1, 5, 12);
    expect(sv.compare(svOther)).toBe(0);
  });

  test("util.SemVer: incrementMajor", () => {
    const sv = new util.SemVer(1, 5, 12);
    const incSv = sv.incrementMajor();
    expect(incSv.major).toBe(2);
    expect(incSv.minor).toBe(0);
    expect(incSv.patch).toBe(0);
    expect(incSv.toString()).toBe("2.0.0");
  });

  test("util.SemVer: incrementMinor", () => {
    const sv = new util.SemVer(1, 5, 12);
    const incSv = sv.incrementMinor();
    expect(incSv.major).toBe(1);
    expect(incSv.minor).toBe(6);
    expect(incSv.patch).toBe(0);
    expect(incSv.toString()).toBe("1.6.0");
  });

  test("util.SemVer: incrementPatch", () => {
    const sv = new util.SemVer(1, 5, 12);
    const incSv = sv.incrementPatch();
    expect(incSv.major).toBe(1);
    expect(incSv.minor).toBe(5);
    expect(incSv.patch).toBe(13);
    expect(incSv.toString()).toBe("1.5.13");
  });

  test("util.SemVar.parse", () => {
    const r = util.SemVer.parse("1.5.12");
    const sv = r.unwrap();
    expect(sv.major).toBe(1);
    expect(sv.minor).toBe(5);
    expect(sv.patch).toBe(12);
  });

  test("util.SemVar.parse: error", () => {
    const r = util.SemVer.parse("1.10.10.3");
    const err = r.unwrapFailure();
    expect(err.error()).toBe("SemVer.Parse: Invalid semver string: 1.10.10.3");
  });

  test("util.SemVer.mustParse", () => {
    const sv = util.SemVer.mustParse("1.5.12");
    expect(sv.major).toBe(1);
    expect(sv.minor).toBe(5);
    expect(sv.patch).toBe(12);
  });

  test("util.SemVer.mustParse: panic", () => {
    expect(() => {
      util.SemVer.mustParse("1.10.10.3");
    }).toPanic("SemVer.Parse: Invalid semver string: 1.10.10.3");
  });

  test("util.SemVer: inspect", () => {
    const sv = new util.SemVer(1, 5, 12);
    const s = inspect(sv);
    expect(s).toBe("SemVer(1.5.12)");
  });
});
