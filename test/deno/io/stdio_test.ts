import * as testing from "../testing.ts";
import { io } from "../../../dist/deno/mod.ts";

const envVarName = "IO_STDIO_TEST_CHILD";
const testPath = "test/deno/io/stdio_test.ts";

Deno.test("io: stdio: rid", () => {
  const stdout = io.stdout as unknown as { rid: number };
  const stderr = io.stderr as unknown as { rid: number };
  testing.assertEquals(stdout.rid, 1);
  testing.assertEquals(stderr.rid, 2);
});

Deno.test("io: stdio", async () => {
  // Subtest
  if (Deno.env.get(envVarName) === "true") {
    let r = await io.writeString(io.stdout, "write\n");
    r.unwrap();
    r = await io.writeString(io.stderr, "write\n");
    r.unwrap();
    r = io.writeStringSync(io.stdout, "writeSync\n");
    r.unwrap();
    r = io.writeStringSync(io.stderr, "writeSync\n");
    r.unwrap();
    return;
  }

  const { code, stdout } = await testing.runSubprocessTest("/^io: stdio$/", testPath, {
    [envVarName]: "true",
  });

  testing.assertEquals(code, 0);
  testing.assertStringIncludes(stdout.toString(), "write\nwriteSync\n");
  // TODO(@cszatmary): Disable for now as changes to the deno test runner
  // seem to have broken this.
  // testing.assertStringIncludes(stderr.toString(), "write\nwriteSync\n");
});
