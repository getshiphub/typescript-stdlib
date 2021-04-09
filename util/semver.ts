// Copyright (c) 2020-2021 Christopher Szatmary <cs@christopherszatmary.com>
// All rights reserved. MIT License.
import { Result, panic } from "../global.ts";
import * as errors from "../errors/mod.ts";
const re = /^v?(0|[1-9]\d*)\.(0|[1-9]\d*)\.(0|[1-9]\d*)$/;
/**
 * Represents a SemVer version.
 * https://semver.org/
 *
 * **NOTE:** pre-releases are not currently supported.
 */
export class SemVer {
    #major: number;
    #minor: number;
    #patch: number;
    /**
     * Creates a new SemVer instance from the given `major`,
     * `minor`, and `patch` verion numbers.
     */
    constructor(major: number, minor: number, patch: number) {
        if (!Number.isInteger(major)) {
            panic(`SemVer.new: major version is not a valid integer: ${major}`);
        }
        if (!Number.isInteger(minor)) {
            panic(`SemVer.new: minor version is not a valid integer: ${minor}`);
        }
        if (!Number.isInteger(patch)) {
            panic(`SemVer.new: patch version is not a valid integer: ${patch}`);
        }
        this.#major = major;
        this.#minor = minor;
        this.#patch = patch;
    }
    get major(): number {
        return this.#major;
    }
    get minor(): number {
        return this.#minor;
    }
    get patch(): number {
        return this.#patch;
    }
    toString(): string {
        return `${this.#major}.${this.#minor}.${this.#patch}`;
    }
    /**
     * Compares the current SemVer instance with the
     * given SemVer instance.
     * @returns `-1` if the current instance is less than `sv`,
     * `1` if the current instance is greater than `sv`,
     * or `0` if the instances are equal.
     */
    compare(sv: SemVer): -1 | 0 | 1 {
        if (this.#major < sv.#major) {
            return -1;
        }
        else if (this.#major > sv.#major) {
            return 1;
        }
        // Majors equal
        if (this.#minor < sv.#minor) {
            return -1;
        }
        else if (this.#minor > sv.#minor) {
            return 1;
        }
        // Minors equal
        if (this.#patch < sv.#patch) {
            return -1;
        }
        else if (this.#patch > sv.#patch) {
            return 1;
        }
        return 0;
    }
    /** Returns a new SemVer instance with the major version incremented. */
    incrementMajor(): SemVer {
        return new SemVer(this.#major + 1, 0, 0);
    }
    /** Returns a new SemVer instance with the minor version incremented. */
    incrementMinor(): SemVer {
        return new SemVer(this.#major, this.#minor + 1, 0);
    }
    /** Returns a new SemVer instance with the patch version incremented. */
    incrementPatch(): SemVer {
        return new SemVer(this.#major, this.#minor, this.#patch + 1);
    }
    /** Custom inspect implementation for use with node's `util.inspect`. */
    [Deno.customInspect](): string {
        return `SemVer(${this.toString()})`;
    }
    /**
     * Returns a Result with a `SemVer` instance from the given
     * semver string `s`, or an `error` is `s` is not a valid
     * semver string.
     */
    static parse(s: string): Result<SemVer, error> {
        const m = s.trim().match(re);
        if (m == null) {
            const err = errors.errorString(`SemVer.Parse: Invalid semver string: ${s}`);
            return Result.failure(err);
        }
        const sv = new SemVer(Number(m[1]), Number(m[2]), Number(m[3]));
        return Result.success(sv);
    }
    /**
     * `mustParse` is like `parse` but panics if `s`
     * is not a valid semver string.
     */
    static mustParse(s: string): SemVer {
        const r = SemVer.parse(s);
        if (r.isFailure()) {
            panic(r.failure().error());
        }
        return r.success();
    }
}
