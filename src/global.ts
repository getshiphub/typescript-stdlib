// Copyright (c) 2020-2021 Christopher Szatmary <cs@christopherszatmary.com>
// All rights reserved. MIT License.

/*
This file contains any global types that are accessable without importing
It also contains any functions that can be imported from the top level of
the package and are not associated with any module.

This file should not import any other files from this library since it
should be able to be imported by any other file.
*/

import { runtime } from "./_runtime/runtime";

declare global {
  /** An interface representing an error condition. */
  // eslint-disable-next-line @typescript-eslint/naming-convention
  interface error {
    error(): string;
    detailedError(): string;
  }
}

/** Globally available symbols. */
export const symbols = Object.freeze({
  copy: Symbol.for("typescript-stdlib.copy"),
}) as {
  /**
   * The copy symbol can be used to implement a method on a type that
   * creates a copy of itself. This is used `util.copy`.
   */
  readonly copy: unique symbol;
};

// Copy isError so we don't need to import from the errors module
function isError(err: unknown): err is error {
  if (err == null) {
    return false;
  }

  const e = err as error;
  return typeof e.error === "function" && typeof e.detailedError === "function";
}

// Copy toString so we don't need to import from the util module
function toString(v: unknown): string {
  if (v === undefined) {
    return "undefined";
  } else if (v === null) {
    return "null";
  } else if (typeof v === "string") {
    return v;
  } else if (typeof v === "boolean" || typeof v === "number") {
    return v.toString();
  }

  if (isError(v)) {
    return v.error();
  }

  // Inline Stringer
  const s = v as { toString(): string };
  if (typeof s.toString === "function" && s.toString !== Object.prototype.toString) {
    return s.toString();
  }

  return runtime.inspect(v);
}

function isJSError(v: unknown): v is Error {
  if (v instanceof Error) {
    return true;
  }

  if (typeof v !== "object" || v == null) {
    return false;
  }

  // instanceof fails in jest: https://github.com/facebook/jest/issues/2549
  // this handles that case, it's hacky but it works
  const o = v as Record<string, unknown>;
  if (
    o.constructor.name === "Error" &&
    typeof o.name === "string" &&
    typeof o.message === "string"
  ) {
    return true;
  }

  return false;
}

class Panic extends Error {
  reason: unknown;

  constructor(reason: unknown) {
    super(toString(reason));
    this.name = "panic";
    this.reason = reason;
  }
}

/**
 * Allows the program to be terminated with a message and a stack trace
 * when the program reaches an unrecoverable state.
 */
export function panic(v: unknown): never {
  const p = new Panic(v);
  // Remove first line of stack trace since it is in this function
  Error.captureStackTrace(p, panic);
  // The rare case where throw is allowed
  // eslint-disable-next-line no-restricted-syntax
  throw p;
}

/**
 * recover takes an error that was caused by a panic and returns the cause
 * of the panic. This can be useful if you wish to recover from a panic.
 * Recovering from a panic can be done by using a try/catch block.
 * If `e` is `undefined`, `undefined` will be returned. If `e` was
 * not caused by a panic, recover will panic with `e`.
 */
export function recover(e: unknown): unknown {
  if (e === undefined) {
    return undefined;
  }

  if (e instanceof Panic) {
    return e.reason;
  }

  panic(e);
}

/**
 * `Ref` provides a way to wrap a value so that it can be used as a reference.
 * This allows functionality similar to that of references or pointers from
 * other languages.
 */
export class Ref<T> {
  #value: T;

  constructor(value: T) {
    this.#value = value;
  }

  /** Sets the value in the Ref to the given `value`. */
  set(value: T): void {
    this.#value = value;
  }

  /** Returns the value stored inside the Ref. */
  deref(): T {
    return this.#value;
  }

  /** Custom inspect implementation to print a debug description. */
  [runtime.customInspect](): string {
    // eslint-disable-next-line @typescript-eslint/restrict-template-expressions
    return `Ref(${this.#value})`;
  }
}

// This interface exists for documentation reasons and to ensure
// that Success and Failure both implement the same methods

interface ResultCase<S, F> {
  /** Returns `true` if the result is a `Success`. */
  isSuccess(): this is Success<S, F>;

  /** Returns `true` if the result is a `Failure`. */
  isFailure(): this is Failure<S, F>;

  /**
   * Unwraps the result and returns the `Success`'s value.
   * Panics with the failure value if the result is a `Failure`.
   * @param msg An optional message to panic with if the result is a `Failure`.
   */
  unwrap(msg?: string): S;

  /**
   * Unwraps the result and returns the `Failure`'s value.
   * Panics with the success value if the result is a `Success`.
   * @param msg An optional message to panic with if the result is a `Success`.
   */
  unwrapFailure(msg?: string): F;

  /** Returns the success value or `undefined` if the result is a `Failure`. */
  success(): S | undefined;

  /** Returns the failure value or `undefined` if the result is a `Success`. */
  failure(): F | undefined;

  /** Returns a new result, mapping the `Success` value using the given `transform` closure. */
  map<T>(transform: (value: S) => T): Result<T, F>;

  /** Returns a new result, mapping the `Failure` value using the given `transform` closure. */
  mapFailure<E>(transform: (err: F) => E): Result<S, E>;

  /**
   * Returns a new result, mapping the `Success` value using the given `transform` closure
   * and unwrapping the produced result.
   */
  flatMap<T>(transform: (value: S) => Result<T, F>): Result<T, F>;

  /**
   * Returns a new result, mapping the `Failure` value using the given `transform` closure
   * and unwrapping the produced result.
   */
  flatMapFailure<E>(transform: (err: F) => Result<S, E>): Result<S, E>;

