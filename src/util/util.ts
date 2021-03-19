// Copyright (c) 2020-2021 Christopher Szatmary <cs@christopherszatmary.com>
// All rights reserved. MIT License.

import { runtime } from "../_runtime/runtime";
import { panic, symbols } from "../global";
import * as errors from "../errors/mod";

/**
 * An interface representing a type that can create a
 * string representation of itself.
 */
export interface Stringer {
  toString(): string;
}

/** Returns a string representation of the value `v`. */
export function toString(v: unknown): string {
  if (v === undefined) {
    return "undefined";
  } else if (v === null) {
    return "null";
  } else if (typeof v === "string") {
    return v;
  } else if (typeof v === "boolean" || typeof v === "number") {
    return v.toString();
  } else if (errors.isError(v)) {
    return v.error();
  }

  const s = v as Stringer;
  // Make sure toString isn't from Object.prototype or if will always be executed
  // and we will get [object Object] instead of using util.inspect
  if (typeof s.toString === "function" && s.toString !== Object.prototype.toString) {
    return s.toString();
  }

  return runtime.inspect(v);
}

/**
 * Returns a boolean indicating whether or not
 * `v` is a proper object and not an array.
 */
// eslint-disable-next-line @typescript-eslint/ban-types
export function isObject(v: unknown): v is object {
  return v != null && typeof v === "object" && !Array.isArray(v);
}

export type TypedArray =
  | Uint8Array
  | Uint8ClampedArray
  | Uint16Array
  | Uint32Array
  | Int8Array
  | Int16Array
  | Int32Array
  | Float32Array
  | Float64Array;

/**
 * Returns a boolean indicating whether or not `v`
 * is a typed array.
 */
export function isTypedArray(v: unknown): v is TypedArray {
  return ArrayBuffer.isView(v) && !(v instanceof DataView);
}

/**
 * An interface representing a type that can create copies of itself.
 * This interface is not exported because TypeScript doesn't have a good way
 * to express the intent here. This is only used internally for convenience.
 * Consumers can implement this interface implicitly.
 */
interface Copyable {
  [symbols.copy](): this;
}

/**
 * Returns a boolean indicating whether or not `v`
 * implements the `Copyable` interface.
 * A value implements `Copyable` if it has a `copy` method.
 */
export function isCopyable(v: unknown): v is Copyable {
  return v != null && typeof (v as Copyable)[symbols.copy] === "function";
}

/**
 * copy returns a deep copy of the given value.
 * If the value is a collection (Array, Map, Set or TypedArray), then
 * the elements will be recursively copied. Custom types can implement
 * a method using `symbols.copy` which returns a copy of the object.
 * If such a method exists on the value being copied it will be used.
 */
export function copy<T>(v: T): T {
  if (v == null) {
    return v;
  }

  // Arrays are special and should be handled before checking
  // it's an object
  if (Array.isArray(v)) {
    const a = [];
    for (const e of v) {
      a.push(copy(e));
    }

    return (a as unknown) as T;
  }

  // Handle primatives
  if (!isObject(v)) {
    return v;
  }

  if (v instanceof Date) {
    return (new Date(v.getTime()) as unknown) as T;
  }

  if (v instanceof Map) {
    const m = new Map();
    for (const [k, val] of v) {
      m.set(k, copy(val));
    }
    return (m as unknown) as T;
  }

  if (v instanceof Set) {
    const s = new Set();
    for (const e of v) {
      s.add(copy(e));
    }
    return (s as unknown) as T;
  }

  if (isTypedArray(v)) {
    return (v.slice() as unknown) as T;
  }

  if (isCopyable(v)) {
    return v[symbols.copy]();
  }

  const o: Record<string, unknown> = {};
  for (const [k, val] of Object.entries(v)) {
    o[k] = copy(val);
  }
  return o as T;
}

/** Merges the given objects or arrays and returns a deep copy. */
export function merge<T extends Record<string, unknown>>(x: Partial<T>, y: Partial<T>): T;
export function merge<T extends Record<string, unknown>, S extends Record<string, unknown>>(
  x: T,
  y: S,
): T & S;
export function merge<T>(x: T[], y: T[]): T[];
export function merge<T extends Record<string, unknown>, S extends Record<string, unknown>>(
  x: T,
  y: S,
): T & S {
  if (Array.isArray(x) !== Array.isArray(y)) {
    panic("merge: Cannot merge an object and an array");
  }

  // Do lazy way for now. Can optimize later to remove the intermediate shallow copy.
  if (Array.isArray(x) && Array.isArray(y)) {
    return (copy([...x, ...y]) as unknown) as T & S;
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const dest: any = copy(x);
  for (const [k, v] of Object.entries(y)) {
    // Prevent overwriting property in prototype
    if (k in x && !(Object.hasOwnProperty.call(x, k) && Object.propertyIsEnumerable.call(x, k))) {
      continue;
    }

    if (k in x && (isObject(v) || Array.isArray(v))) {
      dest[k] = merge(x[k] as Record<string, unknown>, v);
      continue;
    }

    dest[k] = copy(v);
  }
  return dest;
}
