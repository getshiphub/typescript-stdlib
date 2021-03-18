import { sync, time } from "../../../src";

describe("sync/mutex.ts", () => {
  test("withLock", async () => {
    let val = 1;
    async function inc(): Promise<void> {
      const currVal = val;
      await time.sleep(100);
      val = currVal + 1;
    }

    const mu = new sync.Mutex();
    await Promise.all([sync.withLock(mu, inc), sync.withLock(mu, inc)]);
    expect(val).toBe(3);
  });

  test("mutex: provides exclusive access", async () => {
    let val = 1;
    const mu = new sync.Mutex();
    async function inc(): Promise<void> {
      await mu.lock();
      const currVal = val;
      await time.sleep(100);
      val = currVal + 1;
      mu.unlock();
    }

    await Promise.all([inc(), inc()]);
    expect(val).toBe(3);
  });

  test("mutex: unlock: panics if not locked", () => {
    const mu = new sync.Mutex();
    expect(() => {
      mu.unlock();
    }).toPanic("sync: unlock of unlocked mutex");
  });
});