  /** Custom inspect implementation to print a debug description. */
  [runtime.customInspect](): string;
}

class Success<S, F> implements ResultCase<S, F> {
  #value: S;

  constructor(value: S) {
    this.#value = value;
  }

  isSuccess(): this is Success<S, F> {
    return true;
  }

  isFailure(): this is Failure<S, F> {
    return false;
  }

  unwrap(_msg?: string): S {
    return this.#value;
  }

  unwrapFailure(msg?: string): never {
    if (msg === undefined) {
      panic(this.#value);
    }

    panic(`${msg}: ${toString(this.#value)}`);
  }

  success(): S {
    return this.#value;
  }

  failure(): undefined {
    return undefined;
  }

  map<T>(transform: (value: S) => T): Result<T, F> {
    return new Success(transform(this.#value));
  }

  mapFailure<E>(_transform: (err: F) => E): Result<S, E> {
    return new Success(this.#value);
  }

  flatMap<T>(transform: (value: S) => Result<T, F>): Result<T, F> {
    return transform(this.#value);
  }

  flatMapFailure<E>(_transform: (err: F) => Result<S, E>): Result<S, E> {
    return new Success(this.#value);
  }

  [runtime.customInspect](): string {
    // eslint-disable-next-line @typescript-eslint/restrict-template-expressions
    return `Result.success(${this.#value})`;
  }
}

class Failure<S, F> implements ResultCase<S, F> {
  #cause: F;

  constructor(cause: F) {
    this.#cause = cause;
  }

  isSuccess(): this is Success<S, F> {
    return false;
  }

  isFailure(): this is Failure<S, F> {
    return true;
  }

  unwrap(msg?: string): never {
    if (msg === undefined) {
      panic(this.#cause);
    }

    panic(`${msg}: ${toString(this.#cause)}`);
  }

  unwrapFailure(_msg?: string): F {
    return this.#cause;
  }

  success(): undefined {
    return undefined;
  }

  failure(): F {
    return this.#cause;
  }

  map<T>(_transform: (value: S) => T): Result<T, F> {
    return new Failure(this.#cause);
  }

  mapFailure<E>(transform: (err: F) => E): Result<S, E> {
    return new Failure(transform(this.#cause));
  }

  flatMap<T>(_transform: (value: S) => Result<T, F>): Result<T, F> {
    return new Failure(this.#cause);
  }

  flatMapFailure<E>(transform: (err: F) => Result<S, E>): Result<S, E> {
    return transform(this.#cause);
  }

  [runtime.customInspect](): string {
    // Handle error specially since Failure is frequently used with error
    if (isError(this.#cause)) {
      return `Result.failure(${this.#cause.error()})`;
    }

    // eslint-disable-next-line @typescript-eslint/restrict-template-expressions
    return `Result.failure(${this.#cause})`;
  }
}

/** A type that represents either success or failure. */
export type Result<S, F> = Success<S, F> | Failure<S, F>;

type ExtractPromise<P> = P extends Promise<infer T> ? T : never;

// try/catch is obviously needed to implement Result
/* eslint-disable no-restricted-syntax */

// "static methods" for Result type
// eslint-disable-next-line @typescript-eslint/naming-convention
export const Result = {
  /** Creates a new result of type Success with the given value. */
  success<S, F>(this: void, value: S): Result<S, F> {
    return new Success(value);
  },

  /** Creates a new result of type Failure with the given error value. */
  failure<S, F>(this: void, cause: F): Result<S, F> {
    return new Failure(cause);
  },

  /**
   * Creates a new result by evaluating a throwing closure,
   * capturing the returned value as a success, or any thrown error as a failure.
   */
  of<S>(this: void, catching: () => S): Result<S, Error> {
    try {
      return new Success(catching());
    } catch (err: unknown) {
      if (isJSError(err)) {
        return new Failure(err);
      }

      return new Failure(new Error(toString(err)));
    }
  },

  /**
   * ofPromise is like `Result.of` but takes a closure that returns a promise.
   * The returned promise will always resolve to a Result.
   */
  async ofPromise<S>(this: void, catching: () => Promise<S>): Promise<Result<S, Error>> {
    try {
      return new Success(await catching());
    } catch (err: unknown) {
      if (isJSError(err)) {
        return new Failure(err);
      }

      return new Failure(new Error(toString(err)));
    }
  },

  /**
   * Takes a function that can throw an error and returns a version
   * that returns a `Result`.
   */
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  resultify<F extends (...args: any) => any>(
    this: void,
    fn: F,
  ): (...args: Parameters<F>) => Result<ReturnType<F>, Error> {
    return (...args): Result<ReturnType<F>, Error> => {
      try {
        // @ts-expect-error This is a case where we know better
        return new Success(fn(...args));
      } catch (err: unknown) {
        if (isJSError(err)) {
          return new Failure(err);
        }

        return new Failure(new Error(toString(err)));
      }
    };
  },

  /**
   * Takes a function that returns a promise and returns a version
   * that always resolves to a `Result`.
   */
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  resultifyPromise<F extends (...args: any) => Promise<any>>(
    this: void,
    fn: F,
  ): (...args: Parameters<F>) => Promise<Result<ExtractPromise<ReturnType<F>>, Error>> {
    return (...args): Promise<Result<ExtractPromise<ReturnType<F>>, Error>> => {
      return new Promise((resolve) => {
        // @ts-expect-error This is a case where we know better
        fn(...args)
          .then((val) => {
            resolve(new Success(val));
          })
          .catch((err: unknown) => {
            if (isJSError(err)) {
              resolve(new Failure(err));
              return;
            }

            resolve(new Failure(new Error(toString(err))));
          });
      });
    };
  },
};
