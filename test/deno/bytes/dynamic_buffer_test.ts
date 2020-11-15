import * as testing from "../testing.ts";
import { symbols, bytes, hex, util } from "../../../dist/deno/mod.ts";

Deno.test("bytes.DynamicBuffer: empty", () => {
  const buf = new bytes.DynamicBuffer();
  testing.assertEquals(buf.isEmpty, true);
  testing.assertEquals(buf.length, 0);
  testing.assertEquals(buf.capacity, 0);
  testing.assertEquals(buf.bytes(), new Uint8Array(0));
  testing.assertEquals(buf.toString(), "");
});

Deno.test("bytes.DynamicBuffer: from Uint8Array", () => {
  const b = new Uint8Array([0x61, 0x62, 0x63]);
  const buf = new bytes.DynamicBuffer(b);
  testing.assertEquals(buf.isEmpty, false);
  testing.assertEquals(buf.length, 3);
  testing.assertEquals(buf.capacity, 3);
  testing.assertEquals(buf.bytes(), b);
  testing.assertEquals(buf.toString(), "abc");
});

Deno.test("bytes.DynamicBuffer: from string", () => {
  const buf = new bytes.DynamicBuffer("foobar");
  testing.assertEquals(buf.isEmpty, false);
  testing.assertEquals(buf.length, 6);
  testing.assertEquals(buf.capacity, 6);
  testing.assertEquals(Array.from(buf.bytes()), [0x66, 0x6f, 0x6f, 0x62, 0x61, 0x72]);
  testing.assertEquals(buf.toString(), "foobar");
});

Deno.test("bytes.DynamicBuffer: truncate: resets the buffer when n is 0", () => {
  const b = hex.decodeString("10ffab23ef5d").unwrap();
  const buf = new bytes.DynamicBuffer(b.buffer);
  testing.assertEquals(buf.length, 6);
  testing.assertEquals(buf.capacity, 6);
  buf.truncate(0);
  testing.assertEquals(buf.length, 0);
  testing.assertEquals(buf.capacity, 6);
});

Deno.test("bytes.DynamicBuffer: truncate: all but the first byte", () => {
  const b = hex.decodeString("10ffab23ef5d").unwrap();
  const buf = new bytes.DynamicBuffer(b.buffer);
  testing.assertEquals(buf.length, 6);
  testing.assertEquals(buf.capacity, 6);
  buf.truncate(3);
  testing.assertEquals(buf.length, 3);
  testing.assertEquals(hex.encodeToString(buf.bytes()), "10ffab");
  testing.assertEquals(buf.capacity, 6);
});

Deno.test("bytes.DynamicBuffer: truncate: panics if n is out of range", () => {
  const b = hex.decodeString("10ffab23ef5d").unwrap();
  const buf = new bytes.DynamicBuffer(b.buffer);
  testing.assertPanics(() => {
    buf.truncate(9);
  }, "DynamicBuffer: truncation out of range");
});

Deno.test("bytes.DynamicBuffer: reset", () => {
  const b = hex.decodeString("10ffab23ef5d").unwrap();
  const buf = new bytes.DynamicBuffer(b.buffer);
  testing.assertEquals(buf.length, 6);
  testing.assertEquals(buf.capacity, 6);
  buf.reset();
  testing.assertEquals(buf.length, 0);
  testing.assertEquals(buf.capacity, 6);
});

Deno.test("bytes.DynamicBuffer: grow", () => {
  const b = hex.decodeString("10ffab23ef5d").unwrap();
  const buf = new bytes.DynamicBuffer(b.buffer);
  testing.assertEquals(buf.length, 6);
  testing.assertEquals(buf.capacity, 6);
  buf.grow(8);
  testing.assertEquals(buf.length, 6);
  testing.assert(buf.capacity >= 12);
});

Deno.test("bytes.DynamicBuffer: grow: n is negative", () => {
  const b = hex.decodeString("10ffab23ef5d").unwrap();
  const buf = new bytes.DynamicBuffer(b.buffer);
  testing.assertPanics(() => {
    buf.grow(-1);
  }, "DynamicBuffer.grow: negative count");
});

Deno.test("bytes.DynamicBuffer: write", () => {
  const src = hex.decodeString("10ffab23ef5d").unwrap();
  const buf = new bytes.DynamicBuffer(src);
  buf.write(new Uint8Array([0x10, 0xff, 0xab]));
  testing.assertEquals(buf.length, 9);
  testing.assertEquals(hex.encodeToString(buf.bytes()), "10ffab23ef5d10ffab");
});

Deno.test("bytes.DynamicBuffer: writeString", () => {
  const buf = new bytes.DynamicBuffer("Hello");
  buf.writeString(" world!");
  testing.assertEquals(buf.toString(), "Hello world!");
});

Deno.test("bytes.DynamicBuffer: writeByte", () => {
  const src = hex.decodeString("10ffab23ef5d").unwrap();
  const buf = new bytes.DynamicBuffer(src);
  buf.writeByte(0x10);
  testing.assertEquals(buf.length, 7);
  testing.assertEquals(hex.encodeToString(buf.bytes()), "10ffab23ef5d10");
});

Deno.test("bytes.DynamicBuffer: writeByte: invalid byte", () => {
  const src = hex.decodeString("10ffab23ef5d").unwrap();
  const buf = new bytes.DynamicBuffer(src);
  testing.assertPanics(() => {
    buf.writeByte(1.1);
  }, "DynamicBuffer.writeByte: c is not a valid byte");
});

