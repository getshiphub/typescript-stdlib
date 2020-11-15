/* eslint-disable no-restricted-syntax */

import { inspect } from "util";
import { Ref, Result, errors, panic, recover, util } from "../../src";

describe("global.ts", () => {
  test.each([
    ["string", "something broke", "something broke"],
    ["error", errors.errorString("something broke"), "something broke"],
    ["number", 10, "10"],
    ["object", { error: "oops" }, "{ error: 'oops' }"],
    ["undefined", undefined, "undefined"],
    ["null", null, "null"],
    ["value that implements Stringer", new util.SemVer(1, 5, 12), "1.5.12"],
  ])("panic: %s", (_name, v, expected) => {
    expect(() => {
      panic(v);
    }).toPanic(expected);
  });

  test.each([
    ["string", "something broke"],
    ["error", errors.errorString("something broke")],
    ["number", 10],
    ["object", { error: "oops" }],
    ["undefined", undefined],
    ["null", null],
    ["value that implements Stringer", new util.SemVer(1, 5, 12)],
  ])("recover: %s", (_name, v) => {
    try {
      panic(v);
    } catch (e) {
      const cause = recover(e);
      // TODO(@cszatmary): This feels brittle because it relies on
      // reference equality. See if there's a better way to do this.
      expect(cause).toBe(v);
      return;
    }

    fail("no panic was recovered");
  });

  test("recover: undefined", () => {
    expect(recover(undefined)).toBeUndefined();
  });

  test("recover: not a panic", () => {
    expect(() => {
      const e = new Error("some error");
      recover(e);
    }).toPanic("Error: some error");
  });

  test("Ref", () => {
    const ref1 = new Ref(10);
    const ref2 = ref1;
    ref2.set(20);

    expect(ref1.deref()).toBe(20);
    expect(ref2.deref()).toBe(20);
  });

  test("Ref: inspect", () => {
    const ref = new Ref(10);
    const s = inspect(ref);
    expect(s).toBe("Ref(10)");
  });

  test("Result.success", () => {
    const r = Result.success(10);
    expect(r.isSuccess()).toBe(true);
    expect(r.isFailure()).toBe(false);
  });

  test("Result.failure", () => {
    const r = Result.failure(new Error("Oh no!"));
    expect(r.isFailure()).toBe(true);
    expect(r.isSuccess()).toBe(false);
  });

  test("Result.of: Success", () => {
    const r = Result.of(() => {
      return 2;
    });
    expect(r).toBeSuccess();
  });

  test("Results.of: Failure", () => {
    const r = Result.of(() => {
      throw new Error("Oh no!");
    });
    expect(r).toBeFailure();
  });

  test("Result.ofPromise: Success", async () => {
    const r = await Result.ofPromise(async () => {
      return 2;
    });
    expect(r).toBeSuccess();
  });

  test("Result.ofPromise: Failure", async () => {
    const r = await Result.ofPromise(async () => {
      throw new Error("Oh no!");
    });
    expect(r).toBeFailure();
  });

  test("Result: unwrap: returns the value when the result a Success", () => {
    const r = Result.success(10);
    expect(r.unwrap()).toBe(10);
  });

  test("Result: unwrap: panics with message", () => {
    const r = Result.failure("Oh no!");
    expect(() => {
      r.unwrap("Something broke");
    }).toPanic("Something broke: Oh no!");
  });

  test("Result: unwrap: panic", () => {
    const r = Result.failure("Oh no!");
    expect(() => {
      r.unwrap();
    }).toPanic("Oh no!");
  });

  test("Result: unwrap: panic with message and stringified failure", () => {
    const r = Result.failure(errors.errorString("oops"));
    expect(() => {
      r.unwrap("Something broke");
    }).toPanic("Something broke: oops");
  });

  test("Result: unwrapFailure: panics with message", () => {
    const r = Result.success(10);
    expect(() => {
      r.unwrapFailure("Something broke");
    }).toPanic("Something broke: 10");
  });

  test("Result: unwrapFailure: panic", () => {
    const r = Result.success(10);
    expect(() => {
      r.unwrapFailure();
    }).toPanic("10");
  });

  test("Result: unwrapFailure", () => {
    const r = Result.failure("Oh no!");
    expect(r.unwrapFailure()).toBe("Oh no!");
  });

  test("Result: unwrapFailure: panic with message and stringified success", () => {
    const r = Result.success(new util.SemVer(1, 5, 12));
    expect(() => {
      r.unwrapFailure("Something broke");
    }).toPanic("Something broke: 1.5.12");
  });

  test("Result: success", () => {
    const r = Result.success(10);
    expect(r.success()).toBe(10);
  });

  test("Result: success: undefined", () => {
    const r = Result.failure("Oh no!");
    expect(r.success()).toBeUndefined();
  });

  test("Result: failure: undefined", () => {
    const r = Result.success(10);
    expect(r.failure()).toBeUndefined();
  });

  test("Result: failure", () => {
    const r = Result.failure("Oh no!");
    expect(r.failure()).toBe("Oh no!");
  });

  test("Result: map", () => {
    const r = Result.success(10);
    const newR = r.map((v) => v + 10);
    expect(newR).not.toBe(r);
    expect(newR.success()).toBe(20);
  });

  test("Result: map: failure", () => {
    const err = "Oh no!";
    const r = Result.failure<number, string>(err);
    const newR = r.map((v) => v + 10);
    expect(newR).not.toBe(r);
    expect(newR.failure()).toBe(err);
  });

  test("Result: mapFailure: success", () => {
    const r = Result.success<number, string>(10);
    const newR = r.mapFailure((e) => errors.newError(e));
    expect(newR).not.toBe(r);
    expect(newR.success()).toBe(10);
  });

  test("Result: mapFailure", () => {
    const err = "Oh no!";
    const r = Result.failure<number, string>(err);
    const newR = r.mapFailure((e) => errors.newError(e));
    expect(newR).not.toBe(r);
    expect(newR.failure()?.error()).toBe(err);
  });

  test("Result: flatMap", () => {
    const r = Result.success(10);
    const newR = r.flatMap((v) => Result.success(v + 10));
    expect(newR).not.toBe(r);
    expect(newR.success()).toBe(20);
  });

  test("Result: flatMap: failure", () => {
    const err = "Oh no!";
    const r = Result.failure<number, string>(err);
    const newR = r.flatMap((v) => Result.success(v + 10));
    expect(newR).not.toBe(r);
    expect(newR.failure()).toBe(err);
  });

  test("Result: flatMapFailure: success", () => {
    const r = Result.success<number, string>(10);
    const newR = r.flatMapFailure((e) => Result.failure(errors.newError(e)));
    expect(newR).not.toBe(r);
    expect(newR.success()).toBe(10);
  });

  test("Result: flatMapFailure", () => {
    const err = "Oh no!";
    const r = Result.failure<number, string>(err);
    const newR = r.flatMapFailure((e) => Result.failure(errors.newError(e)));
    expect(newR).not.toBe(r);
    expect(newR.failure()?.error()).toBe(err);
  });

  test("Result.resultify", () => {
    function divide(a: number, b: number): number {
      if (b === 0) {
        throw new Error("Cannot divide by zero!");
      }

      return a / b;
    }

    const resultifiedDivide = Result.resultify(divide);
    const s = resultifiedDivide(6, 3);
    const f = resultifiedDivide(6, 0);

    expect(s.success()).toBe(2);
    expect(f.failure()?.message).toBe("Cannot divide by zero!");
  });

  test("Result.resultifyPromise", async () => {
    function divide(a: number, b: number): Promise<number> {
      if (b === 0) {
        return Promise.reject(new Error("Cannot divide by zero!"));
      }

      return Promise.resolve(a / b);
    }

    const resultifiedDivide = Result.resultifyPromise(divide);
    const s = await resultifiedDivide(6, 3);
    const f = await resultifiedDivide(6, 0);

    expect(s.success()).toBe(2);
    expect(f.failure()?.message).toBe("Cannot divide by zero!");
  });

  test("Result: inspect", () => {
    const success = Result.success(10);
    const failure = Result.failure("oh no!");
    const s1 = inspect(success);
    const s2 = inspect(failure);
    expect(s1).toBe("Result.success(10)");
    expect(s2).toBe("Result.failure(oh no!)");
  });

  test("Result: inspect: error failure", () => {
    const failure = Result.failure(errors.errorString("err something blew up"));
    const s = inspect(failure);
    expect(s).toBe("Result.failure(err something blew up)");
  });
});
