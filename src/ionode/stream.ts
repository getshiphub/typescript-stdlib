// Copyright (c) 2020 Christopher Szatmary <cs@christopherszatmary.com>
// All rights reserved. MIT License.

import { Result } from "../global";
import * as errors from "../errors/mod";
import * as io from "../io/mod";

export const errStreamClosed = errors.errorString("ionode: stream closed");

export interface ReadableStream extends NodeJS.ReadableStream {
  readonly readableEncoding?: BufferEncoding | null;
  readonly readableEnded?: boolean;
  readonly destroyed?: boolean;
}

export interface WritableStream extends NodeJS.WritableStream {
  readonly writableEnded?: boolean;
  readonly writableFinished?: boolean;
  readonly destroyed?: boolean;
}

function hasReadableStreamEnded(stream: ReadableStream): boolean {
  return !stream.readable || stream.readableEnded || stream.destroyed || false;
}

function isWritableStreamClosed(stream: WritableStream): boolean {
  return (
    !stream.writable || stream.writableEnded || stream.writableFinished || stream.destroyed || false
  );
}

export class StreamReader {
  #stream: ReadableStream;
  #error?: Error;
  #hasEnded = false;

  constructor(stream: ReadableStream) {
    this.#stream = stream;
    stream.on("error", this.#errorHandler);
  }

  #errorHandler = (e: Error): void => {
    this.#error = e;
  };

