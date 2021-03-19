// Copyright (c) 2020-2021 Christopher Szatmary <cs@christopherszatmary.com>
// All rights reserved. MIT License.

import { panic } from "../global";

/** A Locker represents an object that can be locked and unlocked. */
export interface Locker {
  lock(): Promise<void>;
  unlock(): void;
}

/**
 * withLock runs the closure `fn` once it has locked `l`.
 * It automatically unlocks `l` once `fn` has completed.
 * This provides any easy way to lock a resource without
 * needing to remember to unlock it after.
 */
export async function withLock<T>(l: Locker, fn: () => Promise<T>): Promise<T> {
  await l.lock();
  // eslint-disable-next-line no-restricted-syntax
  try {
    return await fn();
  } finally {
    l.unlock();
  }
}

/**
 * A Mutex is a mutual exclusion lock.
 * It prevents concurrent access to a shared resource.
 */
export class Mutex {
  #locked = false;
  #resolvers: (() => void)[] = [];

  /**
   * lock locks the mutex.
   * If the lock is already in use, lock will wait for it
   * to be free. The returned promise will resolve once
   * the lock has been acquired.
   */
  lock(): Promise<void> {
    if (!this.#locked) {
      this.#locked = true;
      return Promise.resolve();
    }
    return new Promise((resolve) => {
      this.#resolvers.push(resolve);
    });
  }

  /**
   * unlock unlocks the mutex.
   * If the mutex is not currently locked, unlock will panic.
   */
  unlock(): void {
    if (!this.#locked) {
      panic("sync: unlock of unlocked mutex");
    }
    const resolve = this.#resolvers.shift();
    if (resolve !== undefined) {
      resolve();
      return;
    }
    this.#locked = false;
  }
}
