// Copyright (c) 2020 Christopher Szatmary <cs@christopherszatmary.com>
// All rights reserved. MIT License.
// This code has been ported largely from Go's src/time/time.go
// Copyright (c) 2009 The Go Authors. All rights reserved.
// https://github.com/golang/go/blob/master/LICENSE
/** Represents a month in the Gregorian calendar. */
export enum Month {
    january,
    february,
    march,
    april,
    may,
    june,
    july,
    august,
    september,
    october,
    november,
    december
}
const months = [
    "January",
    "February",
    "March",
    "April",
    "May",
    "June",
    "July",
    "August",
    "September",
    "October",
    "November",
    "December",
];
/** Returns the english name of the given month `m`. */
export function monthString(m: Month): string {
    return months[m];
}
/** Represents a day of the week. */
export enum Weekday {
    sunday,
    monday,
    tuesday,
    wednesday,
    thursday,
    friday,
    saturday
}
const days = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
/** Return the english name of the given weekday `wd`. */
export function weekdayString(wd: Weekday): string {
    return days[wd];
}
/**
 * Convenience function to return the month of
 * the given date `d` as a `Month`.
 */
export function dateMonth(d: Date): Month {
    return d.getMonth() as Month;
}
/**
 * Convenience function to return the weekday of
 * the given date `d` as a `Weekday`.
 */
export function dateWeekday(d: Date): Weekday {
    return d.getDay() as Weekday;
}
export const nanosecond = 1;
export const microsecond = 1000 * nanosecond;
export const millisecond = 1000 * microsecond;
export const second = 1000 * millisecond;
export const minute = 60 * second;
export const hour = 60 * minute;
/**
 * Represents the elapsed time between two instants
 * as a nanosecond count.
 */
export type Duration = number;
/** Returns the duration as the number of nanoseconds. */
export function toNanoseconds(d: Duration): number {
    return d;
}
/** Returns the duration as the number of microseconds. */
export function toMicroseconds(d: Duration): number {
    return Math.trunc(d / 1000);
}
/** Returns the duration as the number of milliseconds. */
export function toMilliseconds(d: Duration): number {
    return Math.trunc(d / 1000000);
}
/** Returns the duration as the number of seconds. */
export function toSeconds(d: Duration): number {
    const sec = Math.trunc(d / second);
    const nanosec = d % second;
    return sec + nanosec / 1000000000;
}
/** Returns the duration as the number of minutes. */
export function toMinutes(d: Duration): number {
    const min = Math.trunc(d / minute);
    const nanosec = d % minute;
    return min + nanosec / (60 * 1000000000);
}
/** Returns the duration as the number of hours. */
export function toHours(d: Duration): number {
    const h = Math.trunc(d / hour);
    const nanosec = d % hour;
    return h + nanosec / (60 * 60 * 1000000000);
}
const ascii0 = 48;
// Formats the fraction of v/10**prec (e.g., ".12345") into the
// tail of buf, omitting trailing zeros. It omits the decimal
// point too when the fraction is 0. It returns the index where the
// output bytes begin and the value v/10**prec.
function fmtFrac(buf: Uint8Array, v: number, prec: number): [
    number,
    number
] {
    // Omit trailing zeros up to and including decimal point.
    let w = buf.length;
    let print = false;
    let nv = v;
    for (let i = 0; i < prec; i++) {
        const digit = nv % 10;
        print = print || digit !== 0;
        if (print) {
            w--;
            buf[w] = digit + ascii0;
        }
        nv = Math.trunc(nv / 10);
    }
    if (print) {
        w--;
        buf[w] = 46; // '.'
    }
    return [w, nv];
}
// fmtInt formats v into the tail of buf.
// It returns the index where the output begins.
function fmtInt(buf: Uint8Array, v: number): number {
    let w = buf.length;
    if (v === 0) {
        w--;
        buf[w] = ascii0;
        return w;
    }
    let nv = v;
    while (nv > 0) {
        w--;
        buf[w] = (nv % 10) + ascii0;
        nv = Math.trunc(nv / 10);
    }
    return w;
}
/**
 * Returns a string representing the duration in the form "72h3m0.5s".
 * Leading zero units are omitted. As a special case, durations less than one
 * second format use a smaller unit (milli-, micro-, or nanoseconds) to ensure
 * that the leading digit is non-zero. The zero duration formats as 0s.
 */
export function durationString(d: Duration): string {
    // Largest time is 2501h59m59.254740991s
    const buf = new Uint8Array(32);
    let w = buf.length;
    let u = d;
    const neg = d < 0;
    if (neg) {
        u = -u;
    }
    // Some ascii codes so we avoid magic numbers
    const sCode = 115;
    const mCode = 109;
    if (u < second) {
        // Special case: if duration is smaller than a second,
        // use smaller units, like 1.2ms
        let prec = 0;
        w--;
        buf[w] = sCode;
        w--;
        if (u === 0) {
            return "0s";
        }
        else if (u < microsecond) {
            // print nanoseconds
            prec = 0;
            buf[w] = 110; // 'n'
        }
        else if (u < millisecond) {
            // print microseconds
            prec = 3;
            // U+00B5 'µ' micro sign == 0xC2 0xB5
            buf[w] = 181;
            w--; // Need to write two bytes.
            buf[w] = 194;
        }
        else {
            // print milliseconds
            prec = 6;
            buf[w] = mCode;
        }
        [w, u] = fmtFrac(buf.subarray(0, w), u, prec);
        w = fmtInt(buf.subarray(0, w), u);
    }
    else {
        w--;
        buf[w] = sCode;
        [w, u] = fmtFrac(buf.subarray(0, w), u, 9);
        // u is now integer seconds
        w = fmtInt(buf.subarray(0, w), u % 60);
        u = Math.trunc(u / 60);
        // u is now integer minutes
        if (u > 0) {
            w--;
            buf[w] = mCode;
            w = fmtInt(buf.subarray(0, w), u % 60);
            u = Math.trunc(u / 60);
            // u is now integer hours
            // Stop at hours because days can be different lengths
            if (u > 0) {
                w--;
                buf[w] = 104; // 'h'
                w = fmtInt(buf.subarray(0, w), u);
            }
        }
    }
    if (neg) {
        w--;
        buf[w] = 45; // '-'
    }
    return new TextDecoder("utf-8").decode(buf.subarray(w));
}
