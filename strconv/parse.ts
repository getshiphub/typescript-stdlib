// Copyright (c) 2020 Christopher Szatmary <cs@christopherszatmary.com>
// All rights reserved. MIT License.
// This code has been ported largely from Go's src/strconv
// Copyright (c) 2009 The Go Authors. All rights reserved.
// https://github.com/golang/go/blob/master/LICENSE
import { Result } from "../global.ts";
import * as errors from "../errors/mod.ts";
/** errRange indicates that a value is out or range for the target type. */
export const errRange = errors.errorString("value out of range");
/** errSyntax indicates that a value does not have the right syntax for the target type. */
export const errSyntax = errors.errorString("invalid syntax");
/** An error that records a failed converstion. */
export class NumError {
    func: string;
    num: string;
    err: error;
    constructor(func: string, num: string, err: error) {
        this.func = func;
        this.num = num;
        this.err = err;
    }
    error(): string {
        return `strconv.${this.func}: parsing "${this.num}": ${this.err.error()}`;
    }
    detailedError(): string {
        return `strconv.${this.func}: parsing "${this.num}": ${this.err.detailedError()}`;
    }
    cause(): error {
        return this.err;
    }
}
/** Checks if `err` is a `NumError`. */
export function isNumError(err: unknown): err is NumError {
    const e = err as NumError;
    return typeof e.func === "string" && typeof e.num === "string" && errors.isError(e.err);
}
const enum ASCIICode {
    n0 = 48,
    n9 = 57,
    _ = 95,
    a = 97,
    b = 98,
    f = 102,
    o = 111,
    x = 120,
    z = 122
}
function lower(c: number): number {
    // ASCII trick to convert upper case to lower case
    // All lower case letters have the 6th bit set to 1
    // https://catonmat.net/ascii-case-conversion-trick
    // eslint-disable-next-line no-bitwise
    return c | 32;
}
// underscoreOK reports whether the underscores in s are allowed.
// Checking them in this one function lets all the parsers skip over them simply.
// Underscore must appear only between digits or between a base prefix and a digit.
function underscoreOK(str: string): boolean {
    // saw tracks the last character (class) we saw:
    // ^ for beginning of number,
    // 0 for a digit or base prefix,
    // _ for an underscore,
    // ! for none of the above.
    let saw = "^";
    let startIndex = 0;
    let s = str;
    // Optional sign.
    if ((s.length >= 1 && s[0] === "-") || s[0] === "+") {
        s = s.slice(1);
    }
    // Optional base prefix.
    let hex = false;
    if (s.length >= 2 &&
        s[0] === "0" &&
        (lower(s.charCodeAt(1)) === ASCIICode.b ||
            lower(s.charCodeAt(1)) === ASCIICode.o ||
            lower(s.charCodeAt(1)) === ASCIICode.x)) {
        startIndex = 2;
        saw = "0"; // base prefix counts as a digit for "underscore as digit separator"
        hex = lower(s.charCodeAt(1)) === ASCIICode.x;
    }
    // Number proper.
    for (let i = startIndex; i < s.length; i++) {
        const c = s.charCodeAt(i);
        // Digits are always okay.
        if ((c >= ASCIICode.n0 && c <= ASCIICode.n9) ||
            (hex && lower(c) >= ASCIICode.a && lower(c) <= ASCIICode.f)) {
            saw = "0";
            continue;
        }
        // Underscore must follow digit.
        if (c === ASCIICode._) {
            if (saw !== "0") {
                return false;
            }
            saw = "_";
            continue;
        }
        // Underscore must also be followed by digit.
        if (saw === "_") {
            return false;
        }
        // Saw non-digit, non-underscore.
        saw = "!";
    }
    return saw !== "_";
}
/**
 * Returns the boolean value represented by `str`.
 * It accepts `1`, `t`, `T`, `TRUE`, `true`, `True`,
 * `0`, `f`, `F`, `FALSE`, `false`, `False`.
 * Any other value returns an error.
 */
export function parseBool(str: string): Result<boolean, error> {
    switch (str) {
        case "1":
        case "t":
        case "T":
        case "true":
        case "TRUE":
        case "True":
            return Result.success(true);
        case "0":
        case "f":
        case "F":
        case "false":
        case "FALSE":
        case "False":
            return Result.success(false);
        default:
            return Result.failure(new NumError("parseBool", str, errSyntax));
    }
}
/**
 * Interpresets the string `str` as an integer in the given base.
 * @param base The number base to interpret the string as. Valid values
 * are `0`, `2` to `36`. If `base` is `0`, the base is implied by the
 * string's prefix: `2` for `"0b"`, `8` for `"0"` or `"0o"`, `16` for `"0x"`,
 * and `10` otherwise. Also for base `0` only, underscore characters are permitted.
 * Defaults to `10`.
 * @returns A `Result` containing the parsed integer or a `NumError`.
 */
