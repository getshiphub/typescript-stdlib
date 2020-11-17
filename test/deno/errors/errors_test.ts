import * as testing from "../testing.ts";
import { errors } from "../../../dist/deno/mod.ts";

class ExampleError {
  #msg: string;
  #f: (err: error) => boolean;

  constructor(msg: string, f: (err: error) => boolean) {
    this.#msg = msg;
    this.#f = f;
  }

  error(): string {
    return this.#msg;
  }

  detailedError(): string {
    return this.#msg;
  }

  is(err: error): boolean {
    return this.#f(err);
  }
}

const ioErr = errors.errorString("IO Error");

Deno.test("errors.isError: true", () => {
  const err = errors.errorString("foo");
  testing.assertEquals(errors.isError(err), true);
});

Deno.test("errors.isError: false", () => {
  const notErr = "not an error";
  testing.assertEquals(errors.isError(notErr), false);
  testing.assertEquals(errors.isError(undefined), false);
  testing.assertEquals(errors.isError(null), false);
});

Deno.test("errors.errorString", () => {
  const err = errors.errorString("foo");
  testing.assertEquals(err.error(), "foo");
  testing.assertEquals(err.detailedError(), "foo");
});

Deno.test("errors.newError", () => {
  const err = errors.newError("foo");
  testing.assertEquals(err.error(), "foo");
});

Deno.test("errors.newError: same values", () => {
  const err = errors.newError("foo");
  const otherErr = errors.newError("foo");
  testing.assertEquals(err.error(), otherErr.error());
});

Deno.test("errors.fromJSError", () => {
  const jsErr = new TypeError("invalid type");
  const err = errors.fromJSError(jsErr);
  testing.assertEquals(err.error(), "TypeError: invalid type");
});

Deno.test("errors.withStack: undefined", () => {
  const err = errors.withStack(undefined);
  testing.assertEquals(err, undefined);
});

Deno.test("errors.withStack: new error", () => {
  const err = errors.withStack(ioErr);
  testing.assertEquals(err.error(), "IO Error");
});

Deno.test("errors.withStack: wrap error", () => {
  const err = errors.withStack(errors.withStack(ioErr));
  testing.assertEquals(err.error(), "IO Error");
});

Deno.test("errors.withStack: error or undefined", () => {
  const err1 = undefined as error | undefined;
  const err2 = errors.newError("oops") as error | undefined;

  testing.assertEquals(errors.withStack(err1), undefined);
  testing.assert(errors.withStack(err2) !== undefined);
});

Deno.test("errors.withMessage: undefined", () => {
  const err = errors.withMessage(undefined, "no error");
  testing.assertEquals(err, undefined);
});

Deno.test("errors.withMessage: new error", () => {
  const err = errors.withMessage(ioErr, "error reading file");
  testing.assertEquals(err.error(), "error reading file: IO Error");
});

Deno.test("errors.withMessage: wrap error", () => {
  const err = errors.withMessage(
    errors.withMessage(ioErr, "error reading file"),
    "error loading config",
  );
  testing.assertEquals(err.error(), "error loading config: error reading file: IO Error");
});

Deno.test("errors.withMessage: error or undefined", () => {
  const err1 = undefined as error | undefined;
  const err2 = errors.newError("oops") as error | undefined;

  testing.assertEquals(errors.withMessage(err1, "oh no"), undefined);
  testing.assert(errors.withMessage(err2, "oh no") !== undefined);
});

Deno.test("errors.wrap: undefined", () => {
  const err = errors.wrap(undefined, "no error");
  testing.assertEquals(err, undefined);
});

Deno.test("errors.wrap: one error", () => {
  const err = errors.wrap(ioErr, "error reading file");
  testing.assertEquals(err.error(), "error reading file: IO Error");
});

Deno.test("errors.wrap: nested errors", () => {
  const err = errors.wrap(errors.wrap(ioErr, "error reading file"), "error loading config");
  testing.assertEquals(err.error(), "error loading config: error reading file: IO Error");
  // Check that the error is printed with a stack trace
  testing.assertMatch(
    err.detailedError(),
    /^IO Error\nerror reading file\n\s+at\serrors_test\.ts/m,
  );
});

