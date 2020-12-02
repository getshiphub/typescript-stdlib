// Copyright (c) 2020 Christopher Szatmary <cs@christopherszatmary.com>
// All rights reserved. MIT License.
import { panic } from "../global.ts";
/** Returns `"true"` or `"false"` based on the value of `b`. */
export function formatBool(b: boolean): string {
    if (b) {
        return "true";
    }
    return "false";
}
/**
 * Returns the string representation of `i` in the given base.
 * The result uses the lower-case letters 'a' to 'z' for digit values >= 10.
 * Panics if `i` or `base` are not integers, or if base is invalid.
 * @param base The number base to use. Must be between 2 and 36 (inclusive).
 * Defaults to `10`.
 */
export function formatInt(i: number, base = 10): string {
    if (!Number.isInteger(i)) {
        panic("formatInt: i must be a valid integer");
    }
    if (base < 2 || base > 36) {
        panic(`formatInt: illegal number base: ${base}`);
    }
    if (!Number.isInteger(base)) {
        panic("formatInt: base must be a valid integer");
    }
    return i.toString(base);
}
/**
 * Converts the floating-point number `f` to a string,
 * according to the format `fmt` and precision `prec`.
 * It rounds the result.
 * @param fmt The format to use. `"f"` for fixed or `"e"`
 * for exponential.
 * @param prec The precision, i.e. the number of digits
 * after the decimal point. If omitted, it will be
 * as many digits as necessary.
 */
export function formatFloat(f: number, fmt: "f" | "e", prec?: number): string {
    if (fmt !== "f" && fmt !== "e") {
        panic(`formatFloat: invalid fmt "${fmt}", must be either "f" or "e"`);
    }
    if (fmt === "f") {
        if (prec === undefined) {
            // toFixed assumes 0 if the arg is omitted which isn't what we want
            // if prec is omitted we want the full number
            return f.toString();
        }
        return f.toFixed(prec);
    }
    return f.toExponential(prec);
}
