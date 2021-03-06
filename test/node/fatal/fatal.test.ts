import { runtime } from "../../../src/_runtime/runtime";
import { errors, fatal } from "../../../src";

class Client {
  flushed = false;

  flush(): void {
    this.flushed = true;
  }
}

describe("src/exit.ts tests", () => {
  let stderrData: string;
  let exitCode: number | undefined;
  let spyError: jest.SpyInstance;
  let spyExit: jest.SpyInstance;

  beforeEach(() => {
    stderrData = "";
    exitCode = 0;
    spyError = jest.spyOn(console, "error").mockImplementation((inputs: string) => {
      stderrData += inputs;
      stderrData += "\n";
    });
    spyExit = jest.spyOn(runtime, "exit").mockImplementation(((code) => {
      exitCode = code;
    }) as (code?: number) => never);
    fatal.showErrDetail(false);
    fatal.onExit(undefined);
  });

  afterEach(() => {
    spyError.mockRestore();
    spyExit.mockRestore();
  });

  test("fatal.exitErr: no detail", () => {
    fatal.exitErr(errors.newError("Shoot"), "Error message") as void;
    expect(stderrData).toBe("Error message\nError: Shoot\n");
    expect(exitCode).toBe(1);
  });

  test("fatal.exitErr: show detail", () => {
    fatal.showErrDetail(true);
    fatal.exitErr(errors.newError("Shoot"), "Error message") as void;
    // Check that the error is printed with a stack trace
    expect(stderrData).toMatch(
      /^Error message\nError: Shoot\n\s+at\s(?:.+?)\s\(.*test\/node\/fatal\/fatal\.test\.ts/m,
    );
    expect(exitCode).toBe(1);
  });

  test("fatal.exitErr: onExit", () => {
    const c = new Client();
    fatal.onExit(() => {
      c.flush();
    });

    expect(c.flushed).toBe(false);

    fatal.exitErr(errors.newError("Shoot"), "Error message") as void;
    expect(stderrData).toBe("Error message\nError: Shoot\n");
    expect(exitCode).toBe(1);
    expect(c.flushed).toBe(true);
  });

  test("fatal.exit", () => {
    fatal.exit("Something went wrong") as void;
    expect(stderrData).toBe("Something went wrong\n");
    expect(exitCode).toBe(1);
  });

  test("fatal.exit: onExit", () => {
    const c = new Client();
    fatal.onExit(() => {
      c.flush();
    });

    expect(c.flushed).toBe(false);

    fatal.exit("Something went wrong") as void;
    expect(stderrData).toBe("Something went wrong\n");
    expect(exitCode).toBe(1);
    expect(c.flushed).toBe(true);
  });
});