export function parseInt(str: string, base = 10): Result<number, error> {
    const fnParseInt = "parseInt";
    if (str === "") {
        return Result.failure(new NumError(fnParseInt, str, errSyntax));
    }
    // Pick off leading sign
    let s = str;
    if (s[0] === "-" || s[0] === "+") {
        s = s.slice(1);
        if (s.length < 1) {
            return Result.failure(new NumError(fnParseInt, str, errSyntax));
        }
    }
    // Fast path for small integers that fit number type.
    if (base === 10 && str.length < 16) {
        let n = 0;
        for (let i = 0; i < s.length; i++) {
            const c = s.charCodeAt(i) - ASCIICode.n0;
            if (c > 9) {
                return Result.failure(new NumError(fnParseInt, str, errSyntax));
            }
            n = n * 10 + c;
        }
        if (str[0] === "-") {
            n = -n;
        }
        return Result.success(n);
    }
    // Slow path for invalid, big, or underscored integers.
    let actualBase = base;
    if (actualBase === 0) {
        // look for base prefix
        actualBase = 10;
        if (s[0] === "0") {
            if (s.length >= 3 && lower(s.charCodeAt(1)) === ASCIICode.b) {
                actualBase = 2;
                s = s.slice(2);
            }
            else if (s.length >= 3 && lower(s.charCodeAt(1)) === ASCIICode.o) {
                actualBase = 8;
                s = s.slice(2);
            }
            else if (s.length >= 3 && lower(s.charCodeAt(1)) === ASCIICode.x) {
                actualBase = 16;
                s = s.slice(2);
            }
            else {
                actualBase = 8;
                s = s.slice(1);
            }
        }
    }
    else if (base < 2 || base > 36) {
        return Result.failure(new NumError(fnParseInt, str, errors.errorString(`invalid base ${base}`)));
    }
    // Cutoff is the smallest number such that cutoff*base > Number.MAX_SAFE_INTEGER.
    const cutoff = Number.MAX_SAFE_INTEGER / actualBase + 1;
    const maxVal = Number.MAX_SAFE_INTEGER;
    let underscores = false;
    let n = 0;
    for (let i = 0; i < s.length; i++) {
        const c = s.charCodeAt(i);
        let d: number;
        if (c === ASCIICode._ && base === 0) {
            underscores = true;
            continue;
        }
        else if (c >= ASCIICode.n0 && c <= ASCIICode.n9) {
            d = c - ASCIICode.n0;
        }
        else if (lower(c) >= ASCIICode.a && lower(c) <= ASCIICode.z) {
            d = lower(c) - ASCIICode.a + 10;
        }
        else {
            return Result.failure(new NumError(fnParseInt, str, errSyntax));
        }
        if (d >= actualBase) {
            return Result.failure(new NumError(fnParseInt, str, errSyntax));
        }
        if (n >= cutoff) {
            // n*base overflows
            return Result.failure(new NumError(fnParseInt, str, errRange));
        }
        n *= actualBase;
        const n1 = n + d;
        if (n1 < n || n1 > maxVal) {
            // n+v overflows
            return Result.failure(new NumError(fnParseInt, str, errRange));
        }
        n = n1;
    }
    if (underscores && !underscoreOK(str)) {
        return Result.failure(new NumError(fnParseInt, str, errSyntax));
    }
    if (str[0] === "-") {
        n = -n;
    }
    return Result.success(n);
}
/**
 * Converts the string `str` to a 64 bit floating point number.
 * @returns A `Result` with the parsed float, or a `NumError` with
 * `errSyntax` if the string is not syntactically well-formed.
 */
export function parseFloat(str: string): Result<number, error> {
    if (str === "") {
        return Result.failure(new NumError("parseFloat", str, errSyntax));
    }
    // Check special values
    switch (str[0]) {
        case "+":
            if (str.toLowerCase() === "+infinity") {
                return Result.success(Infinity);
            }
            break;
        case "-":
            if (str.toLowerCase() === "-infinity") {
                return Result.success(-Infinity);
            }
            break;
        case "n":
        case "N":
            if (str.toLowerCase() === "nan") {
                return Result.success(NaN);
            }
            /* istanbul ignore next */
            break;
        case "i":
        case "I":
            if (str.toLowerCase() === "infinity") {
                return Result.success(Infinity);
            }
            /* istanbul ignore next */
            break;
        default:
            break;
    }
    const f = Number(str);
    if (Number.isNaN(f)) {
        return Result.failure(new NumError("parseFloat", str, errSyntax));
    }
    return Result.success(f);
}
