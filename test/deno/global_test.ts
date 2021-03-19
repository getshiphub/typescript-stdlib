import * as testing from "./testing.ts";
import { Ref, Result, errors, panic, recover, time, util } from "../../dist/deno/mod.ts";

Deno.test("panic", () => {
  const tests: [unknown, string][] = [
    ["something broke", "something broke"],
    [errors.errorString("something broke"), "something broke"],
    [10, "10"],
    [{ error: "oops" }, `{ error: "oops" }`],
    [undefined, "undefined"],
    [null, "null"],
    // Stringer
    [new util.SemVer(1, 5, 12), "1.5.12"],
  ];

  for (const [v, expected] of tests) {
    testing.assertPanics(() => {
      panic(v);
    }, expected);
  }
});

Deno.test("recover", () => {
  const tests: [unknown][] = [
    ["something broke"],
    [errors.errorString("something broke")],
    [10],
    [{ error: "oops" }],
    [undefined],
    [null],
    // Stringer
    [new util.SemVer(1, 5, 12)],
  ];

  for (const [v] of tests) {
    try {
      panic(v);
    } catch (e) {
      const cause = recover(e);
      // TODO(@cszatmary): This feels brittle because it relies on
      // reference equality. See if there's a better way to do this.
      testing.assertStrictEquals(cause, v);
      continue;
    }

    testing.fail("no panic was recovered");
  }
});

Deno.test("recover: undefined", () => {
  testing.assertEquals(recover(undefined), undefined);
});

Deno.test("recover: not a panic", () => {
  testing.assertPanics(() => {
    const e = new Error("some error");
    recover(e);
  }, "Error: some error");
});

Deno.test("Ref", () => {
  const ref1 = new Ref(10);
  const ref2 = ref1;
  ref2.set(20);

  testing.assertEquals(ref1.deref(), 20);
  testing.assertEquals(ref2.deref(), 20);
});

Deno.test("Ref: inspect", () => {
  const ref = new Ref(10);
  const s = Deno.inspect(ref);
  testing.assertEquals(s, "Ref(10)");
});

Deno.test("Result.success", () => {
  const r = Result.success(10);
  testing.assertEquals(r.isSuccess(), true);
  testing.assertEquals(r.isFailure(), false);
});

Deno.test("Result.failure", () => {
  const r = Result.failure(new Error("Oh no!"));
  testing.assertEquals(r.isFailure(), true);
  testing.assertEquals(r.isSuccess(), false);
});

Deno.test("Result.of: Success", () => {
  const r = Result.of(() => {
    return 2;
  });
  testing.assert(r.isSuccess());
});

Deno.test("Results.of: Failure", () => {
  const r = Result.of(() => {
    throw new Error("Oh no!");
  });
  testing.assert(r.isFailure());
});

Deno.test("Result.ofPromise: Success", async () => {
  const r = await Result.ofPromise(async () => {
    await time.sleep(10);
    return 2;
  });
  testing.assert(r.isSuccess());
});

Deno.test("Result.ofPromise: Failure", async () => {
  const r = await Result.ofPromise(async () => {
    await time.sleep(10);
    throw new Error("Oh no!");
  });
  testing.assert(r.isFailure());
});

Deno.test("Result: unwrap: returns the value when the result a Success", () => {
  const r = Result.success(10);
  testing.assertEquals(r.unwrap(), 10);
});

Deno.test("Result: unwrap: panics with message", () => {
  const r = Result.failure("Oh no!");
  testing.assertPanics(() => {
    r.unwrap("Something broke");
  }, "Something broke: Oh no!");
});

Deno.test("Result: unwrap: panic", () => {
  const r = Result.failure("Oh no!");
  testing.assertPanics(() => {
    r.unwrap();
  }, "Oh no!");
});

Deno.test("Result: unwrap: panic with message and stringified failure", () => {
  const r = Result.failure(errors.errorString("oops"));
  testing.assertPanics(() => {
    r.unwrap("Something broke");
  }, "Something broke: oops");
});

Deno.test("Result: unwrapFailure: panics with message", () => {
  const r = Result.success(10);
  testing.assertPanics(() => {
    r.unwrapFailure("Something broke");
  }, "Something broke: 10");
});

Deno.test("Result: unwrapFailure: panic", () => {
  const r = Result.success(10);
  testing.assertPanics(() => {
    r.unwrapFailure();
  }, "10");
});

Deno.test("Result: unwrapFailure", () => {
  const r = Result.failure("Oh no!");
  testing.assertEquals(r.unwrapFailure(), "Oh no!");
});