Deno.test("bytes.DynamicBuffer: read", () => {
  const src = hex.decodeString("10ffab23ef5d").unwrap();
  const buf = new bytes.DynamicBuffer(src);
  const b = new Uint8Array(4);
  const r = buf.read(b);
  testing.assertEquals(r.unwrap(), 4);
  testing.assertEquals(hex.encodeToString(b), "10ffab23");
  testing.assertEquals(buf.length, 2);
});

Deno.test("bytes.DynamicBuffer: read: all the bytes", () => {
  const src = hex.decodeString("10ffab23ef5d").unwrap();
  const buf = new bytes.DynamicBuffer(src);
  const b = new Uint8Array(10);
  const r = buf.read(b);
  testing.assertEquals(r.unwrap(), 6);
  testing.assertEquals(hex.encodeToString(b), "10ffab23ef5d00000000");
  testing.assertEquals(buf.length, 0);
});

Deno.test("bytes.DynamicBuffer: read: empty", () => {
  const buf = new bytes.DynamicBuffer();
  const b = new Uint8Array(10);
  const r = buf.read(b);
  testing.assertEquals(r.unwrapFailure(), bytes.eof);
});

Deno.test("bytes.DynamicBuffer: next", () => {
  const src = hex.decodeString("10ffab23ef5d").unwrap();
  const buf = new bytes.DynamicBuffer(src);
  const b = buf.next(4);
  testing.assertEquals(b.length, 4);
  testing.assertEquals(hex.encodeToString(b), "10ffab23");
  testing.assertEquals(buf.length, 2);
});

Deno.test("bytes.DynamicBuffer: next: all bytes", () => {
  const src = hex.decodeString("10ffab23ef5d").unwrap();
  const buf = new bytes.DynamicBuffer(src);
  const b = buf.next(10);
  testing.assertEquals(b.length, 6);
  testing.assertEquals(hex.encodeToString(b), "10ffab23ef5d");
  testing.assertEquals(buf.length, 0);
});

Deno.test("bytes.DynamicBuffer: readByte", () => {
  const src = hex.decodeString("10ffab23ef5d").unwrap();
  const buf = new bytes.DynamicBuffer(src);
  const r = buf.readByte();
  testing.assertEquals(r.unwrap(), 0x10);
  testing.assertEquals(buf.length, 5);
});

Deno.test("bytes.DynamicBuffer: readByte: empty", () => {
  const buf = new bytes.DynamicBuffer();
  const r = buf.readByte();
  testing.assertEquals(r.unwrapFailure(), bytes.eof);
});

Deno.test("bytes.DynamicBuffer: readBytes", () => {
  const src = hex.decodeString("10ffab23ef5d").unwrap();
  const buf = new bytes.DynamicBuffer(src);
  const [b, err] = buf.readBytes(0xab);
  testing.assertEquals(err, undefined);
  testing.assertEquals(hex.encodeToString(b), "10ffab");
  testing.assertEquals(buf.length, 3);
});

Deno.test("bytes.DynamicBuffer: readBytes: delim doesn't exist", () => {
  const src = hex.decodeString("10ffab23ef5d").unwrap();
  const buf = new bytes.DynamicBuffer(src);
  const [b, err] = buf.readBytes(0xcc);
  testing.assertEquals(err, bytes.eof);
  testing.assertEquals(hex.encodeToString(b), "10ffab23ef5d");
  testing.assertEquals(buf.length, 0);
});

Deno.test("bytes.DynamicBuffer: readBytes: delim is not a valid byte", () => {
  const src = hex.decodeString("10ffab23ef5d").unwrap();
  const buf = new bytes.DynamicBuffer(src);
  testing.assertPanics(() => {
    buf.readBytes(1.1);
  }, "DynamicBuffer.readBytes: delim is not a valid byte");
});

Deno.test("bytes.DynamicBuffer: readString", () => {
  const buf = new bytes.DynamicBuffer("foobar");
  const [s, err] = buf.readString(0x62);
  testing.assertEquals(err, undefined);
  testing.assertEquals(s, "foob");
  testing.assertEquals(buf.length, 2);
});

Deno.test("bytes.DynamicBuffer: readString: delim is not a valid byte", () => {
  const src = hex.decodeString("10ffab23ef5d").unwrap();
  const buf = new bytes.DynamicBuffer(src);
  testing.assertPanics(() => {
    buf.readString(1.1);
  }, "DynamicBuffer.readBytes: delim is not a valid byte");
});

Deno.test("bytes.DynamicBuffer: iterating", () => {
  const src = hex.decodeString("10ffab23ef5d").unwrap();
  const buf = new bytes.DynamicBuffer(src);
  const arr: number[] = [];
  for (const b of buf) {
    arr.push(b);
  }

  testing.assertEquals(arr, [0x10, 0xff, 0xab, 0x23, 0xef, 0x5d]);
  testing.assertEquals(buf.length, 0);
});

Deno.test("bytes.DynamicBuffer: copy", () => {
  const buf = new bytes.DynamicBuffer("abc");
  const bufCopy = util.copy(buf);
  bufCopy.writeString("def");
  testing.assertNotStrictEquals(buf, bufCopy);
  testing.assertEquals(buf.toString(), "abc");
  testing.assertEquals(bufCopy.toString(), "abcdef");
});

Deno.test("bytes.DynamicBuffer: inspect", () => {
  const src = hex.decodeString("10ffab23ef5d").unwrap();
  const buf = new bytes.DynamicBuffer(src);
  const s = Deno.inspect(buf);
  testing.assertEquals(s, "DynamicBuffer(6)");
});
