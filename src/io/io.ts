// Copyright (c) 2020 Christopher Szatmary <cs@christopherszatmary.com>
// All rights reserved. MIT License.

// These interfaces were adapted from Go's io package.
// Copyright (c) 2009 The Go Authors. All rights reserved.
// https://github.com/golang/go/blob/master/LICENSE

import { Result } from "../global";
import * as errors from "../errors/mod";

/**
 * eof is the error returned by `read` when no more input is available.
 * Functions should return `eof` only to signal a graceful end of input.
 * If the EOF occurs unexpectedly in a structured data stream,
 * the appropriate error is either `errUnexpectedEOF` or some other error
 * giving more detail.
 */
export const eof = errors.errorString("EOF");

/**
 * errUnexpectedEOF means that EOF was encountered in the
 * middle of reading a fixed-size block or data structure.
 */
export const errUnexpectedEOF = errors.errorString("unexpected EOF");

/* Types */

/**
 * Reader is the interface that wraps the basic `read` method.
 * It represents any type that can be read from asynchronously.
 *
 * `read` reads up to `p.byteLength` bytes into `p`. It resolves to
 * a `Result` containing either the number of bytes read (`0 <= n <= p.byteLength`)
 * or an error encountered. Even if `read` resolves to `n < p.byteLength`,
 * it may use all of `p` as scratch space during the call. If some data is
 * available but not `p.byteLength bytes`, `read` conventionally resolves to what
 * is available instead of waiting for more.
 *
 * When `read` encounters end-of-file condition, it resolves to `eof`.
 *
 * Implementations of `read` are discouraged from returning a zero byte count,
 * except when `p.byteLength === 0`. Callers should treat a result of `0` as
 * indicating that nothing happened; in particular it does not indicate EOF.
 *
 * Implementations must not retain `p`.
 */
export interface Reader {
  read(p: Uint8Array): Promise<Result<number, error>>;
}

/**
 * ReaderSync is the interface that wraps the basic `readSync` method.
 * It represents any type that can be read from synchronously.
 *
 * `readSync` reads up to `p.byteLength` bytes into `p`. It returns
 * a `Result` containing either the number of bytes read (`0 <= n <= p.byteLength`)
 * or an error encountered. Even if `readSync` returns `n < p.byteLength`,
 * it may use all of `p` as scratch space during the call. If some data is
 * available but not `p.byteLength bytes`, `readSync` conventionally returns to what
 * is available instead of waiting for more.
 *
 * When `readSync` encounters end-of-file condition, it returns `eof`.
 *
 * Implementations of `readSync` are discouraged from returning a zero byte count,
 * except when `p.byteLength === 0`. Callers should treat a result of `0` as
 * indicating that nothing happened; in particular it does not indicate EOF.
 *
 * Implementations must not retain `p`.
 */
export interface ReaderSync {
  readSync(p: Uint8Array): Result<number, error>;
}

/**
 * Writer is the interface that wraps the basic `write` method.
 * It represents any type that can be written to asynchronously.
 *
 * `write` writes `p.byteLength` bytes from `p` to the underlying data stream.
 * It resolves to a `Result` containing either the number of bytes written
 * from `p` (`0 <= n <= p.byteLength`) or an error encountered that caused
 * the write to stop early.
 * `write` must return an error if it would resolve to n < p.byteLength.
 * `write` must not modify the byte data, even temporarily.
 * Implementations must not retain `p`.
 */
export interface Writer {
  write(p: Uint8Array): Promise<Result<number, error>>;
}

/**
 * WriterSync is the interface that wraps the basic `writeSync` method.
 * It represents any type that can be written to synchronously.
 *
 * `writeSync` writes `p.byteLength` bytes from `p` to the underlying data stream.
 * It returns a `Result` containing either the number of bytes written
 * from `p` (`0 <= n <= p.byteLength`) or an error encountered that caused
 * the write to stop early.
 * `writeSync` must return an error if it would return n < p.byteLength.
 * `writeSync` must not modify the byte data, even temporarily.
 * Implementations must not retain `p`.
 */
export interface WriterSync {
  writeSync(p: Uint8Array): Result<number, error>;
}

/**
 * StringWriter is the interface that wraps the basic `writeString` method.
 * It represents any type that can write strings asynchronously.
 */
export interface StringWriter {
  writeString(s: string): Promise<Result<number, error>>;
}

/**
 * StringWriterSync is the interface that wraps the basic `writeStringSync` method.
 * It represents any type that can write strings synchronously.
 */
export interface StringWriterSync {
  writeStringSync(s: string): Result<number, error>;
}

/* IO helpers */

/**
 * devNull is a `Writer` and `WriterSync` on which all write calls
 * succeed without doing anything. It functions like `/dev/null` on Unix.
 */
export const devNull: Writer & WriterSync = {
  write(p: Uint8Array): Promise<Result<number, error>> {
    return Promise.resolve(Result.success(p.byteLength));
  },
  writeSync(p: Uint8Array): Result<number, error> {
    return Result.success(p.byteLength);
  },
};

/**
 * writeString writes the string `s` to `w`. If `w` implements `StringWriter`, it's
 * `writeString` method is invoked directly.
 */
export function writeString(w: Writer, s: string): Promise<Result<number, error>> {
  const sw = (w as unknown) as StringWriter;
  if (typeof sw.writeString === "function") {
    return sw.writeString(s);
  }

  const p = new TextEncoder().encode(s);
  return w.write(p);
}

/**
 * writeStringSync writes the string `s` to `w`. If `w` implements `StringWriterSync`, it's
 * `writeStringSync` method is invoked directly.
 */
export function writeStringSync(w: WriterSync, s: string): Result<number, error> {
  const sw = (w as unknown) as StringWriterSync;
  if (typeof sw.writeStringSync === "function") {
    return sw.writeStringSync(s);
  }

  const p = new TextEncoder().encode(s);
  return w.writeSync(p);
}
