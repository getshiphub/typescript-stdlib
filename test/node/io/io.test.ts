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

  test("io.ReaderIterator", async () => {
    const r = new strings.Reader("hello, world.");
    const it = new io.ReaderIterator(r);
    const chunks: number[][] = [];
    for await (const chunk of it) {
      chunks.push([...chunk]);
    }

    expect(chunks).toEqual([[104, 101, 108, 108, 111, 44, 32, 119, 111, 114, 108, 100, 46]]);
    expect(it.err()).toBeUndefined();
  });

  test("io.ReaderIterator: multiple chunks", async () => {
    const r = new strings.Reader("hello, world.");
    const it = new io.ReaderIterator(r, { buf: new Uint8Array(5) });
    const chunks: number[][] = [];
    for await (const chunk of it) {
      chunks.push([...chunk]);
    }

    expect(chunks).toEqual([
      [104, 101, 108, 108, 111],
      [44, 32, 119, 111, 114],
      [108, 100, 46],
    ]);
    expect(it.err()).toBeUndefined();
  });

  test("io.ReaderSyncIterator", () => {
    const r = new strings.Reader("hello, world.");
    const it = new io.ReaderSyncIterator(r);
    const chunks: number[][] = [];
    for (const chunk of it) {
      chunks.push([...chunk]);
    }

    expect(chunks).toEqual([[104, 101, 108, 108, 111, 44, 32, 119, 111, 114, 108, 100, 46]]);
    expect(it.err()).toBeUndefined();
  });

  test("io.ReaderSyncIterator: multiple chunks", () => {
    const r = new strings.Reader("hello, world.");
    const it = new io.ReaderSyncIterator(r, { buf: new Uint8Array(5) });
    const chunks: number[][] = [];
    for (const chunk of it) {
      chunks.push([...chunk]);
    }

    expect(chunks).toEqual([
      [104, 101, 108, 108, 111],
      [44, 32, 119, 111, 114],
      [108, 100, 46],
    ]);
    expect(it.err()).toBeUndefined();
  });

  const readAllStr = `Lorem ipsum dolor sit amet, consectetur adipiscing elit.
Quisque tristique justo vitae urna dignissim, vel fringilla nisi condimentum.
Nunc condimentum, diam quis feugiat maximus, augue nisl convallis felis, et tincidunt mi mauris ut ex.
Nulla ut sem neque.
Duis blandit eget neque quis blandit.
Phasellus eget molestie tellus, vel dapibus dui.
Vivamus molestie enim nec risus eleifend, sit amet finibus lectus mattis.
Nam eu aliquam urna, ut accumsan lectus.
Vestibulum sed est nulla.
Duis consequat egestas nisl, a cursus purus blandit ut.
Suspendisse lobortis mi eu suscipit consequat.`;

  test("io.readAll", async () => {
    const r = new strings.Reader(readAllStr);
    const result = await io.readAll(r);
    expect(result.unwrap()).toEqual(new TextEncoder().encode(readAllStr));
  });

  test("io.readAllSync", () => {
    const r = new strings.Reader(readAllStr);
    const result = io.readAllSync(r);
    expect(result.unwrap()).toEqual(new TextEncoder().encode(readAllStr));
  });
});
