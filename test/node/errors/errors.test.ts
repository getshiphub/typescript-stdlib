import { errors } from "../../../src";

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

describe("errors", () => {
  const ioErr = errors.errorString("IO Error");

  test("errors.isError: true", () => {
    const err = errors.errorString("foo");
    expect(errors.isError(err)).toBe(true);
  });

  test("errors.isError: false", () => {
    const notErr = "not an error";
    expect(errors.isError(notErr)).toBe(false);
    expect(errors.isError(undefined)).toBe(false);
    expect(errors.isError(null)).toBe(false);
  });

  test("errors.errorString", () => {
    const err = errors.errorString("foo");
    expect(err.error()).toBe("foo");
    expect(err.detailedError()).toBe("foo");
  });

  test("errors.newError", () => {
    const err = errors.newError("foo");
    expect(err.error()).toBe("foo");
  });

  test("errors.newError: same values", () => {
    const err = errors.newError("foo");
    const otherErr = errors.newError("foo");
    expect(err.error()).toBe(otherErr.error());
  });

  test("errors.fromJSError", () => {
    const jsErr = new TypeError("invalid type");
    const err = errors.fromJSError(jsErr);
    expect(err.error()).toBe("TypeError: invalid type");
  });

  test("errors.withStack: undefined", () => {
    const err = errors.withStack(undefined);
    expect(err).toBeUndefined();
  });

  test("errors.withStack: new error", () => {
    const err = errors.withStack(ioErr);
    expect(err.error()).toBe("IO Error");
  });

  test("errors.withStack: wrap error", () => {
    const err = errors.withStack(errors.withStack(ioErr));
    expect(err.error()).toBe("IO Error");
  });

  test("errors.withStack: error or undefined", () => {
    const err1 = undefined as error | undefined;
    const err2 = errors.newError("oops") as error | undefined;

    expect(errors.withStack(err1)).toBeUndefined();
    expect(errors.withStack(err2)).toBeDefined();
  });

  test("errors.withMessage: undefined", () => {
    const err = errors.withMessage(undefined, "no error");
    expect(err).toBeUndefined();
  });

  test("errors.withMessage: new error", () => {
    const err = errors.withMessage(ioErr, "error reading file");
    expect(err.error()).toBe("error reading file: IO Error");
  });

  test("errors.withMessage: wrap error", () => {
    const err = errors.withMessage(
      errors.withMessage(ioErr, "error reading file"),
      "error loading config",
    );
    expect(err.error()).toBe("error loading config: error reading file: IO Error");
  });

  test("errors.withMessage: error or undefined", () => {
    const err1 = undefined as error | undefined;
    const err2 = errors.newError("oops") as error | undefined;

    expect(errors.withMessage(err1, "oh no")).toBeUndefined();
    expect(errors.withMessage(err2, "oh no")).toBeDefined();
  });

  test("errors.wrap: undefined", () => {
    const err = errors.wrap(undefined, "no error");
    expect(err).toBeUndefined();
  });

  test("errors.wrap: one error", () => {
    const err = errors.wrap(ioErr, "error reading file");
    expect(err.error()).toBe("error reading file: IO Error");
  });

  test("errors.wrap: nested errors", () => {
    const err = errors.wrap(errors.wrap(ioErr, "error reading file"), "error loading config");
    expect(err.error()).toBe("error loading config: error reading file: IO Error");
    // Check that the error is printed with a stack trace
    expect(err.detailedError()).toMatch(
      /^IO Error\nerror reading file\n\s+at\s(?:.+?)\s\(.*test\/node\/errors\/errors\.test\.ts/m,
    );
  });

  test("errors.wrap: error or undefined", () => {
    const err1 = undefined as error | undefined;
    const err2 = errors.newError("oops") as error | undefined;

    expect(errors.wrap(err1, "oh no")).toBeUndefined();
    expect(errors.wrap(err2, "oh no")).toBeDefined();
  });

  test("errors.cause: undefined", () => {
    const err = errors.cause(undefined);
    expect(err).toBeUndefined();
  });

  test("errors.cause: no cause", () => {
    const err = errors.newError("oops");
    const cause = errors.cause(err);
    expect(cause).toBe(err);
  });

  test("errors.cause: wrap", () => {
    const err = errors.wrap(ioErr, "wrapped");
    const cause = errors.cause(err);
    expect(cause).toBe(ioErr);
  });

  test("errors.cause: withStack", () => {
    const err = errors.withStack(ioErr);
    const cause = errors.cause(err);
    expect(cause).toBe(ioErr);
  });

  test("errors.cause: withMessage", () => {
    const err = errors.withMessage(ioErr, "wrapped");
    const cause = errors.cause(err);
    expect(cause).toBe(ioErr);
  });

  test("errors.cause: multiple wrapped errors", () => {
    let err = errors.wrap(ioErr, "wrap 1");
    err = errors.wrap(err, "wrap 2");
    const cause = errors.cause(err);
    expect(cause).toBe(ioErr);
  });

  test("errors.unwrap: undefined", () => {
    const err = errors.unwrap(undefined);
    expect(err).toBeUndefined();
  });

  test("errors.unwrap: no cause", () => {
    const err = errors.newError("oops");
    const cause = errors.unwrap(err);
    expect(cause).toBeUndefined();
  });

  test("errors.unwrap: cause after wrap", () => {
    const err = errors.withMessage(ioErr, "wrapped");
    const cause = errors.unwrap(err);
    expect(cause).toBe(ioErr);
  });

  test("errors.is: errors equal", () => {
    const err = errors.errorString("oops");
    expect(errors.is(err, err)).toBe(true);
  });

  test("errors.is: target is in err's chain", () => {
    const err1 = errors.newError("oops");
    const err2 = errors.wrap(err1, "oops2");
    const err3 = errors.wrap(err2, "oops3");

    expect(errors.is(err2, err1)).toBe(true);
    expect(errors.is(err3, err1)).toBe(true);
  });

  test("errors.is: error implements Is", () => {
    const err1 = errors.newError("oops");
    const err2 = errors.wrap(err1, "oops2");
    const err3 = errors.wrap(err2, "oops3");
    const exErr = new ExampleError("either 1 or 3", (err) => {
      return err === err1 || err === err3;
    });

    expect(errors.is(exErr, err1)).toBe(true);
    expect(errors.is(exErr, err3)).toBe(true);
  });

  test("errors.is: not equal", () => {
    const err1 = errors.errorString("oops");
    const err2 = errors.errorString("oops2");

    expect(errors.is(err2, err1)).toBe(false);
  });

  test("errors.is: target is not in err's chain", () => {
    const err1 = errors.newError("oops");
    const err2 = errors.newError("oops2");
    const err3 = errors.wrap(err2, "oops3");

    expect(errors.is(err3, err1)).toBe(false);
  });

  test.each([
    ["undefined is undefined", undefined, undefined, true],
    ["undefined is not target", undefined, errors.errorString("oops"), false],
    ["err is not undefined", errors.errorString("oops"), undefined, false],
  ])("errors.is: %s", (_name, err, target, expected) => {
    expect(errors.is(err, target)).toBe(expected);
  });

  test.each([
    ["implements StackTracer", errors.newError("oops"), true],
    ["doesn't implement StackTracer", errors.errorString("nope"), false],
    ["err is undefined", undefined, false],
  ])("errors.isStackTracer: %s", (_name, err, expected) => {
    expect(errors.isStackTracer(err)).toBe(expected);
  });
});
