import { colors, env } from "../../../src";

describe("colors/colors.ts", () => {
  let noColor: string | undefined;
  beforeAll(() => {
    noColor = env.lookup("NO_COLOR");
    if (noColor !== undefined) {
      env.unset("NO_COLOR");
    }
  });

  afterAll(() => {
    if (noColor !== undefined) {
      env.set("NO_COLOR", noColor);
    }
  });

  beforeEach(() => {
    colors.setColorEnabled(true);
  });

  test("enabling colours", () => {
    expect(colors.isColorEnabled()).toBe(true);
    colors.setColorEnabled(false);
    expect(colors.isColorEnabled()).toBe(false);
    expect(colors.red("foo bar")).toBe("foo bar");
    colors.setColorEnabled(true);
    expect(colors.isColorEnabled()).toBe(true);
    expect(colors.red("foo bar")).toBe("\x1b[31mfoo bar\x1b[39m");
  });

  test("colors.reset", () => {
    const s = colors.red("foo bar");
    expect(colors.reset(s)).toBe("\x1b[0m\x1b[31mfoo bar\x1b[39m\x1b[0m");
  });

  test("colors.bold", () => {
    expect(colors.bold("foo bar")).toBe("\x1b[1mfoo bar\x1b[22m");
  });

  test("colors.dim", () => {
    expect(colors.dim("foo bar")).toBe("\x1b[2mfoo bar\x1b[22m");
  });

  test("colors.italic", () => {
    expect(colors.italic("foo bar")).toBe("\x1b[3mfoo bar\x1b[23m");
  });

  test("colors.underline", () => {
    expect(colors.underline("foo bar")).toBe("\x1b[4mfoo bar\x1b[24m");
  });

  test("colors.invert", () => {
    expect(colors.invert("foo bar")).toBe("\x1b[7mfoo bar\x1b[27m");
  });

  test("colors.hidden", () => {
    expect(colors.hidden("foo bar")).toBe("\x1b[8mfoo bar\x1b[28m");
  });

  test("colors.strikethrough", () => {
    expect(colors.strikethrough("foo bar")).toBe("\x1b[9mfoo bar\x1b[29m");
  });

  test("colors.black", () => {
    expect(colors.black("foo bar")).toBe("\x1b[30mfoo bar\x1b[39m");
  });

  test("colors.red", () => {
    expect(colors.red("foo bar")).toBe("\x1b[31mfoo bar\x1b[39m");
  });

  test("colors.green", () => {
    expect(colors.green("foo bar")).toBe("\x1b[32mfoo bar\x1b[39m");
  });

  test("colors.yellow", () => {
    expect(colors.yellow("foo bar")).toBe("\x1b[33mfoo bar\x1b[39m");
  });

  test("colors.blue", () => {
    expect(colors.blue("foo bar")).toBe("\x1b[34mfoo bar\x1b[39m");
  });

  test("colors.magenta", () => {
    expect(colors.magenta("foo bar")).toBe("\x1b[35mfoo bar\x1b[39m");
  });

  test("colors.cyan", () => {
    expect(colors.cyan("foo bar")).toBe("\x1b[36mfoo bar\x1b[39m");
  });

  test("colors.white", () => {
    expect(colors.white("foo bar")).toBe("\x1b[37mfoo bar\x1b[39m");
  });

  test("colors.bgBlack", () => {
    expect(colors.bgBlack("foo bar")).toBe("\x1b[40mfoo bar\x1b[49m");
  });

  test("colors.bgRed", () => {
    expect(colors.bgRed("foo bar")).toBe("\x1b[41mfoo bar\x1b[49m");
  });

  test("colors.bgGreen", () => {
    expect(colors.bgGreen("foo bar")).toBe("\x1b[42mfoo bar\x1b[49m");
  });

  test("colors.bgYellow", () => {
    expect(colors.bgYellow("foo bar")).toBe("\x1b[43mfoo bar\x1b[49m");
  });

  test("colors.bgBlue", () => {
    expect(colors.bgBlue("foo bar")).toBe("\x1b[44mfoo bar\x1b[49m");
  });

  test("colors.bgMagenta", () => {
    expect(colors.bgMagenta("foo bar")).toBe("\x1b[45mfoo bar\x1b[49m");
  });

  test("colors.bgCyan", () => {
    expect(colors.bgCyan("foo bar")).toBe("\x1b[46mfoo bar\x1b[49m");
  });

  test("colors.bgWhite", () => {
    expect(colors.bgWhite("foo bar")).toBe("\x1b[47mfoo bar\x1b[49m");
  });
});
