// Copyright (c) 2020 Christopher Szatmary <cs@christopherszatmary.com>
// All rights reserved. MIT License.

import { runtime } from "../_runtime/runtime";

// Available ANSI codes
const ansiCodes = {
  // Reset codes
  resetAll: 0,
  resetIntensity: 22,
  resetItalic: 23,
  resetUnderline: 24,
  resetInvert: 27,
  resetHidden: 28,
  resetStrikethrough: 29,
  resetFgColor: 39,
  resetBgColor: 49,
  // Effect codes
  bold: 1,
  dim: 2,
  italic: 3,
  underline: 4,
  invert: 7,
  hidden: 8,
  strikethrough: 9,
  // Foreground Colors
  fgBlack: 30,
  fgRed: 31,
  fgGreen: 32,
  fgYellow: 33,
  fgBlue: 34,
  fgMagenta: 35,
  fgCyan: 36,
  fgWhite: 37,
  // Background Colors
  bgBlack: 40,
  bgRed: 41,
  bgGreen: 42,
  bgYellow: 43,
  bgBlue: 44,
  bgMagenta: 45,
  bgCyan: 46,
  bgWhite: 47,
};

let colorEnabled = !runtime.noColor;

export function isColorEnabled(): boolean {
  return colorEnabled;
}

export function setColorEnabled(isEnabled: boolean): void {
  /* istanbul ignore else */
  if (!runtime.noColor) {
    colorEnabled = isEnabled;
  }
}

function apply(str: string, start: number, end: number): string {
  if (!colorEnabled) {
    return str;
  }

  const regex = new RegExp(`\\x1b\\[${end}m`, "g");
  // Remove any occurrences of reset to make sure color isn't messed up
  return `\x1b[${start}m${str.replace(regex, "")}\x1b[${end}m`;
}

export function reset(str: string): string {
  return apply(str, ansiCodes.resetAll, ansiCodes.resetAll);
}

export function bold(str: string): string {
  return apply(str, ansiCodes.bold, ansiCodes.resetIntensity);
}

export function dim(str: string): string {
  return apply(str, ansiCodes.dim, ansiCodes.resetIntensity);
}

export function italic(str: string): string {
  return apply(str, ansiCodes.italic, ansiCodes.resetItalic);
}

export function underline(str: string): string {
  return apply(str, ansiCodes.underline, ansiCodes.resetUnderline);
}

export function invert(str: string): string {
  return apply(str, ansiCodes.invert, ansiCodes.resetInvert);
}

export function hidden(str: string): string {
  return apply(str, ansiCodes.hidden, ansiCodes.resetHidden);
}

export function strikethrough(str: string): string {
  return apply(str, ansiCodes.strikethrough, ansiCodes.resetStrikethrough);
}

export function black(str: string): string {
  return apply(str, ansiCodes.fgBlack, ansiCodes.resetFgColor);
}

export function red(str: string): string {
  return apply(str, ansiCodes.fgRed, ansiCodes.resetFgColor);
}

export function green(str: string): string {
  return apply(str, ansiCodes.fgGreen, ansiCodes.resetFgColor);
}

export function yellow(str: string): string {
  return apply(str, ansiCodes.fgYellow, ansiCodes.resetFgColor);
}

export function blue(str: string): string {
  return apply(str, ansiCodes.fgBlue, ansiCodes.resetFgColor);
}

export function magenta(str: string): string {
  return apply(str, ansiCodes.fgMagenta, ansiCodes.resetFgColor);
}

export function cyan(str: string): string {
  return apply(str, ansiCodes.fgCyan, ansiCodes.resetFgColor);
}

export function white(str: string): string {
  return apply(str, ansiCodes.fgWhite, ansiCodes.resetFgColor);
}

export function bgBlack(str: string): string {
  return apply(str, ansiCodes.bgBlack, ansiCodes.resetBgColor);
}

export function bgRed(str: string): string {
  return apply(str, ansiCodes.bgRed, ansiCodes.resetBgColor);
}

export function bgGreen(str: string): string {
  return apply(str, ansiCodes.bgGreen, ansiCodes.resetBgColor);
}

export function bgYellow(str: string): string {
  return apply(str, ansiCodes.bgYellow, ansiCodes.resetBgColor);
}

export function bgBlue(str: string): string {
  return apply(str, ansiCodes.bgBlue, ansiCodes.resetBgColor);
}

export function bgMagenta(str: string): string {
  return apply(str, ansiCodes.bgMagenta, ansiCodes.resetBgColor);
}

export function bgCyan(str: string): string {
  return apply(str, ansiCodes.bgCyan, ansiCodes.resetBgColor);
}

export function bgWhite(str: string): string {
  return apply(str, ansiCodes.bgWhite, ansiCodes.resetBgColor);
}
