// Copyright (c) 2020 Christopher Szatmary <cs@christopherszatmary.com>
// All rights reserved. MIT License.
import { panic } from "../global.ts";
/**
 * Copies bytes from `src` to `dest`. The number of bytes copied
 * will be the minimum of `src.length` and `dest.length`.
 * @returns The number of bytes copied.
 */
export function copy(dest: Uint8Array, src: Uint8Array): number {
    let b = src;
    if (b.length > dest.length) {
        b = b.subarray(0, dest.length);
    }
    dest.set(b);
    return b.length;
}
/**
 * Returns whether `a` and `b` are the same length
 * and contain the same bytes.
 */
export function equal(a: Uint8Array, b: Uint8Array): boolean {
    if (a.length !== b.length) {
        return false;
    }
    for (let i = 0; i < a.length; i++) {
        if (a[i] !== b[i]) {
            return false;
        }
    }
    return true;
}
/** Returns whether or not `s` begins with `prefix`. */
export function hasPrefix(s: Uint8Array, prefix: Uint8Array): boolean {
    if (s.length < prefix.length) {
        return false;
    }
    for (let i = 0; i < prefix.length; i++) {
        if (s[i] !== prefix[i]) {
            return false;
        }
    }
    return true;
}
/** Returns whether or not `s` begins with `suffix`. */
export function hasSuffix(s: Uint8Array, suffix: Uint8Array): boolean {
    if (s.length < suffix.length) {
        return false;
    }
    const offset = s.length - suffix.length;
    for (let i = 0; i < suffix.length; i++) {
        if (s[i + offset] !== suffix[i]) {
            return false;
        }
    }
    return true;
}
/**
 * Concatenates the elements of `s` to create a new byte array.
 * @param sep The separator to be placed between elements in the
 * resulting array.
 */
export function join(s: Uint8Array[], sep: Uint8Array): Uint8Array {
    if (s.length === 0) {
        return new Uint8Array();
    }
    else if (s.length === 1) {
        return new Uint8Array(s[0]);
    }
    let n = sep.length * (s.length - 1);
    for (const v of s) {
        n += v.length;
    }
    const b = new Uint8Array(n);
    let c = copy(b, s[0]);
    for (const v of s.slice(1)) {
        c += copy(b.subarray(c), sep);
        c += copy(b.subarray(c), v);
    }
    return b;
}
/**
 * Returns a new byte array consisting of `count` copies of `b`.
 * It panics if `count` is negative or if the result of
 * `b.length * count` overflows.
 */
export function repeat(b: Uint8Array, count: number): Uint8Array {
    if (count === 0) {
        return new Uint8Array();
    }
    if (count < 0) {
        panic("bytes: negative repeat count");
    }
    else if (!Number.isInteger(count)) {
        panic("bytes: count must be an integer");
    }
    else if ((b.length * count) / count !== b.length) {
        panic("bytes: repeat count causes overflow");
    }
    const nb = new Uint8Array(b.length * count);
    let c = copy(nb, b);
    while (c < nb.length) {
        copy(nb.subarray(c), nb.subarray(0, c));
        c *= 2;
    }
    return nb;
}
/**
 * Removes the leading `prefix` bytes from `s`.
 * If `s` doesn't start with `prefix`, `s` is returned unchanged.
 */
export function trimPrefix(s: Uint8Array, prefix: Uint8Array): Uint8Array {
    if (hasPrefix(s, prefix)) {
        return s.subarray(prefix.length);
    }
    return s;
}
/**
 * Removes the trailing `suffix` bytes from `s`.
 * If `s` doesn't end with `suffix`, `s` is returned unchanged.
 */
export function trimSuffix(s: Uint8Array, suffix: Uint8Array): Uint8Array {
    if (hasSuffix(s, suffix)) {
        return s.subarray(0, s.length - suffix.length);
    }
    return s;
}
