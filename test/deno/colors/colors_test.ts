import * as testing from "../testing.ts";
import { colors } from "../../../dist/deno/mod.ts";

Deno.test("enabling colours", () => {
  testing.assertEquals(colors.isColorEnabled(), true);
  colors.setColorEnabled(false);
  testing.assertEquals(colors.isColorEnabled(), false);
  testing.assertEquals(colors.red("foo bar"), "foo bar");
  colors.setColorEnabled(true);
  testing.assertEquals(colors.isColorEnabled(), true);
  testing.assertEquals(colors.red("foo bar"), "\x1b[31mfoo bar\x1b[39m");
});

Deno.test("colors.reset", () => {
  const s = colors.red("foo bar");
  testing.assertEquals(colors.reset(s), "\x1b[0m\x1b[31mfoo bar\x1b[39m\x1b[0m");
});

Deno.test("colors.bold", () => {
  testing.assertEquals(colors.bold("foo bar"), "\x1b[1mfoo bar\x1b[22m");
});

Deno.test("colors.dim", () => {
  testing.assertEquals(colors.dim("foo bar"), "\x1b[2mfoo bar\x1b[22m");
});

Deno.test("colors.italic", () => {
  testing.assertEquals(colors.italic("foo bar"), "\x1b[3mfoo bar\x1b[23m");
});

Deno.test("colors.underline", () => {
  testing.assertEquals(colors.underline("foo bar"), "\x1b[4mfoo bar\x1b[24m");
});

Deno.test("colors.invert", () => {
  testing.assertEquals(colors.invert("foo bar"), "\x1b[7mfoo bar\x1b[27m");
});

Deno.test("colors.hidden", () => {
  testing.assertEquals(colors.hidden("foo bar"), "\x1b[8mfoo bar\x1b[28m");
});

Deno.test("colors.strikethrough", () => {
  testing.assertEquals(colors.strikethrough("foo bar"), "\x1b[9mfoo bar\x1b[29m");
});

Deno.test("colors.black", () => {
  testing.assertEquals(colors.black("foo bar"), "\x1b[30mfoo bar\x1b[39m");
});

Deno.test("colors.red", () => {
  testing.assertEquals(colors.red("foo bar"), "\x1b[31mfoo bar\x1b[39m");
});

Deno.test("colors.green", () => {
  testing.assertEquals(colors.green("foo bar"), "\x1b[32mfoo bar\x1b[39m");
});

Deno.test("colors.yellow", () => {
  testing.assertEquals(colors.yellow("foo bar"), "\x1b[33mfoo bar\x1b[39m");
});

Deno.test("colors.blue", () => {
  testing.assertEquals(colors.blue("foo bar"), "\x1b[34mfoo bar\x1b[39m");
});

Deno.test("colors.magenta", () => {
  testing.assertEquals(colors.magenta("foo bar"), "\x1b[35mfoo bar\x1b[39m");
});

Deno.test("colors.cyan", () => {
  testing.assertEquals(colors.cyan("foo bar"), "\x1b[36mfoo bar\x1b[39m");
});

Deno.test("colors.white", () => {
  testing.assertEquals(colors.white("foo bar"), "\x1b[37mfoo bar\x1b[39m");
});

Deno.test("colors.bgBlack", () => {
  testing.assertEquals(colors.bgBlack("foo bar"), "\x1b[40mfoo bar\x1b[49m");
});

Deno.test("colors.bgRed", () => {
  testing.assertEquals(colors.bgRed("foo bar"), "\x1b[41mfoo bar\x1b[49m");
});

Deno.test("colors.bgGreen", () => {
  testing.assertEquals(colors.bgGreen("foo bar"), "\x1b[42mfoo bar\x1b[49m");
});

Deno.test("colors.bgYellow", () => {
  testing.assertEquals(colors.bgYellow("foo bar"), "\x1b[43mfoo bar\x1b[49m");
});

Deno.test("colors.bgBlue", () => {
  testing.assertEquals(colors.bgBlue("foo bar"), "\x1b[44mfoo bar\x1b[49m");
});

Deno.test("colors.bgMagenta", () => {
  testing.assertEquals(colors.bgMagenta("foo bar"), "\x1b[45mfoo bar\x1b[49m");
});

Deno.test("colors.bgCyan", () => {
  testing.assertEquals(colors.bgCyan("foo bar"), "\x1b[46mfoo bar\x1b[49m");
});

Deno.test("colors.bgWhite", () => {
  testing.assertEquals(colors.bgWhite("foo bar"), "\x1b[47mfoo bar\x1b[49m");
});
