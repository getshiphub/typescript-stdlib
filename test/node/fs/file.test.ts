import os from "os";
import path from "path";

import { fs } from "../../../src";

function createFixture(tmpDir: string): string {
  const rootDir = path.join(tmpDir, `test-${Date.now()}`);
  fs.mkdirSync(rootDir).unwrap();
  fs.writeFileSync(path.join(rootDir, "file1"), "hello").unwrap();
  fs.writeFileSync(path.join(rootDir, "file2"), "world").unwrap();

  const subDir = path.join(rootDir, "subdir");
  fs.mkdirSync(subDir).unwrap();
  fs.writeFileSync(path.join(subDir, "file3"), "foo").unwrap();

  return rootDir;
}

describe("fs/file.ts", () => {
  let tmpDir: string;

  beforeEach(async () => {
    const r = await fs.mkdtemp(`${os.tmpdir()}${path.sep}`);
    tmpDir = r.unwrap();
  });

  afterEach(async () => {
    await fs.removeAll(tmpDir);
  });

  test("fs.fileExists: false", async () => {
    const exists = await fs.fileExists(path.join(tmpDir, "foo.ts"));
    expect(exists).toBe(false);
  });

  test("fs.fileExists: true", async () => {
    const p = path.join(tmpDir, "foo.ts");
    await fs.writeFile(p, "const n = 1;");
    const exists = await fs.fileExists(p);
    expect(exists).toBe(true);
  });

  test("fs.fileExistsSync: false", () => {
    const exists = fs.fileExistsSync(path.join(tmpDir, "foo.ts"));
    expect(exists).toBe(false);
  });

  test("fs.fileExistsSync: true", () => {
    const p = path.join(tmpDir, "foo.ts");
    fs.writeFileSync(p, "const n = 1;");
    const exists = fs.fileExistsSync(p);
    expect(exists).toBe(true);
  });

  test("fs.remove: file", async () => {
    const p = path.join(tmpDir, "foo.ts");
    fs.writeFileSync(p, "const n = 1;").unwrap();
    const r = await fs.remove(p);
    expect(r).toBeSuccess();
    expect(fs.fileExistsSync(p)).toBe(false);
  });

  test("fs.remove: empty directory", async () => {
    const p = path.join(tmpDir, "bar");
    fs.mkdirSync(p).unwrap();
    const r = await fs.remove(p);
    expect(r).toBeSuccess();
    expect(fs.fileExistsSync(p)).toBe(false);
  });

  test("fs.remove: not empty directory", async () => {
    const p = path.join(tmpDir, "bar");
    fs.mkdirSync(p).unwrap();
    const fp = path.join(p, "foo.ts");
    fs.writeFileSync(fp, "const n = 1;").unwrap();
    const r = await fs.remove(p);
    expect(r).toBeFailure();
    expect(fs.fileExistsSync(p)).toBe(true);
  });

  test("fs.removeSync: file", () => {
    const p = path.join(tmpDir, "foo.ts");
    fs.writeFileSync(p, "const n = 1;").unwrap();
    const r = fs.removeSync(p);
    expect(r).toBeSuccess();
    expect(fs.fileExistsSync(p)).toBe(false);
  });

  test("fs.removeSync: empty directory", () => {
    const p = path.join(tmpDir, "bar");
    fs.mkdirSync(p).unwrap();
    const r = fs.removeSync(p);
    expect(r).toBeSuccess();
    expect(fs.fileExistsSync(p)).toBe(false);
  });

  test("fs.removeSync: not empty directory", () => {
    const p = path.join(tmpDir, "bar");
    fs.mkdirSync(p).unwrap();
    const fp = path.join(p, "foo.ts");
    fs.writeFileSync(fp, "const n = 1;").unwrap();
    const r = fs.removeSync(p);
    expect(r).toBeFailure();
    expect(fs.fileExistsSync(p)).toBe(true);
  });

  test("fs.removeAll", async () => {
    const p = createFixture(tmpDir);
    const r = await fs.removeAll(p);
    expect(r).toBeSuccess();
    expect(fs.fileExistsSync(p)).toBe(false);
  });

  test("fs.removeAll: file", async () => {
    const p = path.join(tmpDir, "foo.ts");
    fs.writeFileSync(p, "const n = 1;").unwrap();
    const r = await fs.removeAll(p);
    expect(r).toBeSuccess();
    expect(fs.fileExistsSync(p)).toBe(false);
  });

  test("fs.removeAll: does not exist", async () => {
    const p = path.join(tmpDir, "foo");
    const r = await fs.removeAll(p);
    expect(r).toBeSuccess();
  });

  test("fs.removeAllSync", () => {
    const p = createFixture(tmpDir);
    const r = fs.removeAllSync(p);
    expect(r).toBeSuccess();
    expect(fs.fileExistsSync(p)).toBe(false);
  });

  test("fs.removeAllSync: file", () => {
    const p = path.join(tmpDir, "foo.ts");
    fs.writeFileSync(p, "const n = 1;").unwrap();
    const r = fs.removeAllSync(p);
    expect(r).toBeSuccess();
    expect(fs.fileExistsSync(p)).toBe(false);
  });

  test("fs.removeAllSync: does not exist", () => {
    const p = path.join(tmpDir, "foo");
    const r = fs.removeAllSync(p);
    expect(r).toBeSuccess();
  });
});
