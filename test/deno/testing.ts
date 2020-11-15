import { AssertionError } from "https://deno.land/std@0.76.0/testing/asserts.ts";
import { recover } from "../../dist/deno/mod.ts";

export * from "https://deno.land/std@0.76.0/testing/asserts.ts";

/**
 * assertPanics executes a function, expecting it to panic. If it does not
 * panic, or it throws an error, an AssertionError will be thrown.
 * A string that should be included in the panic message can also be asserted.
 */
export function assertPanics<T = void>(fn: () => T, msgIncludes = "", msg = ""): void {
  let thrown: unknown;
  try {
    fn();
  } catch (e: unknown) {
    thrown = e;
  }

  let end = ".";
  if (msg !== "") {
    end = `: ${msg}`;
  }

  if (thrown === undefined) {
    throw new AssertionError(`Expected function to panic${end}`);
  }

  // Make sure it was actually a panic that was thrown
  try {
    recover(thrown);
  } catch {
    // recover will panic if thrown was not a panic
    // so if we got here then there wasn't a panic
    const m = `Expected function to panic, instead it threw an error: ${thrown}${end}`;
    throw new AssertionError(m);
  }

  const e = thrown as Error;
  if (msgIncludes !== "" && !e.message.includes(msgIncludes)) {
    const m = `Expected panic message to include "${msgIncludes}", but got "${e.message}"${end}`;
    throw new AssertionError(m);
  }
}
