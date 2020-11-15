import os from "os";
import path from "path";

import { cmd, fs } from "../../../src";

describe("cmd.ts", () => {
  if (/^win/i.test(process.platform)) {
    // TODO write windows tests
  } else {
    // This test must by synchronous because it modifies the PATH env var
    test("cmd.lookPath", () => {
      // Create temp dir with a file
      const tmpDir = fs.mkdtempSync(`${os.tmpdir}${path.sep}`).unwrap();
      fs.writeFileSync(path.join(tmpDir, "foo"), "", { mode: 0o755 }).unwrap();

      // Add temp dir to path
      const envPath = process.env.PATH;
      process.env.PATH = tmpDir;

      const r = cmd.lookPath("foo");
      expect(r.success()).toBe(`${tmpDir}/foo`);

      process.env.PATH = envPath;
      fs.removeAllSync(tmpDir);
    });

    test("cmd.lookPath: not found", () => {
      const r = cmd.lookPath("notacommandyo");
      const err = r.failure() as cmd.LookUpError;

      expect(err).toBeInstanceOf(cmd.LookUpError);
      expect(err.fileName).toBe("notacommandyo");
      expect(err.err).toBe(cmd.errNotFound);
      expect(err.error()).toBe("LookUpError: notacommandyo: executable file not found in PATH");
      expect(err.detailedError()).toBe(
        "LookUpError: notacommandyo: executable file not found in PATH",
      );
      expect(err.cause()).toBe(cmd.errNotFound);
    });
  }

  if (/^win/i.test(process.platform)) {
    // TODO write windows tests
  } else {
    test("cmd.isCommandAvailable: true", () => {
      const b = cmd.isCommandAvailable("sh");
      expect(b).toBe(true);
    });

    test("cmd.isCommandAvailable: false", () => {
      const b = cmd.isCommandAvailable("notacommandyo");
      expect(b).toBe(false);
    });
  }
});
