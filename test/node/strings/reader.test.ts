import { io, strings } from "../../../src";

describe("strings/reader.ts", () => {
  test("strings.Reader: read all", () => {
    const r = new strings.Reader("0123456789");
    const p = new Uint8Array(10);

    let result = r.readSync(p);
    const expected = [0x30, 0x31, 0x32, 0x33, 0x34, 0x35, 0x36, 0x37, 0x38, 0x39];
    expect(result.unwrap()).toBe(10);
    expect(p).toEqual(new Uint8Array(expected));
    expect(r.length).toBe(0);
    expect(r.size).toBe(10);

    result = r.readSync(p);
    expect(result.unwrapFailure()).toBe(io.eof);
  });

  test("strings.Reader: read chunks", () => {
    const r = new strings.Reader("0123456789");
    const p = new Uint8Array(5);

    let result = r.readSync(p);
    let expected = [0x30, 0x31, 0x32, 0x33, 0x34];
    expect(result.unwrap()).toBe(5);
    expect(p).toEqual(new Uint8Array(expected));
    expect(r.length).toBe(5);
    expect(r.size).toBe(10);

    result = r.readSync(p);
    expected = [0x35, 0x36, 0x37, 0x38, 0x39];
    expect(result.unwrap()).toBe(5);
    expect(p).toEqual(new Uint8Array(expected));
    expect(r.length).toBe(0);
    expect(r.size).toBe(10);

    result = r.readSync(p);
    expect(result.unwrapFailure()).toBe(io.eof);
  });

  test("strings.Reader: async", async () => {
    const r = new strings.Reader("0123456789");
    const p = new Uint8Array(10);

    let result = await r.read(p);
    const expected = [0x30, 0x31, 0x32, 0x33, 0x34, 0x35, 0x36, 0x37, 0x38, 0x39];
    expect(result.unwrap()).toBe(10);
    expect(p).toEqual(new Uint8Array(expected));
    expect(r.length).toBe(0);
    expect(r.size).toBe(10);

    result = await r.read(p);
    expect(result.unwrapFailure()).toBe(io.eof);
  });
});
