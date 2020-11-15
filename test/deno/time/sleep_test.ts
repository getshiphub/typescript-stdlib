import * as testing from "../testing.ts";
import { time } from "../../../dist/deno/mod.ts";

Deno.test("time.sleep", async () => {
  const start = new Date();
  const amount = 100;
  await time.sleep(amount * time.millisecond);
  const end = new Date();

  const epsilon = 100;
  const duration = end.getTime() - start.getTime();
  const diff = duration - amount;

  testing.assert(diff < epsilon);
  testing.assert(diff > -epsilon);
});

Deno.test("time.sleepSync", () => {
  const start = new Date();
  const amount = 100;
  time.sleepSync(amount * time.millisecond);
  const end = new Date();

  const epsilon = 100;
  const duration = end.getTime() - start.getTime();
  const diff = duration - amount;

  testing.assert(diff < epsilon);
  testing.assert(diff > -epsilon);
});
