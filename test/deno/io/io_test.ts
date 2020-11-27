import * as testing from "../testing.ts";
import { Result, bytes, io, strings } from "../../../dist/deno/mod.ts";

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

Deno.test("io.copy", async () => {
  const rb = new bytes.DynamicBuffer("hello, world.");
  const wb = new bytes.DynamicBuffer();
  const result = await io.copy(wb, rb);
  testing.assertEquals(result.unwrap(), 13);
  testing.assertEquals(wb.toString(), "hello, world.");
});

Deno.test("io.copySync", () => {
  const rb = new bytes.DynamicBuffer("hello, world.");
  const wb = new bytes.DynamicBuffer();
  const result = io.copySync(wb, rb);
  testing.assertEquals(result.unwrap(), 13);
  testing.assertEquals(wb.toString(), "hello, world.");
});

Deno.test("io.copy: negative", async () => {
  const rb = new bytes.DynamicBuffer("hello");
  const wb = new bytes.DynamicBuffer();
  let result = await io.copy(wb, new io.LimitedReader(rb, -1));
  testing.assertEquals(result.unwrap(), 0);
  testing.assertEquals(wb.toString(), "");

  result = await io.copy(wb, rb, { size: -1 });
  testing.assertEquals(result.unwrap(), 0);
  testing.assertEquals(wb.toString(), "");
});

Deno.test("io.copySync: negative", () => {
  const rb = new bytes.DynamicBuffer("hello");
  const wb = new bytes.DynamicBuffer();
  let result = io.copySync(wb, new io.LimitedReaderSync(rb, -1));
  testing.assertEquals(result.unwrap(), 0);
  testing.assertEquals(wb.toString(), "");

  result = io.copySync(wb, rb, { size: -1 });
  testing.assertEquals(result.unwrap(), 0);
  testing.assertEquals(wb.toString(), "");
});

Deno.test("io.copy: buf", async () => {
  const rb = new bytes.DynamicBuffer("hello, world.");
  const wb = new bytes.DynamicBuffer();
  // Tiny buffer to keep it honest.
  const result = await io.copy(wb, rb, { buf: new Uint8Array(1) });
  testing.assertEquals(result.unwrap(), 13);
  testing.assertEquals(wb.toString(), "hello, world.");
});

Deno.test("io.copySync: buf", () => {
  const rb = new bytes.DynamicBuffer("hello, world.");
  const wb = new bytes.DynamicBuffer();
  const result = io.copySync(wb, rb, { buf: new Uint8Array(1) });
  testing.assertEquals(result.unwrap(), 13);
  testing.assertEquals(wb.toString(), "hello, world.");
});

Deno.test("io.copy: size", async () => {
  const rb = new bytes.DynamicBuffer("hello, world.");
  const wb = new bytes.DynamicBuffer();
  // Tiny buffer to keep it honest.
  const result = await io.copy(wb, rb, { size: 5 });
  testing.assertEquals(result.unwrap(), 5);
  testing.assertEquals(wb.toString(), "hello");
});

Deno.test("io.copySync: size", () => {
  const rb = new bytes.DynamicBuffer("hello, world.");
  const wb = new bytes.DynamicBuffer();
  const result = io.copySync(wb, rb, { size: 5 });
  testing.assertEquals(result.unwrap(), 5);
  testing.assertEquals(wb.toString(), "hello");
});

Deno.test("io.copy: size EOF", async () => {
  const b = new bytes.DynamicBuffer();
  let result = await io.copy(b, new strings.Reader("foo"), { size: 3 });
  testing.assertEquals(result.unwrap(), 3);

  result = await io.copy(b, new strings.Reader("foo"), { size: 4 });
  testing.assertStrictEquals(result.unwrapFailure(), io.eof);
});

Deno.test("io.copySync: size EOF", () => {
  const b = new bytes.DynamicBuffer();
  let result = io.copySync(b, new strings.Reader("foo"), { size: 3 });
  testing.assertEquals(result.unwrap(), 3);

  result = io.copySync(b, new strings.Reader("foo"), { size: 4 });
  testing.assertStrictEquals(result.unwrapFailure(), io.eof);
});
