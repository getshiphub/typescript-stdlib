import * as testing from "../testing.ts";
import { io, strings } from "../../../dist/deno/mod.ts";

Deno.test("strings.Reader: read all", () => {
  const r = new strings.Reader("0123456789");
  const p = new Uint8Array(10);

  let result = r.readSync(p);
  const expected = [0x30, 0x31, 0x32, 0x33, 0x34, 0x35, 0x36, 0x37, 0x38, 0x39];
  testing.assertEquals(result.unwrap(), 10);
  testing.assertEquals(p, new Uint8Array(expected));
  testing.assertEquals(r.length, 0);
  testing.assertEquals(r.size, 10);

  result = r.readSync(p);
  testing.assertEquals(result.unwrapFailure(), io.eof);
});

Deno.test("strings.Reader: read chunks", () => {
  const r = new strings.Reader("0123456789");
  const p = new Uint8Array(5);

  let result = r.readSync(p);
  let expected = [0x30, 0x31, 0x32, 0x33, 0x34];
  testing.assertEquals(result.unwrap(), 5);
  testing.assertEquals(p, new Uint8Array(expected));
  testing.assertEquals(r.length, 5);
  testing.assertEquals(r.size, 10);

  result = r.readSync(p);
  expected = [0x35, 0x36, 0x37, 0x38, 0x39];
  testing.assertEquals(result.unwrap(), 5);
  testing.assertEquals(p, new Uint8Array(expected));
  testing.assertEquals(r.length, 0);
  testing.assertEquals(r.size, 10);

  result = r.readSync(p);
  testing.assertEquals(result.unwrapFailure(), io.eof);
});

Deno.test("strings.Reader: async", async () => {
  const r = new strings.Reader("0123456789");
  const p = new Uint8Array(10);

  let result = await r.read(p);
  const expected = [0x30, 0x31, 0x32, 0x33, 0x34, 0x35, 0x36, 0x37, 0x38, 0x39];
  testing.assertEquals(result.unwrap(), 10);
  testing.assertEquals(p, new Uint8Array(expected));
  testing.assertEquals(r.length, 0);
  testing.assertEquals(r.size, 10);

  result = await r.read(p);
  testing.assertEquals(result.unwrapFailure(), io.eof);
});
