import { AssertionError } from "https://deno.land/std@0.76.0/testing/asserts.ts";
import { recover, bytes } from "../../dist/deno/mod.ts";

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

export interface SubprocessTestResult {
  code: number;
  stderrData: bytes.DynamicBuffer;
}

/**
 * runSubprocessTest will run the given test in a subprocess.
 * This is useful for testing actions that affect the process,
 * for example `Deno.exit`.
 * @param testName The name of the test to execute, passed to
 * --filter flag.
 * @param testPath The path to the test file.
 * @param env Any env vars to set in the sub process.
 */
export async function runSubprocessTest(
  testName: string,
  testPath: string,
  env: Record<string, string>,
): Promise<SubprocessTestResult> {
  // Run test as a subprocess
  // Adapted from: https://talks.golang.org/2014/testing.slide#23
  const p = Deno.run({
    cmd: [Deno.execPath(), "test", "--allow-env", "--allow-read", "--filter", testName, testPath],
    env: {
      ...Deno.env.toObject(),
      ...env,
    },
    stderr: "piped",
  });

  const { code } = await p.status();
  const stderrData = await p.stderrOutput();
  p.close();

  return {
    code,
    stderrData: new bytes.DynamicBuffer(stderrData),
  };
}
