// Copyright (c) 2020-2021 Christopher Szatmary <cs@christopherszatmary.com>
// All rights reserved. MIT License.

import { Duration, toMilliseconds } from "./duration";

// Helper to get the millisecond amount from a nanosecond Duration
// for use with setTimeout
function timeoutDuration(d: Duration): number {
  // istanbul ignore next
  if (d <= 0) {
    return 0;
  }

  return toMilliseconds(d);
}

/** Asynchronously waits for `d` duration (nanoseconds). */
export function sleep(d: Duration): Promise<void> {
  return new Promise((resolve) => {
    setTimeout(resolve, timeoutDuration(d));
  });
}

/**
 * Synchronously waits for `d` duration (nanoseconds).
 *
 * **NOTE:** This will block the NodeJS thread. Use with care!
 */
export function sleepSync(d: Duration): void {
  const a = new Int32Array(new SharedArrayBuffer(4));
  Atomics.wait(a, 0, 0, timeoutDuration(d));
}
