import { Result, bytes, io, strings } from "../../../src";

// Writer that doesn't implement StringWriter
class MockWriter {
  #buf = new bytes.DynamicBuffer();

  bytes(): Uint8Array {
    return this.#buf.bytes();
  }

  write(p: Uint8Array): Promise<Result<number, error>> {
    return this.#buf.write(p);
  }

  writeSync(p: Uint8Array): Result<number, error> {
    return this.#buf.writeSync(p);
  }
}

describe("io/io.ts", () => {
  test("io.devNull: write", async () => {
    const data = new Uint8Array([0x1, 0x2, 0x3]);
    const result = await io.devNull.write(data);
    expect(result.unwrap()).toBe(3);
  });

  test("io.devNull: writeSync", () => {
    const data = new Uint8Array([0x1, 0x2, 0x3]);
    const result = io.devNull.writeSync(data);
    expect(result.unwrap()).toBe(3);
  });

  test.each([
    ["Writer", new MockWriter(), "hello world"],
    ["StringWriter", new bytes.DynamicBuffer(), "hello world"],
  ])("io.writeString: %s", async (_name, w, s) => {
    const result = await io.writeString(w, s);
    const data = new TextEncoder().encode(s);
    expect(result.unwrap()).toBe(data.byteLength);
    expect(w.bytes()).toEqual(data);
  });

  test.each([
    ["WriterSync", new MockWriter(), "hello world"],
    ["StringWriterSync", new bytes.DynamicBuffer(), "hello world"],
  ])("io.writeStringSync: %s", (_name, w, s) => {
    const result = io.writeStringSync(w, s);
    const data = new TextEncoder().encode(s);
    expect(result.unwrap()).toBe(data.byteLength);
    expect(w.bytes()).toEqual(data);
  });

  test("io.copy", async () => {
    const rb = new bytes.DynamicBuffer("hello, world.");
    const wb = new bytes.DynamicBuffer();
    const result = await io.copy(wb, rb);
    expect(result.unwrap()).toBe(13);
    expect(wb.toString()).toBe("hello, world.");
  });

  test("io.copySync", () => {
    const rb = new bytes.DynamicBuffer("hello, world.");
    const wb = new bytes.DynamicBuffer();
    const result = io.copySync(wb, rb);
    expect(result.unwrap()).toBe(13);
    expect(wb.toString()).toBe("hello, world.");
  });

  test("io.copy: negative", async () => {
    const rb = new bytes.DynamicBuffer("hello");
    const wb = new bytes.DynamicBuffer();
    let result = await io.copy(wb, new io.LimitedReader(rb, -1));
    expect(result.unwrap()).toBe(0);
    expect(wb.toString()).toBe("");

    result = await io.copy(wb, rb, { size: -1 });
    expect(result.unwrap()).toBe(0);
    expect(wb.toString()).toBe("");
  });

  test("io.copySync: negative", () => {
    const rb = new bytes.DynamicBuffer("hello");
    const wb = new bytes.DynamicBuffer();
    let result = io.copySync(wb, new io.LimitedReaderSync(rb, -1));
    expect(result.unwrap()).toBe(0);
    expect(wb.toString()).toBe("");

    result = io.copySync(wb, rb, { size: -1 });
    expect(result.unwrap()).toBe(0);
    expect(wb.toString()).toBe("");
  });

  test("io.copy: buf", async () => {
    const rb = new bytes.DynamicBuffer("hello, world.");
    const wb = new bytes.DynamicBuffer();
    // Tiny buffer to keep it honest.
    const result = await io.copy(wb, rb, { buf: new Uint8Array(1) });
    expect(result.unwrap()).toBe(13);
    expect(wb.toString()).toBe("hello, world.");
  });

  test("io.copySync: buf", () => {
    const rb = new bytes.DynamicBuffer("hello, world.");
    const wb = new bytes.DynamicBuffer();
    // Tiny buffer to keep it honest.
    const result = io.copySync(wb, rb, { buf: new Uint8Array(1) });
    expect(result.unwrap()).toBe(13);
    expect(wb.toString()).toBe("hello, world.");
  });

  test("io.copy: size", async () => {
    const rb = new bytes.DynamicBuffer("hello, world.");
    const wb = new bytes.DynamicBuffer();
    const result = await io.copy(wb, rb, { size: 5 });
    expect(result.unwrap()).toBe(5);
    expect(wb.toString()).toBe("hello");
  });

  test("io.copySync: size", () => {
    const rb = new bytes.DynamicBuffer("hello, world.");
    const wb = new bytes.DynamicBuffer();
    const result = io.copySync(wb, rb, { size: 5 });
    expect(result.unwrap()).toBe(5);
    expect(wb.toString()).toBe("hello");
  });

  test("io.copy: size EOF", async () => {
    const b = new bytes.DynamicBuffer();
    let result = await io.copy(b, new strings.Reader("foo"), { size: 3 });
    expect(result.unwrap()).toBe(3);

    result = await io.copy(b, new strings.Reader("foo"), { size: 4 });
    expect(result.unwrapFailure()).toBe(io.eof);
  });

  test("io.copySync: size EOF", () => {
    const b = new bytes.DynamicBuffer();
    let result = io.copySync(b, new strings.Reader("foo"), { size: 3 });
    expect(result.unwrap()).toBe(3);

    result = io.copySync(b, new strings.Reader("foo"), { size: 4 });
    expect(result.unwrapFailure()).toBe(io.eof);
  });
});
