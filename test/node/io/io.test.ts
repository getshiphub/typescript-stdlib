import { Result, bytes, io } from "../../../src";

// Writer that doesn't implement StringWriter
class MockWriter {
  #buf = new bytes.DynamicBuffer();

  bytes(): Uint8Array {
    return this.#buf.bytes();
  }

  async write(p: Uint8Array): Promise<Result<number, error>> {
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
});
