// Copyright (c) 2020-2021 Christopher Szatmary <cs@christopherszatmary.com>
// All rights reserved. MIT License.

// This code has been ported almost directly from Go's src/bytes/buffer.go
// Copyright 2009 The Go Authors. All rights reserved. BSD license.
// https://github.com/golang/go/blob/master/LICENSE

import { runtime } from "../_runtime/runtime";
import { Result, panic, symbols } from "../global";
import * as io from "../io/mod";
import { copy } from "./bytes";

// Node limit for the size of ArrayBuffers
const maxSize = 2 ** 31 - 1;

function isByte(c: number): boolean {
  return Number.isInteger(c) && c >= 0 && c < 256;
}

/**
 * A DynamicBuffer is a variable-sized buffer of bytes.
 * It will automatically grow as needed.
 */
export class DynamicBuffer implements Iterable<number> {
  #buf: Uint8Array; // contents are the bytes #buf[#off : #buf.byteLength]
  #off = 0; // read at #buf[#off], write at #buf[#buf.byteLength]
  #enc = new TextEncoder();
  #dec = new TextDecoder("utf-8");

  /** Creates an empty DynamicBuffer ready for use. */
  constructor();
  /**
   * Creates a new DynamicBuffer using `buf` as it's initial contents.
   * The new DynamicBuffer will take ownership of `buf`, and the caller should
   * not use `buf` after this call.
   */
  constructor(buf: ArrayBuffer);
  /**
   * Creates a new DynamicBuffer using `buf` as it's initial contents.
   * The new DynamicBuffer will take ownership of `buf`, and the caller should
   * not use `buf` after this call.
   */
  constructor(buf: Uint8Array);
  /** Creates a new DynamicBuffer using string `s` as it's initial contents. */
  constructor(s: string);
  constructor(src?: ArrayBuffer | Uint8Array | string) {
    if (src === undefined) {
      this.#buf = new Uint8Array(0);
      return;
    }

    if (src instanceof ArrayBuffer) {
      this.#buf = new Uint8Array(src);
      return;
    }

    if (typeof src === "string") {
      this.#buf = this.#enc.encode(src);
      return;
    }

    this.#buf = src;
  }

  /** Functions like the slice operator in go, i.e. #buf[low:high]. */
  #slice(low: number, high: number): Uint8Array {
    // Want to panic instead of node throwing some other type of error
    if (high > this.capacity) {
      panic(`out of index in buffer: ${high}`);
    }
    return new Uint8Array(this.#buf.buffer, low, high - low);
  }

