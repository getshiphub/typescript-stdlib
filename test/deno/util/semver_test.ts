import * as testing from "../testing.ts";
import { util } from "../../../dist/deno/mod.ts";

Deno.test("util.SemVer: new", () => {
  const sv = new util.SemVer(1, 5, 12);
  testing.assertEquals(sv.major, 1);
  testing.assertEquals(sv.minor, 5);
  testing.assertEquals(sv.patch, 12);
  testing.assertEquals(sv.toString(), "1.5.12");
});

Deno.test("util.SemVer: new: major not an integer", () => {
  testing.assertPanics(() => {
    new util.SemVer(1.2, 5, 12);
  }, "SemVer.new: major version is not a valid integer: 1.2");
});

Deno.test("util.SemVer: new: minor not an integer", () => {
  testing.assertPanics(() => {
    new util.SemVer(1, 5.2, 12);
  }, "SemVer.new: minor version is not a valid integer: 5.2");
});

Deno.test("util.SemVer: new: patch not an integer", () => {
  testing.assertPanics(() => {
    new util.SemVer(1, 5, 12.2);
  }, "SemVer.new: patch version is not a valid integer: 12.2");
});

Deno.test("util.SemVer: compare: less than", () => {
  const sv = new util.SemVer(1, 5, 12);
  const svMajor = new util.SemVer(2, 5, 12);
  const svMinor = new util.SemVer(1, 7, 12);
  const svPatch = new util.SemVer(1, 5, 20);
  testing.assertEquals(sv.compare(svMajor), -1);
  testing.assertEquals(sv.compare(svMinor), -1);
  testing.assertEquals(sv.compare(svPatch), -1);
});

Deno.test("util.SemVer: compare: greater than", () => {
  const sv = new util.SemVer(1, 5, 12);
  const svMajor = new util.SemVer(0, 5, 12);
  const svMinor = new util.SemVer(1, 3, 12);
  const svPatch = new util.SemVer(1, 5, 8);
  testing.assertEquals(sv.compare(svMajor), 1);
  testing.assertEquals(sv.compare(svMinor), 1);
  testing.assertEquals(sv.compare(svPatch), 1);
});

Deno.test("util.SemVer: compare: equal", () => {
  const sv = new util.SemVer(1, 5, 12);
  const svOther = new util.SemVer(1, 5, 12);
  testing.assertEquals(sv.compare(svOther), 0);
});

Deno.test("util.SemVer: incrementMajor", () => {
  const sv = new util.SemVer(1, 5, 12);
  const incSv = sv.incrementMajor();
  testing.assertEquals(incSv.major, 2);
  testing.assertEquals(incSv.minor, 0);
  testing.assertEquals(incSv.patch, 0);
  testing.assertEquals(incSv.toString(), "2.0.0");
});

Deno.test("util.SemVer: incrementMinor", () => {
  const sv = new util.SemVer(1, 5, 12);
  const incSv = sv.incrementMinor();
  testing.assertEquals(incSv.major, 1);
  testing.assertEquals(incSv.minor, 6);
  testing.assertEquals(incSv.patch, 0);
  testing.assertEquals(incSv.toString(), "1.6.0");
});

Deno.test("util.SemVer: incrementPatch", () => {
  const sv = new util.SemVer(1, 5, 12);
  const incSv = sv.incrementPatch();
  testing.assertEquals(incSv.major, 1);
  testing.assertEquals(incSv.minor, 5);
  testing.assertEquals(incSv.patch, 13);
  testing.assertEquals(incSv.toString(), "1.5.13");
});

Deno.test("util.SemVar.parse", () => {
  const r = util.SemVer.parse("1.5.12");
  const sv = r.unwrap();
  testing.assertEquals(sv.major, 1);
  testing.assertEquals(sv.minor, 5);
  testing.assertEquals(sv.patch, 12);
});

Deno.test("util.SemVar.parse: error", () => {
  const r = util.SemVer.parse("1.10.10.3");
  const err = r.unwrapFailure();
  testing.assertEquals(err.error(), "SemVer.Parse: Invalid semver string: 1.10.10.3");
});

Deno.test("util.SemVer.mustParse", () => {
  const sv = util.SemVer.mustParse("1.5.12");
  testing.assertEquals(sv.major, 1);
  testing.assertEquals(sv.minor, 5);
  testing.assertEquals(sv.patch, 12);
});

Deno.test("util.SemVer.mustParse: panic", () => {
  testing.assertPanics(() => {
    util.SemVer.mustParse("1.10.10.3");
  }, "SemVer.Parse: Invalid semver string: 1.10.10.3");
});

Deno.test("util.SemVer: inspect", () => {
  const sv = new util.SemVer(1, 5, 12);
  const s = Deno.inspect(sv);
  testing.assertEquals(s, "SemVer(1.5.12)");
});
