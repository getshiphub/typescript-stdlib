// Copyright (c) 2020 Christopher Szatmary <cs@christopherszatmary.com>
// All rights reserved. MIT License.

// This code has been ported largely from the Go library pkg/errors
// Copyright (c) 2015, Dave Cheney <dave@cheney.net>
// All rights reserved.
// https://github.com/pkg/errors/blob/master/LICENSE

/**
 * isError returns whether or not an error implements the
 * `error` interface.
 */
export function isError(err: unknown): err is error {
  if (err == null) {
    return false;
  }

  const e = err as error;
  return typeof e.error === "function" && typeof e.detailedError === "function";
}

/** A trivial implementation of error. A string message. */
class ErrorString {
  str: string;

  constructor(str: string) {
    this.str = str;
  }

  error(): string {
    return this.str;
  }

  detailedError(): string {
    return this.str;
  }
}

// JS unfortunately doesn't have structs so this will have to do
// A class seems overkill for this
/** Returns a new error from the given text. */
export function errorString(str: string): error {
  return new ErrorString(str);
}

/**
 * A fundamental error type implementing the `error` interface.
 * Contains a message and a stack trace.
 */
class FundamentalError {
  msg: string;
  stack: string;

  constructor(msg: string, stack: string) {
    this.msg = msg;
    this.stack = stack;
  }

  error(): string {
    return this.msg;
  }

  detailedError(): string {
    return `${this.msg}\n${this.stack}`;
  }

  stackTrace(): string {
    return this.stack;
  }
}

class ErrorWithStack {
  err: error;
  stack: string;

  constructor(err: error, stack: string) {
    this.err = err;
    this.stack = stack;
  }

  error(): string {
    return this.err.error();
  }

  detailedError(): string {
    return `${this.cause().detailedError()}\n${this.stack}`;
  }

  cause(): error {
    return this.err;
  }

  stackTrace(): string {
    return this.stack;
  }
}

class ErrorWithMessage {
  err: error;
  msg: string;

  constructor(err: error, msg: string) {
    this.err = err;
    this.msg = msg;
  }

  error(): string {
    return `${this.msg}: ${this.err.error()}`;
  }

  detailedError(): string {
    return `${this.cause().detailedError()}\n${this.msg}`;
  }

  cause(): error {
    return this.err;
  }
}

/**
 * JSError is a wrapper over the `Error` type which implements the
 * `error` interface. This allows the original JS error to be preserved.
 */
export class JSError {
  jsError: Error;

  constructor(error: Error) {
    this.jsError = error;
  }

  error(): string {
    return this.jsError.toString();
  }

  detailedError(): string {
    /* istanbul ignore next */
    return this.jsError.stack ?? "";
  }

  stackTrace(): string {
    // Stack is lazily computed when first accessed so it should never be undefined
    // This makes TS happy though
    /* istanbul ignore next */
    const stack = this.jsError.stack ?? "";
    const i = stack.indexOf("\n") + 1;
    return stack.slice(i);
  }
}

/**
 * Creates a new error with the given message.
 * It also records the stack trace at the point it was called.
 */
export function newError(msg: string): error {
  // Stack is lazily computed when first accessed so it should never be undefined
  // This makes TS happy though
  /* istanbul ignore next */
  const stack = new Error().stack ?? "";

  // Remove first 2 lines from stack trace
  // First line is `Error:`
  // second line is where the error was created
  const i = stack.indexOf("\n", stack.indexOf("\n") + 1) + 1;

  return new FundamentalError(msg, stack.slice(i));
}

/** Creates a new error from the given JS Error. */
export function fromJSError(jsError: Error): error {
  return new JSError(jsError);
}

/**
 * Annotates err with a stack trace at the point withStack was called.
 * If err is `undefined`, withStack returns `undefined`.
 */
export function withStack(err: undefined): undefined;
export function withStack(err: error): error;
export function withStack(err: error | undefined): error | undefined;
export function withStack(err: error | undefined): error | undefined {
  if (err === undefined) {
    return undefined;
  }

  /* istanbul ignore next */
  const stack = new Error().stack ?? "";
  const i = stack.indexOf("\n", stack.indexOf("\n") + 1) + 1;

  return new ErrorWithStack(err, stack.slice(i));
}

/**
 * Annotates an error with a given message.
 * If err is `undefined`, withMessage returns `undefined`.
 */
export function withMessage(err: undefined, msg: string): undefined;
export function withMessage(err: error, msg: string): error;
export function withMessage(err: error | undefined, msg: string): error | undefined;
export function withMessage(err: error | undefined, msg: string): error | undefined {
  if (err === undefined) {
    return undefined;
  }

  return new ErrorWithMessage(err, msg);
}

/**
 * Returns an error annotating err with a stack trace at the point
 * Wrap is called and the given message.
 */
export function wrap(err: undefined, msg: string): undefined;
export function wrap(err: error, msg: string): error;
export function wrap(err: error | undefined, msg: string): error | undefined;
export function wrap(err: error | undefined, msg: string): error | undefined {
  if (err === undefined) {
    return undefined;
  }

  /* istanbul ignore next */
  const stack = new Error().stack ?? "";
  const i = stack.indexOf("\n", stack.indexOf("\n") + 1) + 1;

  const newErr = new ErrorWithMessage(err, msg);
  return new ErrorWithStack(newErr, stack.slice(i));
}

interface Causer {
  cause(): error;
}

function isCauser(err: unknown): err is Causer {
  if (err == null) {
    return false;
  }

  return typeof (err as Causer).cause === "function";
}

/**
 * Returns the underlying cause of the error if it exists.
 * This function will continue calling the `cause` method until an error
 * is encountered that doesn't have a `cause` method.
 * If the error does not implement the Cause interface the original error will be returned.
 */
export function cause(err: undefined): undefined;
export function cause(err: error): error;
export function cause(err: error | undefined): error | undefined;
export function cause(err: error | undefined): error | undefined {
  let e = err;

  while (e !== undefined) {
    if (isCauser(e)) {
      e = e.cause();
    } else {
      break;
    }
  }

  return e;
}

/**
 * unwrap returns the result of calling the `cause` method on `err`,
 * if `err`'s type contains an unwrap method returning an error.
 * Otherwise, unwrap returns `undefined`.
 */
export function unwrap(err: error | undefined): error | undefined {
  if (!isCauser(err)) {
    return undefined;
  }

  return err.cause();
}

interface Is {
  is(err: error): boolean;
}

function hasIs(err: unknown): err is Is {
  if (err == null) {
    return false;
  }

  return typeof (err as Is).is === "function";
}

/**
 * Reports whether any error in `err`'s chain matches `target`.
 * The chain consists of `err` followed by a sequence of errors
 * obtained by repeatedly calling `cause`.
 * An error is considered a match to target if it is equal to
 * that target or implements a method `is(error): boolean`
 * such that `is(target)` returns true.
 */
export function is(err: error | undefined, target: error | undefined): boolean {
  if (target === undefined) {
    return err === target;
  }

  let e = err;
  while (true) {
    if (e === target) {
      return true;
    } else if (hasIs(e) && e.is(target)) {
      return true;
    }

    const cerr = cause(e);
    // End of the chain
    if (cerr === e) {
      return false;
    }

    e = cerr;
  }
}

/** StackTracer represents any type that can produce a stack trace. */
export interface StackTracer {
  stackTrace(): string;
}

/**
 * isStackTracer returns whether or not a given value implements
 * the `StackTracer` interface.
 */
export function isStackTracer(err: unknown): err is StackTracer {
  if (err == null) {
    return false;
  }

  return typeof (err as StackTracer).stackTrace === "function";
}