Deno.test("Result: unwrapFailure: panic with message and stringified success", () => {
  const r = Result.success(new util.SemVer(1, 5, 12));
  testing.assertPanics(() => {
    r.unwrapFailure("Something broke");
  }, "Something broke: 1.5.12");
});

Deno.test("Result: success", () => {
  const r = Result.success(10);
  testing.assertEquals(r.success(), 10);
});

Deno.test("Result: success: undefined", () => {
  const r = Result.failure("Oh no!");
  testing.assertEquals(r.success(), undefined);
});

Deno.test("Result: failure: undefined", () => {
  const r = Result.success(10);
  testing.assertEquals(r.failure(), undefined);
});

Deno.test("Result: failure", () => {
  const r = Result.failure("Oh no!");
  testing.assertEquals(r.failure(), "Oh no!");
});

Deno.test("Result: map", () => {
  const r = Result.success(10);
  const newR = r.map((v) => v + 10);
  testing.assertNotStrictEquals(newR, r);
  testing.assertEquals(newR.success(), 20);
});

Deno.test("Result: map: failure", () => {
  const err = "Oh no!";
  const r = Result.failure<number, string>(err);
  const newR = r.map((v) => v + 10);
  testing.assertNotStrictEquals(newR, r);
  testing.assertEquals(newR.failure(), err);
});

Deno.test("Result: mapFailure: success", () => {
  const r = Result.success<number, string>(10);
  const newR = r.mapFailure((e) => errors.newError(e));
  testing.assertNotStrictEquals(newR, r);
  testing.assertEquals(newR.success(), 10);
});

Deno.test("Result: mapFailure", () => {
  const err = "Oh no!";
  const r = Result.failure<number, string>(err);
  const newR = r.mapFailure((e) => errors.newError(e));
  testing.assertNotStrictEquals(newR, r);
  testing.assertEquals(newR.failure()?.error(), err);
});

Deno.test("Result: flatMap", () => {
  const r = Result.success(10);
  const newR = r.flatMap((v) => Result.success(v + 10));
  testing.assertNotStrictEquals(newR, r);
  testing.assertEquals(newR.success(), 20);
});

Deno.test("Result: flatMap: failure", () => {
  const err = "Oh no!";
  const r = Result.failure<number, string>(err);
  const newR = r.flatMap((v) => Result.success(v + 10));
  testing.assertNotStrictEquals(newR, r);
  testing.assertEquals(newR.failure(), err);
});

Deno.test("Result: flatMapFailure: success", () => {
  const r = Result.success<number, string>(10);
  const newR = r.flatMapFailure((e) => Result.failure(errors.newError(e)));
  testing.assertNotStrictEquals(newR, r);
  testing.assertEquals(newR.success(), 10);
});

Deno.test("Result: flatMapFailure", () => {
  const err = "Oh no!";
  const r = Result.failure<number, string>(err);
  const newR = r.flatMapFailure((e) => Result.failure(errors.newError(e)));
  testing.assertNotStrictEquals(newR, r);
  testing.assertEquals(newR.failure()?.error(), err);
});

Deno.test("Result.resultify", () => {
  function divide(a: number, b: number): number {
    if (b === 0) {
      throw new Error("Cannot divide by zero!");
    }

    return a / b;
  }

  const resultifiedDivide = Result.resultify(divide);
  const s = resultifiedDivide(6, 3);
  const f = resultifiedDivide(6, 0);

  testing.assertEquals(s.success(), 2);
  testing.assertEquals(f.failure()?.message, "Cannot divide by zero!");
});

Deno.test("Result.resultifyPromise", async () => {
  function divide(a: number, b: number): Promise<number> {
    if (b === 0) {
      return Promise.reject(new Error("Cannot divide by zero!"));
    }

    return Promise.resolve(a / b);
  }

  const resultifiedDivide = Result.resultifyPromise(divide);
  const s = await resultifiedDivide(6, 3);
  const f = await resultifiedDivide(6, 0);

  testing.assertEquals(s.success(), 2);
  testing.assertEquals(f.failure()?.message, "Cannot divide by zero!");
});

Deno.test("Result: inspect", () => {
  const success = Result.success(10);
  const failure = Result.failure("oh no!");
  const s1 = Deno.inspect(success);
  const s2 = Deno.inspect(failure);
  testing.assertEquals(s1, "Result.success(10)");
  testing.assertEquals(s2, "Result.failure(oh no!)");
});

Deno.test("Result: inspect: error failure", () => {
  const failure = Result.failure(errors.errorString("err something blew up"));
  const s = Deno.inspect(failure);
  testing.assertEquals(s, "Result.failure(err something blew up)");
});
