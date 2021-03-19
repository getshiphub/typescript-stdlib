// Copyright (c) 2020-2021 Christopher Szatmary <cs@christopherszatmary.com>
// All rights reserved. MIT License.

/**
 * Returns a new set containing the union of `a` and `b`.
 * The union is all elements that are in either `a` or `b`.
 */
export function union<T>(a: Set<T>, b: Set<T>): Set<T> {
  const c = new Set<T>();

  for (const v of a) {
    c.add(v);
  }

  for (const v of b) {
    if (!c.has(v)) {
      c.add(v);
    }
  }

  return c;
}

/**
 * Returns a new set containing the intersection of `a` and `b`.
 * The union is all elements that are in both `a` and `b`.
 */
export function intersection<T>(a: Set<T>, b: Set<T>): Set<T> {
  const c = new Set<T>();

  for (const v of a) {
    if (b.has(v)) {
      c.add(v);
    }
  }

  return c;
}

/**
 * Returns a new set containing the difference of `a` and `b`.
 * The union is all elements that are in `a` but not in `b`.
 */
export function difference<T>(a: Set<T>, b: Set<T>): Set<T> {
  const c = new Set<T>();

  for (const v of a) {
    if (!b.has(v)) {
      c.add(v);
    }
  }

  return c;
}

/**
 * Returns true if `a` is a subset of `b`.
 * That is, `b` contains all elements of `a`.
 */
export function isSubset<T>(a: Set<T>, b: Set<T>): boolean {
  for (const v of a) {
    if (!b.has(v)) {
      return false;
    }
  }

  return true;
}
