import * as testing from "../testing.ts";
import { Result, bytes, io } from "../../../dist/deno/mod.ts";

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

Deno.test("io.devNull: write", async () => {
  const data = new Uint8Array([0x1, 0x2, 0x3]);
  const result = await io.devNull.write(data);
  testing.assertEquals(result.unwrap(), 3);
});

Deno.test("io.devNull: writeSync", () => {
  const data = new Uint8Array([0x1, 0x2, 0x3]);
  const result = io.devNull.writeSync(data);
  testing.assertEquals(result.unwrap(), 3);
});

Deno.test("io.writeString", async () => {
  const tests = [
    [new MockWriter(), "hello world"],
    [new bytes.DynamicBuffer(), "hello world"],
  ] as const;

  for (const [w, s] of tests) {
    const result = await io.writeString(w, s);
    const data = new TextEncoder().encode(s);
    testing.assertEquals(result.unwrap(), data.byteLength);
    testing.assertEquals(w.bytes(), data);
  }
});

Deno.test("io.writeStringSync", () => {
  const tests = [
    [new MockWriter(), "hello world"],
    [new bytes.DynamicBuffer(), "hello world"],
  ] as const;

  for (const [w, s] of tests) {
    const result = io.writeStringSync(w, s);
    const data = new TextEncoder().encode(s);
    testing.assertEquals(result.unwrap(), data.byteLength);
    testing.assertEquals(w.bytes(), data);
  }
});
