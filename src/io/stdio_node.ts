// Copyright (c) 2020-2021 Christopher Szatmary <cs@christopherszatmary.com>
// All rights reserved. MIT License.

import { Result } from "../global";
import * as errors from "../errors/mod";
import { errClosed, Writer, WriterSync } from "./io";

interface NodeStdWriteStream extends NodeJS.WriteStream {
  fd: number;
}

function isWritableStreamClosed(stream: NodeJS.WriteStream): boolean {
  return (
    !stream.writable || stream.writableEnded || stream.writableFinished || stream.destroyed || false
  );
}

// This is a modified version of ionode.StreamWriter that is specially tailored to standard IO streams.
// This also prevents an import cycle.
class StdioWriter {
  #stream: NodeStdWriteStream;
  #error?: Error;
  #isClosed = false;

  constructor(stream: NodeStdWriteStream) {
    this.#stream = stream;
    stream.on("error", this.#errorHandler);
  }

  get fd(): number {
    return this.#stream.fd;
  }

  #errorHandler = (e: Error): void => {
    this.#error = e;
  };

  #write = (chunk: Uint8Array | string): Promise<Result<number, error>> => {
    return new Promise((resolve) => {
      if (this.#error !== undefined) {
        const err = errors.fromJSError(this.#error);
        this.#error = undefined;
        resolve(Result.failure(err));
        return;
      }

      // No straightforward way to test this
      /* istanbul ignore next */
      if (this.#isClosed || isWritableStreamClosed(this.#stream)) {
        this.#isClosed = true;
        resolve(Result.failure(errClosed));
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
        ok = this.#stream.write(chunk);
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
        const err = errors.fromJSError(e);
        resolve(Result.failure(err));
      };
      /* eslint-enable @typescript-eslint/no-use-before-define */

      const removeListeners = (): void => {
        this.#stream.removeListener("close", closeHandler);
        this.#stream.removeListener("drain", drainHandler);
        this.#stream.removeListener("error", errorHandler);
      };

      this.#stream.on("close", closeHandler);
      this.#stream.on("drain", drainHandler);
      this.#stream.on("error", errorHandler);
    });
  };

  #writeSync = (chunk: Uint8Array | string): Result<number, error> => {
    if (this.#error !== undefined) {
      const err = errors.fromJSError(this.#error);
      this.#error = undefined;
      return Result.failure(err);
    }

    // Just to be safe
    /* istanbul ignore next */
    if (this.#isClosed || isWritableStreamClosed(this.#stream)) {
      this.#isClosed = true;
      return Result.failure(errClosed);
    }

    let writeError: Error | undefined;
    const writeErrorHandler = (e: Error): void => {
      this.#error = undefined;
      writeError = e;
    };

    this.#stream.once("error", writeErrorHandler);

    let length: number;
    if (typeof chunk === "string") {
      length = Buffer.byteLength(chunk, "utf-8");
      this.#stream.write(chunk, "utf-8");
    } else {
      length = chunk.byteLength;
      this.#stream.write(chunk);
    }

    this.#stream.removeListener("error", writeErrorHandler);
    if (writeError !== undefined) {
      const err = errors.fromJSError(writeError);
      return Result.failure(err);
    }

    return Result.success(length);
  };

  write(p: Uint8Array): Promise<Result<number, error>> {
    return this.#write(p);
  }

  writeString(s: string): Promise<Result<number, error>> {
    return this.#write(s);
  }

  writeSync(p: Uint8Array): Result<number, error> {
    return this.#writeSync(p);
  }

  writeStringSync(s: string): Result<number, error> {
    return this.#writeSync(s);
  }
}

export const stdout: Writer & WriterSync = new StdioWriter(process.stdout);
export const stderr: Writer & WriterSync = new StdioWriter(process.stderr);
