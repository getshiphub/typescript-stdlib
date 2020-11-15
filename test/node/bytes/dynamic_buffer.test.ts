import { inspect } from "util";
import { bytes, hex, util } from "../../../src";

describe("bytes/dynamic_buffer.ts", () => {
  test("bytes.DynamicBuffer: empty", () => {
    const buf = new bytes.DynamicBuffer();
    expect(buf.isEmpty).toBe(true);
    expect(buf.length).toBe(0);
    expect(buf.capacity).toBe(0);
    expect(buf.bytes()).toEqual(new Uint8Array(0));
    expect(buf.toString()).toBe("");
  });

  test("bytes.DynamicBuffer: from Uint8Array", () => {
    const b = new Uint8Array([0x61, 0x62, 0x63]);
    const buf = new bytes.DynamicBuffer(b);
    expect(buf.isEmpty).toBe(false);
    expect(buf.length).toBe(3);
    expect(buf.capacity).toBe(3);
    expect(buf.bytes()).toEqual(b);
    expect(buf.toString()).toBe("abc");
  });

  test("bytes.DynamicBuffer: from string", () => {
    const buf = new bytes.DynamicBuffer("foobar");
    expect(buf.isEmpty).toBe(false);
    expect(buf.length).toBe(6);
    expect(buf.capacity).toBe(6);
    expect(Array.from(buf.bytes())).toEqual([0x66, 0x6f, 0x6f, 0x62, 0x61, 0x72]);
    expect(buf.toString()).toBe("foobar");
  });

  test("bytes.DynamicBuffer: truncate: resets the buffer when n is 0", () => {
    const b = hex.decodeString("10ffab23ef5d").unwrap();
    const buf = new bytes.DynamicBuffer(b.buffer);
    expect(buf.length).toBe(6);
    expect(buf.capacity).toBe(6);
    buf.truncate(0);
    expect(buf.length).toBe(0);
    expect(buf.capacity).toBe(6);
  });

  test("bytes.DynamicBuffer: truncate: all but the first byte", () => {
    const b = hex.decodeString("10ffab23ef5d").unwrap();
    const buf = new bytes.DynamicBuffer(b.buffer);
    expect(buf.length).toBe(6);
    expect(buf.capacity).toBe(6);
    buf.truncate(3);
    expect(buf.length).toBe(3);
    expect(hex.encodeToString(buf.bytes())).toBe("10ffab");
    expect(buf.capacity).toBe(6);
  });

  test("bytes.DynamicBuffer: truncate: panics if n is out of range", () => {
    const b = hex.decodeString("10ffab23ef5d").unwrap();
    const buf = new bytes.DynamicBuffer(b.buffer);
    expect(() => {
      buf.truncate(9);
    }).toPanic("DynamicBuffer: truncation out of range");
  });

  test("bytes.DynamicBuffer: reset", () => {
    const b = hex.decodeString("10ffab23ef5d").unwrap();
    const buf = new bytes.DynamicBuffer(b.buffer);
    expect(buf.length).toBe(6);
    expect(buf.capacity).toBe(6);
    buf.reset();
    expect(buf.length).toBe(0);
    expect(buf.capacity).toBe(6);
  });

  test("bytes.DynamicBuffer: grow", () => {
    const b = hex.decodeString("10ffab23ef5d").unwrap();
    const buf = new bytes.DynamicBuffer(b.buffer);
    expect(buf.length).toBe(6);
    expect(buf.capacity).toBe(6);
    buf.grow(8);
    expect(buf.length).toBe(6);
    expect(buf.capacity).toBeGreaterThanOrEqual(12);
  });

  test("bytes.DynamicBuffer: grow: n is negative", () => {
    const b = hex.decodeString("10ffab23ef5d").unwrap();
    const buf = new bytes.DynamicBuffer(b.buffer);
    expect(() => {
      buf.grow(-1);
    }).toPanic("DynamicBuffer.grow: negative count");
  });

  test("bytes.DynamicBuffer: write", () => {
    const src = hex.decodeString("10ffab23ef5d").unwrap();
    const buf = new bytes.DynamicBuffer(src);
    buf.write(new Uint8Array([0x10, 0xff, 0xab]));
    expect(buf.length).toBe(9);
    expect(hex.encodeToString(buf.bytes())).toBe("10ffab23ef5d10ffab");
  });

  test("bytes.DynamicBuffer: writeString", () => {
    const buf = new bytes.DynamicBuffer("Hello");
    buf.writeString(" world!");
    expect(buf.toString()).toBe("Hello world!");
  });

  test("bytes.DynamicBuffer: writeByte", () => {
    const src = hex.decodeString("10ffab23ef5d").unwrap();
    const buf = new bytes.DynamicBuffer(src);
    buf.writeByte(0x10);
    expect(buf.length).toBe(7);
    expect(hex.encodeToString(buf.bytes())).toBe("10ffab23ef5d10");
  });

  test("bytes.DynamicBuffer: writeByte: invalid byte", () => {
    const src = hex.decodeString("10ffab23ef5d").unwrap();
    const buf = new bytes.DynamicBuffer(src);
    expect(() => {
      buf.writeByte(1.1);
    }).toPanic("DynamicBuffer.writeByte: c is not a valid byte");
  });

  test("bytes.DynamicBuffer: read", () => {
    const src = hex.decodeString("10ffab23ef5d").unwrap();
    const buf = new bytes.DynamicBuffer(src);
    const b = new Uint8Array(4);
    const r = buf.read(b);
    expect(r.unwrap()).toBe(4);
    expect(hex.encodeToString(b)).toBe("10ffab23");
    expect(buf.length).toBe(2);
  });

  test("bytes.DynamicBuffer: read: all the bytes", () => {
    const src = hex.decodeString("10ffab23ef5d").unwrap();
    const buf = new bytes.DynamicBuffer(src);
    const b = new Uint8Array(10);
    const r = buf.read(b);
    expect(r.unwrap()).toBe(6);
    expect(hex.encodeToString(b)).toBe("10ffab23ef5d00000000");
    expect(buf.length).toBe(0);
  });

  test("bytes.DynamicBuffer: read: empty", () => {
    const buf = new bytes.DynamicBuffer();
    const b = new Uint8Array(10);
    const r = buf.read(b);
    expect(r.unwrapFailure()).toBe(bytes.eof);
  });

  test("bytes.DynamicBuffer: next", () => {
    const src = hex.decodeString("10ffab23ef5d").unwrap();
    const buf = new bytes.DynamicBuffer(src);
    const b = buf.next(4);
    expect(b.length).toBe(4);
    expect(hex.encodeToString(b)).toBe("10ffab23");
    expect(buf.length).toBe(2);
  });

  test("bytes.DynamicBuffer: next: all bytes", () => {
    const src = hex.decodeString("10ffab23ef5d").unwrap();
    const buf = new bytes.DynamicBuffer(src);
    const b = buf.next(10);
    expect(b.length).toBe(6);
    expect(hex.encodeToString(b)).toBe("10ffab23ef5d");
    expect(buf.length).toBe(0);
  });

  test("bytes.DynamicBuffer: readByte", () => {
    const src = hex.decodeString("10ffab23ef5d").unwrap();
    const buf = new bytes.DynamicBuffer(src);
    const r = buf.readByte();
    expect(r.unwrap()).toBe(0x10);
    expect(buf.length).toBe(5);
  });

  test("bytes.DynamicBuffer: readByte: empty", () => {
    const buf = new bytes.DynamicBuffer();
    const r = buf.readByte();
    expect(r.unwrapFailure()).toBe(bytes.eof);
  });

  test("bytes.DynamicBuffer: readBytes", () => {
    const src = hex.decodeString("10ffab23ef5d").unwrap();
    const buf = new bytes.DynamicBuffer(src);
    const [b, err] = buf.readBytes(0xab);
    expect(err).toBeUndefined();
    expect(hex.encodeToString(b)).toBe("10ffab");
    expect(buf.length).toBe(3);
  });

  test("bytes.DynamicBuffer: readBytes: delim doesn't exist", () => {
    const src = hex.decodeString("10ffab23ef5d").unwrap();
    const buf = new bytes.DynamicBuffer(src);
    const [b, err] = buf.readBytes(0xcc);
    expect(err).toBe(bytes.eof);
    expect(hex.encodeToString(b)).toBe("10ffab23ef5d");
    expect(buf.length).toBe(0);
  });

  test("bytes.DynamicBuffer: readBytes: delim is not a valid byte", () => {
    const src = hex.decodeString("10ffab23ef5d").unwrap();
    const buf = new bytes.DynamicBuffer(src);
    expect(() => {
      buf.readBytes(1.1);
    }).toPanic("DynamicBuffer.readBytes: delim is not a valid byte");
  });

  test("bytes.DynamicBuffer: readString", () => {
    const buf = new bytes.DynamicBuffer("foobar");
    const [s, err] = buf.readString(0x62);
    expect(err).toBeUndefined();
    expect(s).toBe("foob");
    expect(buf.length).toBe(2);
  });

  test("bytes.DynamicBuffer: readString: delim is not a valid byte", () => {
    const src = hex.decodeString("10ffab23ef5d").unwrap();
    const buf = new bytes.DynamicBuffer(src);
    expect(() => {
      buf.readString(1.1);
    }).toPanic("DynamicBuffer.readBytes: delim is not a valid byte");
  });

  test("bytes.DynamicBuffer: iterating", () => {
    const src = hex.decodeString("10ffab23ef5d").unwrap();
    const buf = new bytes.DynamicBuffer(src);
    const arr: number[] = [];
    for (const b of buf) {
      arr.push(b);
    }

    expect(arr).toEqual([0x10, 0xff, 0xab, 0x23, 0xef, 0x5d]);
    expect(buf.length).toBe(0);
  });

  test("bytes.DynamicBuffer: copy", () => {
    const buf = new bytes.DynamicBuffer("abc");
    const bufCopy = util.copy(buf);
    bufCopy.writeString("def");
    expect(buf).not.toBe(bufCopy);
    expect(buf.toString()).toBe("abc");
    expect(bufCopy.toString()).toBe("abcdef");
  });

  test("bytes.DynamicBuffer: inspect", () => {
    const src = hex.decodeString("10ffab23ef5d").unwrap();
    const buf = new bytes.DynamicBuffer(src);
    const s = inspect(buf);
    expect(s).toBe("DynamicBuffer(6)");
  });
});
