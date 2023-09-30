// Copyright (c) 2020-2021 Christopher Szatmary <cs@christopherszatmary.com>
// All rights reserved. MIT License.

/* eslint-disable @typescript-eslint/no-explicit-any */

// This file contains the Node specific implementation of the runtime API.

import { readFileSync } from "fs";
import { isatty } from "tty";
import type { URL } from "url";
import { inspect } from "util";
import type { Runtime } from "./runtime";

const env = {
  get(key: string): string | undefined {
    return process.env[key];
  },
  set(key: string, value: string): void {
    process.env[key] = value;
  },
  delete(key: string): void {
    delete process.env[key];
  },
  toObject(): Record<string, string> {
    // TS is complaining that the values should be `string | undefined`
    return process.env as Record<string, string>;
  },
};

export const runtime: Runtime = {
  build: {
    // Deno uses "windows" while node uses "win32"
    // eslint-disable-next-line no-ternary
    os: process.platform === "win32" ? "windows" : process.platform,
  },
  // TS doesn't like assigning a unique symbol
  customInspect: inspect.custom as any,
  env,
  noColor: process.env.NO_COLOR !== undefined,
  exit: process.exit,
  // TS doesn't like the inspect has multiple signatures
  // The interface required is a subset of what inspect offers so this is fine
  inspect: inspect as any,
  isatty,
  readTextFileSync(path: string | URL): string {
    return readFileSync(path, { encoding: "utf-8" });
  },
};
