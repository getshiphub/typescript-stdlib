// Copyright (c) 2020 Christopher Szatmary <cs@christopherszatmary.com>
// All rights reserved. MIT License.

// This code has been ported almost directly from Go's src/strings/reader.go
// Copyright 2009 The Go Authors. All rights reserved. BSD license.
// https://github.com/golang/go/blob/master/LICENSE

import { Result } from "../global";
import * as bytes from "../bytes/mod";
import * as io from "../io/mod";

/**
 * A Reader implements the `io.Reader` and `io.ReaderSync` interfaces
 * by reading from a string.
 */
export class Reader {
  #buf: Uint8Array;
  /** current reading index */
  #i = 0;

  constructor(s: string) {
    this.#buf = new TextEncoder().encode(s);
  }

  /**
   * length returns the number of bytes in the unread portion
   * of the string.
   */
  get length(): number {
    if (this.#i >= this.#buf.byteLength) {
      return 0;
    }

    return this.#buf.byteLength - this.#i;
  }

  /**
   * size returns the original byte length of the underlying string.
   * The returned value is always the same and is not affected by
   * calls to any other method.
   */
  get size(): number {
    return this.#buf.byteLength;
  }

  readSync(p: Uint8Array): Result<number, error> {
    if (this.#i >= this.#buf.byteLength) {
      return Result.failure(io.eof);
    }

    const n = bytes.copy(p, this.#buf.subarray(this.#i));
    this.#i += n;
    return Result.success(n);
  }

  /**
   * **NOTE:** Reading happens synchronously. This method is provided
   * for compatibility with the `io.Reader` interface.
   */
  read(p: Uint8Array): Promise<Result<number, error>> {
    return Promise.resolve(this.readSync(p));
  }
}
