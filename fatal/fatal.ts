// THIS IS AN AUTOGENERATED FILE. DO NOT EDIT THIS FILE DIRECTLY

// Copyright (c) 2020 Christopher Szatmary <cs@christopherszatmary.com>
// All rights reserved. MIT License.
let shouldShowErrDetail = false;
export function showErrDetail(b: boolean): void {
    shouldShowErrDetail = b;
}
/**
 * Logs a message and error to stderr, then terminates the process with code 1.
 * @param optionalParams Any additional parameters to log.
 */
export function exitErr(err: error, message: string, ...optionalParams: unknown[]): never {
    console.error(message, ...optionalParams);
    if (shouldShowErrDetail) {
        console.error(`Error: ${err.detailedError()}`);
    }
    else {
        console.error(`Error: ${err.error()}`);
    }
    Deno.exit(1);
}
/**
 * Logs a message to stderr, then terminates the process with code 1.
 * @param optionalParams Any additional parameters to log.
 */
export function exit(message: string, ...optionalParams: unknown[]): never {
    console.error(message, ...optionalParams);
    Deno.exit(1);
}
