import * as testing from "../testing.ts";
import { hex } from "../../../dist/deno/mod.ts";

function toByte(s: string): number {
  return new TextEncoder().encode(s)[0];
}

const tests: [string, number[]][] = [
  // enc, dec
  ["", []],
  ["0001020304050607", [0, 1, 2, 3, 4, 5, 6, 7]],
  ["08090a0b0c0d0e0f", [8, 9, 10, 11, 12, 13, 14, 15]],
  ["f0f1f2f3f4f5f6f7", [0xf0, 0xf1, 0xf2, 0xf3, 0xf4, 0xf5, 0xf6, 0xf7]],
  ["f8f9fafbfcfdfeff", [0xf8, 0xf9, 0xfa, 0xfb, 0xfc, 0xfd, 0xfe, 0xff]],
  ["67", [toByte("g")]],
  ["e3a1", [0xe3, 0xa1]],
];

const errTests: [string, error][] = [
  // in, err
  ["0", hex.errLength],
  ["zd4aa", new hex.InvalidByteError(toByte("z"))],
  ["d4aaz", new hex.InvalidByteError(toByte("z"))],
  ["30313", hex.errLength],
  ["0g", new hex.InvalidByteError(toByte("g"))],
  ["00gg", new hex.InvalidByteError(toByte("g"))],
  ["0\x01", new hex.InvalidByteError(toByte("\x01"))],
  ["ffeed", hex.errLength],
];

Deno.test("hex.encode", () => {
  for (const [enc, dec] of tests) {
    const src = new Uint8Array(dec);
    const dst = hex.encode(src);
    testing.assertEquals(dst.length, src.length * 2);
    testing.assertEquals(new TextDecoder("utf-8").decode(dst), enc);
  }
});

Deno.test("hex.encodeToString", () => {
  for (const [enc, dec] of tests) {
    const src = new Uint8Array(dec);
    testing.assertEquals(hex.encodeToString(src), enc);
  }
});

Deno.test("hex.decode", () => {
  // Case for decoding uppercase hex characters, since
  // Encode always uses lowercase.
  const decTests = tests.concat([
    ["F8F9FAFBFCFDFEFF", [0xf8, 0xf9, 0xfa, 0xfb, 0xfc, 0xfd, 0xfe, 0xff]],
  ]);

  for (const [enc, dec] of decTests) {
    const src = new TextEncoder().encode(enc);
    const dst = hex.decode(src).unwrap();
    testing.assertEquals(Array.from(dst), dec);
  }
});

Deno.test("hex.decodeString", () => {
  for (const [enc, dec] of tests) {
    const dst = hex.decodeString(enc).unwrap();
    testing.assertEquals(Array.from(dst), dec);
  }
});

Deno.test("hex.decode error", () => {
  for (const [input, expectedErr] of errTests) {
    const src = new TextEncoder().encode(input);
    const err = hex.decode(src).unwrapFailure();
    testing.assertEquals(err.error(), expectedErr.error());
    testing.assertEquals(err.detailedError(), expectedErr.detailedError());
  }
});

Deno.test("hex.decodeString error", () => {
  for (const [input, expectedErr] of errTests) {
    const err = hex.decodeString(input).unwrapFailure();
    testing.assertEquals(err.error(), expectedErr.error());
  }
});
