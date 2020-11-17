import * as testing from "../testing.ts";
import { errors, fatal } from "../../../dist/deno/mod.ts";

const envVarName = "FATAL_TEST_CHILD";
const testPath = "test/deno/fatal/fatal_test.ts";

Deno.test("fatal.exitErr: no detail", async () => {
  // Subtest
  if (Deno.env.get(envVarName) === "true") {
    fatal.exitErr(errors.newError("Shoot"), "Error message");
  }

  const { code, stderrData } = await testing.runSubprocessTest(
    "/^fatal.exitErr: no detail$/",
    testPath,
    {
      [envVarName]: "true",
    },
  );

  testing.assertStringIncludes(stderrData.toString(), "Error message\nError: Shoot\n");
  testing.assertEquals(code, 1);
});

Deno.test("fatal.exitErr: show detail", async () => {
  // Subtest
  if (Deno.env.get(envVarName) === "true") {
    fatal.showErrDetail(true);
    fatal.exitErr(errors.newError("Shoot"), "Error message");
  }

  const { code, stderrData } = await testing.runSubprocessTest(
    "/^fatal.exitErr: show detail$/",
    testPath,
    {
      [envVarName]: "true",
    },
  );

  // Check that the error is printed with a stack trace
  testing.assertMatch(stderrData.toString(), /Error message\nError: Shoot\n\s+at\sfatal_test\.ts/m);
  testing.assertEquals(code, 1);
});

Deno.test("fatal.exit", async () => {
  // Subtest
  if (Deno.env.get(envVarName) === "true") {
    fatal.exit("Something went wrong");
  }

  const { code, stderrData } = await testing.runSubprocessTest("/^fatal.exit$/", testPath, {
    [envVarName]: "true",
  });

  testing.assertStringIncludes(stderrData.toString(), "Something went wrong\n");
  testing.assertEquals(code, 1);
});