Deno.test("errors.wrap: error or undefined", () => {
  const err1 = undefined as error | undefined;
  const err2 = errors.newError("oops") as error | undefined;

  testing.assertEquals(errors.wrap(err1, "oh no"), undefined);
  testing.assert(errors.wrap(err2, "oh no") !== undefined);
});

Deno.test("errors.cause: undefined", () => {
  const err = errors.cause(undefined);
  testing.assertEquals(err, undefined);
});

Deno.test("errors.cause: no cause", () => {
  const err = errors.newError("oops");
  const cause = errors.cause(err);
  testing.assertStrictEquals(cause, err);
});

Deno.test("errors.cause: wrap", () => {
  const err = errors.wrap(ioErr, "wrapped");
  const cause = errors.cause(err);
  testing.assertStrictEquals(cause, ioErr);
});

Deno.test("errors.cause: withStack", () => {
  const err = errors.withStack(ioErr);
  const cause = errors.cause(err);
  testing.assertStrictEquals(cause, ioErr);
});

Deno.test("errors.cause: withMessage", () => {
  const err = errors.withMessage(ioErr, "wrapped");
  const cause = errors.cause(err);
  testing.assertStrictEquals(cause, ioErr);
});

Deno.test("errors.cause: multiple wrapped errors", () => {
  let err = errors.wrap(ioErr, "wrap 1");
  err = errors.wrap(err, "wrap 2");
  const cause = errors.cause(err);
  testing.assertStrictEquals(cause, ioErr);
});

Deno.test("errors.unwrap: undefined", () => {
  const err = errors.unwrap(undefined);
  testing.assertEquals(err, undefined);
});

Deno.test("errors.unwrap: no cause", () => {
  const err = errors.newError("oops");
  const cause = errors.unwrap(err);
  testing.assertEquals(cause, undefined);
});

Deno.test("errors.unwrap: cause after wrap", () => {
  const err = errors.withMessage(ioErr, "wrapped");
  const cause = errors.unwrap(err);
  testing.assertStrictEquals(cause, ioErr);
});

Deno.test("errors.is: errors equal", () => {
  const err = errors.errorString("oops");
  testing.assertEquals(errors.is(err, err), true);
});

Deno.test("errors.is: target is in err's chain", () => {
  const err1 = errors.newError("oops");
  const err2 = errors.wrap(err1, "oops2");
  const err3 = errors.wrap(err2, "oops3");

  testing.assertEquals(errors.is(err2, err1), true);
  testing.assertEquals(errors.is(err3, err1), true);
});

Deno.test("errors.is: error implements Is", () => {
  const err1 = errors.newError("oops");
  const err2 = errors.wrap(err1, "oops2");
  const err3 = errors.wrap(err2, "oops3");
  const exErr = new ExampleError("either 1 or 3", (err) => {
    return err === err1 || err === err3;
  });

  testing.assertEquals(errors.is(exErr, err1), true);
  testing.assertEquals(errors.is(exErr, err3), true);
});

Deno.test("errors.is: not equal", () => {
  const err1 = errors.errorString("oops");
  const err2 = errors.errorString("oops2");

  testing.assertEquals(errors.is(err2, err1), false);
});

Deno.test("errors.is: target is not in err's chain", () => {
  const err1 = errors.newError("oops");
  const err2 = errors.newError("oops2");
  const err3 = errors.wrap(err2, "oops3");

  testing.assertEquals(errors.is(err3, err1), false);
});

Deno.test("errors.is", () => {
  const tests: [error | undefined, error | undefined, boolean][] = [
    [undefined, undefined, true],
    [undefined, errors.errorString("oops"), false],
    [errors.errorString("oops"), undefined, false],
  ];

  for (const [err, target, expected] of tests) {
    testing.assertEquals(errors.is(err, target), expected);
  }
});

Deno.test("errors.isStackTracer", () => {
  const tests: [error | undefined, boolean][] = [
    [errors.newError("oops"), true],
    [errors.errorString("nope"), false],
    [undefined, false],
  ];

  for (const [err, expected] of tests) {
    testing.assertEquals(errors.isStackTracer(err), expected);
  }
});
