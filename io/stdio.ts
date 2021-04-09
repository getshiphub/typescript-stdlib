// Copyright (c) 2020-2021 Christopher Szatmary <cs@christopherszatmary.com>
// All rights reserved. MIT License.
import { Result } from "../global.ts";
import * as errors from "../errors/mod.ts";
import { Writer, WriterSync } from "./io.ts";
interface DenoStdWriter extends Deno.Writer, Deno.WriterSync {
    rid: number;
}
class StdioWriter {
    #w: DenoStdWriter;
    constructor(w: DenoStdWriter) {
        this.#w = w;
    }
    get rid(): number {
        return this.#w.rid;
    }
    async write(p: Uint8Array): Promise<Result<number, error>> {
        // eslint-disable-next-line no-restricted-syntax
        try {
            const n = await this.#w.write(p);
            return Result.success(n);
        }
        catch (e) {
            return Result.failure(errors.fromJSError(e));
        }
    }
    writeSync(p: Uint8Array): Result<number, error> {
        // eslint-disable-next-line no-restricted-syntax
        try {
            return Result.success(this.#w.writeSync(p));
        }
        catch (e) {
            return Result.failure(errors.fromJSError(e));
        }
    }
}
export const stdout: Writer & WriterSync = new StdioWriter(Deno.stdout);
export const stderr: Writer & WriterSync = new StdioWriter(Deno.stderr);
