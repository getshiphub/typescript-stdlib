import * as testing from "../testing.ts";
import { sync, time } from "../../../dist/deno/mod.ts";

Deno.test("withLock", async () => {
  let val = 1;
  async function inc(): Promise<void> {
    const currVal = val;
    await time.sleep(100);
    val = currVal + 1;
  }

  const mu = new sync.Mutex();
  await Promise.all([sync.withLock(mu, inc), sync.withLock(mu, inc)]);
  testing.assertEquals(val, 3);
});

Deno.test("mutex: provides exclusive access", async () => {
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
  testing.assertEquals(val, 3);
});

Deno.test("mutex: unlock: panics if not locked", () => {
  const mu = new sync.Mutex();
  testing.assertPanics(() => {
    mu.unlock();
  }, "sync: unlock of unlocked mutex");
});