  /**
   * For the fast-case where the internal buffer only needs to be resliced,
   * i.e. no reallocation is needed.
   * Returns the index where bytes should be written or -1 if the buffer
   * couldn't be resliced.
   */
  #tryGrowByReslice(n: number): number {
    const l = this.#buf.byteLength;
    if (n <= this.capacity - l) {
      this.#buf = this.#slice(0, l + n);
      return l;
    }
    return -1;
  }

  /**
   * Grows the buffer to guarantee space for `n` more bytes.
   * It returns the index where bytes should be written.
   * If the buffer can't grow it will panic.
   */
  #grow(n: number): number {
    const m = this.length;

    // If buffer is empty, reset to recover space from read portion.
    if (m === 0 && this.#off !== 0) {
      this.reset();
    }

    // Try to grow by means of a reslice.
    const i = this.#tryGrowByReslice(n);
    if (i >= 0) {
      return i;
    }

    const c = this.capacity;
    if (n <= Math.floor(c / 2) - m) {
      // We can slide things down instead of allocating a new
      // slice. We only need m+n <= c to slide, but
      // we instead let capacity get twice as large so we
      // don't spend all our time copying.
      copy(this.#buf, this.#buf.subarray(this.#off));
    } else if (c > maxSize - c - n) {
      panic("DynamicBuffer: too large");
    } else {
      // Not enough space anywhere, we need to allocate.
      const buf = new Uint8Array(2 * c + n);
      copy(buf, this.#buf.subarray(this.#off));
      this.#buf = buf;
    }

    this.#off = 0;
    this.#buf = this.#slice(0, m + n);
    return m;
  }

  /** #readSlice is like readBytes but returns a reference to internal buffer data. */
  #readSlice(delim: number): [Uint8Array, error | undefined] {
    const i = this.#buf.indexOf(delim, this.#off);
    let end = this.#off + i + 1;
    let err: error | undefined;
    if (i < 0) {
      end = this.#buf.byteLength;
      err = io.eof;
    }

    const line = this.#buf.subarray(this.#off, end);
    this.#off = end;
    return [line, err];
  }

  /** Returns whether or not the unread portion of the buffer is empty. */
  get isEmpty(): boolean {
    return this.#buf.byteLength <= this.#off;
  }

  /** Returns the number of bytes in the unread portion of the buffer. */
  get length(): number {
    return this.#buf.byteLength - this.#off;
  }

  /**
   * Returns the capacity of the buffer, that is,
   * the total space allocated for the buffer's data.
   */
  get capacity(): number {
    return this.#buf.buffer.byteLength;
  }

  /**
   * Returns a `Uint8Array` holding the unread portion of the buffer.
   * The returned buffer shares the underlying memory of the DynamicBuffer instance.
   */
  bytes(): Uint8Array {
    return this.#buf.subarray(this.#off);
  }

  /** Returns the contents of the unread portion of the buffer as a string. */
  toString(): string {
    return this.#dec.decode(this.#buf.subarray(this.#off));
  }

  /**
   * Discards all but the first n unread bytes from the buffer
   * but continues to use the same allocated storage.
   * It panics if n is negative or greater than the length of the buffer.
   */
  truncate(n: number): void {
    if (n === 0) {
      this.reset();
      return;
    }

    if (n < 0 || n > this.length) {
      panic("DynamicBuffer: truncation out of range");
    }

    this.#buf = this.#slice(0, this.#off + n);
  }

  /**
   * Resets the buffer to be empty, but it retains the
   * underlying storage for use by future writes.
   * Reset is the same as truncate(0).
   */
  reset(): void {
    this.#buf = this.#slice(0, 0);
    this.#off = 0;
  }

  /**
   * Grows the buffer's capacity, if necessary, to guarantee space for
   * another `n` bytes. After `grow(n)`, at least `n` bytes can be written to the
   * buffer without another allocation.
   * If `n` is negative or the buffer can't grow, it will panic.
   */
  grow(n: number): void {
    if (n < 0) {
      panic("DynamicBuffer.grow: negative count");
    }

    const m = this.#grow(n);
    this.#buf = this.#slice(0, m);
  }

  /**
   * Appends the contents of `p` to the buffer, growing the buffer as needed.
   * The return value is a successful `Result` with the length of `p`,
   * it will never fail.
   * If the buffer becomes too large, `writeSync` will panic.
   */
  writeSync(p: Uint8Array): Result<number, error> {
    const m = this.#grow(p.byteLength);
    const n = copy(this.#buf.subarray(m), p);
    return Result.success(n);
  }

  /**
   * Appends the contents of `p` to the buffer, growing the buffer as needed.
   * The return value resolves to a successful `Result` with the length of `p`,
   * it will never fail.
   * If the buffer becomes too large, `write` will panic.
   *
   * **NOTE:** Writing happens synchronously. This method is provided
   * for compatibility with the `io.Writer` interface.
   */
  write(p: Uint8Array): Promise<Result<number, error>> {
    return Promise.resolve(this.writeSync(p));
  }

  /**
   * Appends the contents of `s` to the buffer, growing the buffer as needed.
   * The return value is a successful `Result` with the byte length of `s`,
   * it will never fail.
   * If the buffer becomes too large, `writeStringSync` will panic.
   */
  writeStringSync(s: string): Result<number, error> {
    const p = this.#enc.encode(s);
    const m = this.#grow(p.byteLength);
    const n = copy(this.#buf.subarray(m), p);
    return Result.success(n);
  }

  /**
   * Appends the contents of `s` to the buffer, growing the buffer as needed.
   * The return value resolves to a successful `Result` with the byte length of `s`,
   * it will never fail.
   * If the buffer becomes too large, `writeString` will panic.
   *
   * **NOTE:** Writing happens synchronously. This method is provided
   * for compatibility with the `io.StringWriter` interface.
   */
  writeString(s: string): Promise<Result<number, error>> {
    return Promise.resolve(this.writeStringSync(s));
  }

  /**
   * Appends the byte `c` to the buffer, growing the buffer as needed.
   * If `c` is not a valid byte, or if the buffer becomes too large,
   * writeByte will panic.
   */
  writeByte(c: number): void {
    if (!isByte(c)) {
      panic("DynamicBuffer.writeByte: c is not a valid byte");
    }

    const m = this.#grow(1);
    this.#buf[m] = c;
  }

  /**
   * Reads the next `p.byteLength` bytes from the buffer
   * or until the buffer is drained. The return value is a
   * `Result` with either the number of bytes read or `io.eof`
   * if the buffer has no data.
   */
  readSync(p: Uint8Array): Result<number, error> {
    if (this.isEmpty) {
      // Buffer is empty, reset to recover space.
      this.reset();
      if (p.byteLength === 0) {
        return Result.success(0);
      }

      return Result.failure(io.eof);
    }

    const n = copy(p, this.#buf.subarray(this.#off));
    this.#off += n;
    return Result.success(n);
  }

  /**
   * Reads the next `p.byteLength` bytes from the buffer
   * or until the buffer is drained. The return value is a
   * `Result` with either the number of bytes read or `io.eof`
   * if the buffer has no data.
   *
   * **NOTE:** Reading happens synchronously. This method is provided
   * for compatibility with the `io.Reader` interface.
   */
  read(p: Uint8Array): Promise<Result<number, error>> {
    return Promise.resolve(this.readSync(p));
  }

  /**
   * Returns a buffer containing the next `n` bytes from the buffer,
   * advancing the buffer as if the bytes had been returned by read.
   * If there are fewer than `n` bytes in the buffer, the entire buffer is returned.
   * The returned buffer is only valid until the next call to a read or write method.
   */
  next(n: number): Uint8Array {
    const l = this.length;
    let m = n;
    if (n > l) {
      m = l;
    }

    const data = this.#buf.subarray(this.#off, this.#off + m);
    this.#off += m;
    return data;
  }

  /**
   * Reads the next byte from the buffer.
   * The return value is a `Result` with the read byte
   * or an `io.eof` error if the buffer has no data.
   */
  readByte(): Result<number, error> {
    if (this.isEmpty) {
      // Buffer is empty, reset to recover space.
      this.reset();
      return Result.failure(io.eof);
    }

    const c = this.#buf[this.#off];
    this.#off++;
    return Result.success(c);
  }

  /**
   * Reads until the first occurrence of delim in the input,
   * returning a buffer containing the data up to and including the delimiter.
   * If an error is encountered before finding a delimiter,
   * the data read before the error and the error itself (often eof) are returned.
   */
  readBytes(delim: number): [Uint8Array, error | undefined] {
    if (!isByte(delim)) {
      panic("DynamicBuffer.readBytes: delim is not a valid byte");
    }

    const [slice, err] = this.#readSlice(delim);
    // return a copy of slice. #buf may be overwritten by later calls.
    // Use call just be safe in case this DynamicBuffer was created with a Node Buffer
    const line = Uint8Array.prototype.slice.call(slice);
    return [line, err];
  }

  /**
   * Reads until the first occurrence of delim in the input,
   * returning a string containing the data up to and including the delimiter.
   * If an error is encountered before finding a delimiter,
   * the data read before the error and the error itself (often eof) are returned.
   */
  readString(delim: number): [string, error | undefined] {
    if (!isByte(delim)) {
      panic("DynamicBuffer.readBytes: delim is not a valid byte");
    }

    const [slice, err] = this.#readSlice(delim);
    return [this.#dec.decode(slice), err];
  }

  /**
   * Creates an iterator to iterate over the DynamicBuffer
   * using the `for of` syntax.
   * Iterating over the DynamicBuffer will cause the bytes to be read
   * just like if a read method was called.
   */
  *[Symbol.iterator](): Iterator<number> {
    while (this.#off < this.#buf.byteLength) {
      yield this.#buf[this.#off];
      this.#off++;
    }
  }

  /** Returns a new DynamicBuffer with the unread bytes copied. */
  [symbols.copy](): DynamicBuffer {
    const buf = new DynamicBuffer(new ArrayBuffer(this.length));
    for (let i = 0; i < this.length; i++) {
      buf.#buf[i] = this.#buf[i + this.#off];
    }
    return buf;
  }

  /** Custom inspect implementation to print a debug description. */
  [runtime.customInspect](): string {
    return `DynamicBuffer(${this.length})`;
  }
}
