// Copyright (c) 2020 Christopher Szatmary <cs@christopherszatmary.com>
// All rights reserved. MIT License.
let shouldShowErrDetail = false;
let onExitHandler: (() => void) | undefined;
/**
 * shouldShowErrDetail sets whether or not the `detailedError` method
 * should be used when `exitErr` is called.
 */
export function showErrDetail(b: boolean): void {
    shouldShowErrDetail = b;
}
/**
 * onExit registers a handler that will run before the process exits
 * when either `exitErr` or `exit` is called.
 * This is useful for performing any clean up actions before exiting.
 */
export function onExit(handler: (() => void) | undefined): void {
    onExitHandler = handler;
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
    onExitHandler?.();
    Deno.exit(1);
}
/**
 * Logs a message to stderr, then terminates the process with code 1.
 * @param optionalParams Any additional parameters to log.
 */
export function exit(message: string, ...optionalParams: unknown[]): never {
    console.error(message, ...optionalParams);
    onExitHandler?.();
    Deno.exit(1);
}