  read(p: Uint8Array): Promise<Result<number, error>> {
    return new Promise((resolve) => {
      if (this.#error !== undefined) {
        const err = errors.fromJSError(this.#error);
        this.#error = undefined;
        resolve(Result.failure(err));
        return;
      }

      if (this.#hasEnded || hasReadableStreamEnded(this.#stream)) {
        this.#hasEnded = true;
        resolve(Result.failure(io.eof));
        return;
      }

      /* eslint-disable @typescript-eslint/no-use-before-define */
      const closeHandler = (): void => {
        removeListeners();
        this.#hasEnded = true;
        resolve(Result.failure(io.eof));
      };

      const endHandler = (): void => {
        removeListeners();
        this.#hasEnded = true;
        resolve(Result.failure(io.eof));
      };

      const errorHandler = (e: Error): void => {
        removeListeners();
        this.#error = undefined;
        this.#hasEnded = true;
        const err = errors.fromJSError(e);
        resolve(Result.failure(err));
      };

      const readableHandler = (): void => {
        removeListeners();
        // Not sure why the type doesn't include null, this is clearly stated in the docs
        let chunk: string | Buffer | null = this.#stream.read(p.byteLength);

        if (chunk === null) {
          // If we got null this could mean one of two things
          // 1. EOF
          // 2. There wasn't p.byteLength bytes available
          // Readable streams won't return any data if there isn't the exact amount asked for

          // Read again without a specified size to determine which case it was
          chunk = this.#stream.read();

          // If we got null a second time this means eof
          if (chunk === null) {
            resolve(Result.failure(io.eof));
            return;
          }
        }

        // Handle chunk being a string
        let buf: Buffer;
        if (typeof chunk === "string") {
          const encoding = (this.#stream.readableEncoding ?? "utf-8") as BufferEncoding;
          buf = Buffer.from(chunk, encoding);
        } else {
          buf = chunk;
        }

        p.set(buf);
        resolve(Result.success(buf.byteLength));
      };
      /* eslint-enable @typescript-eslint/no-use-before-define */

      const removeListeners = (): void => {
        this.#stream.removeListener("close", closeHandler);
        this.#stream.removeListener("end", endHandler);
        this.#stream.removeListener("error", errorHandler);
        this.#stream.removeListener("readable", readableHandler);
      };

      this.#stream.on("close", closeHandler);
      this.#stream.on("end", endHandler);
      this.#stream.on("error", errorHandler);
      this.#stream.on("readable", readableHandler);
    });
  }
}

export class StreamWriter {
  #stream: WritableStream;
  #error?: Error;
  #isClosed = false;

  constructor(stream: WritableStream) {
    this.#stream = stream;
    stream.on("error", this.#errorHandler);
  }

  #errorHandler = (e: Error): void => {
    this.#error = e;
  };

  /** #write promisifies WritableStream's write method */
  #write = (chunk: Uint8Array | string): Promise<Result<number, error>> => {
    return new Promise((resolve) => {
      if (this.#error !== undefined) {
        const err = errors.fromJSError(this.#error);
        this.#error = undefined;
        resolve(Result.failure(err));
        return;
      }

      if (this.#isClosed || isWritableStreamClosed(this.#stream)) {
        this.#isClosed = true;
        resolve(Result.failure(errStreamClosed));
        return;
      }

      let errorOccurred = false;
      const writeErrorHandler = (e: Error): void => {
        this.#error = undefined;
        errorOccurred = true;
        const err = errors.fromJSError(e);
        resolve(Result.failure(err));
      };

      this.#stream.once("error", writeErrorHandler);

      let length: number;
      let ok: boolean;
      if (typeof chunk === "string") {
        length = Buffer.byteLength(chunk, "utf-8");
        ok = this.#stream.write(chunk, "utf-8");
      } else {
        length = chunk.byteLength;
        // write retains a reference to the buffer which isn't allowed by Writer
        // so we need to copy it
        // https://github.com/nodejs/node/blob/4c97325c4e332836f00b28b1394787182f3cbc07/lib/fs.js#L649
        ok = this.#stream.write(Buffer.from(chunk));
      }

      this.#stream.removeListener("error", writeErrorHandler);

      // If an error occurred return since resolve has already been called
      // with the error
      if (errorOccurred) {
        return;
      }

      // Easy case, no backpressure
      if (ok) {
        resolve(Result.success(length));
        return;
      }

      // Handle backpressure, wait until drained
      // Also handle any other events that could occur, in case
      // the stream is closed somehow

      /* eslint-disable @typescript-eslint/no-use-before-define */
      const closeHandler = (): void => {
        removeListeners();
        this.#isClosed = true;
        resolve(Result.success(length));
      };

      const drainHandler = (): void => {
        removeListeners();
        resolve(Result.success(length));
      };

      const errorHandler = (e: Error): void => {
        removeListeners();
        this.#error = undefined;
        this.#isClosed = true;
        const err = errors.fromJSError(e);
        resolve(Result.failure(err));
      };

      const finishHandler = (): void => {
        removeListeners();
        this.#isClosed = true;
        resolve(Result.success(length));
      };
      /* eslint-enable @typescript-eslint/no-use-before-define */

      const removeListeners = (): void => {
        this.#stream.removeListener("close", closeHandler);
        this.#stream.removeListener("drain", drainHandler);
        this.#stream.removeListener("error", errorHandler);
        this.#stream.removeListener("finish", finishHandler);
      };

      this.#stream.on("close", closeHandler);
      this.#stream.on("drain", drainHandler);
      this.#stream.on("error", errorHandler);
      this.#stream.on("finish", finishHandler);
    });
  };

  write(p: Uint8Array): Promise<Result<number, error>> {
    return this.#write(p);
  }

  writeString(s: string): Promise<Result<number, error>> {
    return this.#write(s);
  }

  /**
   * end calls end on the underlying stream which signals that no more data will be written.
   * The returned promise resolves when the data has been flushed from the stream.
   */
  end(): Promise<Result<void, error>> {
    // end is idempotent, multiple calls no-ops
    if (this.#isClosed || isWritableStreamClosed(this.#stream)) {
      this.#isClosed = true;
      return Promise.resolve(Result.success(undefined));
    }

    return new Promise((resolve) => {
      if (this.#error !== undefined) {
        const err = errors.fromJSError(this.#error);
        this.#error = undefined;
        resolve(Result.failure(err));
        return;
      }

      if (isWritableStreamClosed(this.#stream)) {
        this.#isClosed = true;
        resolve(Result.success(undefined));
        return;
      }

      /* eslint-disable @typescript-eslint/no-use-before-define */
      const errorHandler = (e: Error): void => {
        removeListeners();
        this.#error = undefined;
        this.#isClosed = true;
        const err = errors.fromJSError(e);
        resolve(Result.failure(err));
      };

      const finishHandler = (): void => {
        removeListeners();
        this.#isClosed = true;
        resolve(Result.success(undefined));
      };
      /* eslint-enable @typescript-eslint/no-use-before-define */

      const removeListeners = (): void => {
        this.#stream.removeListener("error", errorHandler);
        this.#stream.removeListener("finish", finishHandler);
      };

      this.#stream.on("finish", finishHandler);
      this.#stream.on("error", errorHandler);

      this.#stream.end();
    });
  }
}
