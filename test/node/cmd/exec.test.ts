import { cmd } from "../../../src";

describe("cmd/exec.ts", () => {
  test("cmd.exec", async () => {
    const r = await cmd.exec("echo", ["hello"]);
    const res = r.unwrap();

    expect(res.status).toBe(0);
    expect(res.stdout?.toString()).toBe("hello\n");
    expect(res.stderr?.length).toBe(0);
  });

  test("cmd.execSync", () => {
    const r = cmd.execSync("echo", ["hello"]);
    const res = r.unwrap();

    expect(res.status).toBe(0);
    expect(res.stdout?.toString()).toBe("hello\n");
    expect(res.stderr?.length).toBe(0);
  });
});
