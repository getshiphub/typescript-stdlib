// Copyright (c) 2020-2021 Christopher Szatmary <cs@christopherszatmary.com>
// All rights reserved. MIT License.

import { runtime } from "../_runtime/runtime";
import { panic } from "../global";

/**
 * get retrieves the value of the environment variable or returns `defaultValue`
 * if it isn't set.
 * @param defaultValue The value to return if the environment variable is not set.
 * Defaults to `""`.
 */
export function get(key: string, defaultValue = ""): string {
  return runtime.env.get(key) ?? defaultValue;
}

/**
 * lookup retrieves the value of the environment variable.
 * If the variable is present in the environment, the value
 * (which may be empty) is returned.
 * Otherwise, `undefined` is returned.
 */
export function lookup(key: string): string | undefined {
  return runtime.env.get(key);
}

/** set sets an environment variable to the given value. */
export function set(name: string, value: string): void {
  runtime.env.set(name, value);
}

/** unset unsets the given environment variable. */
export function unset(name: string): void {
  runtime.env.delete(name);
}

/** getAll returns all environment variables as a map. */
export function getAll(): Map<string, string> {
  const o = runtime.env.toObject();
  return new Map(Object.entries(o));
}

/**
 * requireKeys checks that the given env vars are set.
 * If any are not set, requireKeys will panic.
 */
export function requireKeys(...keys: string[]): void {
  const missing: string[] = [];
  for (const k of keys) {
    if (lookup(k) === undefined) {
      missing.push(k);
    }
  }
  if (missing.length > 0) {
    panic(`required env vars missing: ${missing.join(", ")}`);
  }
}

const shellSpecialVarSet = new Set([
  "*",
  "#",
  "$",
  "@",
  "!",
  "?",
  "-",
  "0",
  "1",
  "2",
  "3",
  "4",
  "5",
  "6",
  "7",
  "8",
  "9",
]);

/** isAlphaNum reports whether the byte is an ASCII letter, number, or underscore */
function isAlphaNum(c: string): boolean {
  return c === "_" || (c >= "0" && c <= "9") || (c >= "a" && c <= "z") || (c >= "A" && c <= "Z");
}

/**
 * getShellName returns the name that begins the string and the number of bytes
 * consumed to extract it. If the name is enclosed in {}, it's part of a ${}
 * expansion and two more bytes are needed than the length of the name.
 */
function getShellName(s: string): [string, number] {
  if (s.startsWith("{")) {
    if (s.length > 2 && shellSpecialVarSet.has(s[1]) && s[2] === "}") {
      return [s.slice(1, 2), 3];
    }
    // Scan to closing brace
    for (let i = 1; i < s.length; i++) {
      if (s[i] === "}") {
        if (i === 1) {
          return ["", 2]; // Bad syntax; eat "${}"
        }
        return [s.slice(1, i), i + 1];
      }
    }
    return ["", 1]; // Bad syntax; eat "${"
  } else if (shellSpecialVarSet.has(s[0])) {
    return [s.slice(0, 1), 1];
  }
  // Scan alphanumerics.
  let i: number;
  for (i = 0; i < s.length; i++) {
    if (!isAlphaNum(s[i])) {
      break;
    }
  }
  return [s.slice(0, i), i];
}

/** expand replaces `${var}` or `$var` in the string based on the mapping function. */
export function expand(s: string, mapping: (key: string) => string): string {
  // ${} is all ASCII, so bytes are fine for this operation.
  const buf: string[] = [];
  let i = 0;
  for (let j = 0; j < s.length; j++) {
    if (s[j] !== "$" || j + 1 >= s.length) {
      continue;
    }

    buf.push(s.slice(i, j));
    const [name, w] = getShellName(s.slice(j + 1));
    if (name === "" && w > 0) {
      // Encountered invalid syntax; eat the
      // characters.
    } else if (name === "") {
      // Valid syntax, but $ was not followed by a
      // name. Leave the dollar character untouched.
      buf.push(s[j]);
    } else {
      buf.push(mapping(name));
    }

    j += w;
    i = j + 1;
  }
  if (buf.length === 0) {
    return s;
  }
  return buf.join("") + s.slice(i);
}

const doubleQuoteSpecialChars = new Set(["\\", "\n", "\r", '"', "!", "$", "`", "#"]);

/**
 * escapeValue escapes any special characters in the value `v`.
 * If escaping is required, the returned value will be surrounded by double quotes.
 */
function escapeValue(v: string): string {
  const buf: string[] = [];
  let escapeNeeded = false;
  for (const c of v) {
    if (!doubleQuoteSpecialChars.has(c)) {
      buf.push(c);
      continue;
    }

    escapeNeeded = true;
    if (c === "#") {
      buf.push(c);
    } else if (c === "\n") {
      buf.push("\\n");
    } else if (c === "\r") {
      buf.push("\\r");
    } else {
      buf.push(`\\${c}`);
    }
  }
  if (!escapeNeeded) {
    return v;
  }
  return `"${buf.join("")}"`;
}

/**
 * stringify outputs the given environment map as a string of values
 * in the form `key=value`.
 */
export function stringify(m: Map<string, string>): string {
  const lines: string[] = [];
  for (const [k, v] of m) {
    const ev = escapeValue(v);
    lines.push(`${k}=${ev}`);
  }
  return lines.sort().join("\n");
}
