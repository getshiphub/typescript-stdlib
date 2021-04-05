// Copyright (c) 2020-2021 Christopher Szatmary <cs@christopherszatmary.com>
// All rights reserved. MIT License.

import { runtime } from "../_runtime/runtime";
import { panic } from "../global";

/**
 * Checks if the given environment variable is set.
 *
 * **NOTE:** Empty values are considered set.
 */
export function isEnvSet(name: string): boolean {
  // If an env is not set it will be `undefined` in JS world
  return runtime.env.get(name) !== undefined;
}

/**
 * Gets the value of the environment variable or returns `defaultValue`
 * if it isn't set.
 * @param defaultValue The value to return if the environment variable is not set.
 * Defaults to `""`.
 */
export function getEnv(name: string, defaultValue = ""): string {
  return runtime.env.get(name) ?? defaultValue;
}

/** Sets an environment variable to the given value. */
export function setEnv(name: string, value: string): void {
  runtime.env.set(name, value);
}

/** Unsets the given environment variable. */
export function unsetEnv(name: string): void {
  runtime.env.delete(name);
}

/**
 * requireKeys checks that the given env vars are set.
 * If any are not set, requireKeys will panic.
 */
export function requireKeys(...keys: string[]): void {
  const missing: string[] = [];
  for (const k of keys) {
    if (!isEnvSet(k)) {
      missing.push(k);
    }
  }
  if (missing.length > 0) {
    panic(`required env vars missing: ${missing.join(", ")}`);
  }
}
