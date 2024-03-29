// Copyright (c) 2020-2021 Christopher Szatmary <cs@christopherszatmary.com>
// All rights reserved. MIT License.

// This code has been ported almost directly from Go's src/encoding/hex/hex.go
// Copyright 2009 The Go Authors. All rights reserved. BSD license.
// https://github.com/golang/go/blob/master/LICENSE

/* eslint-disable no-bitwise */

import { Result } from "../global";
import * as errors from "../errors/mod";

const hextable = new TextEncoder().encode("0123456789abcdef");

/** errLength reports an attempt to decode an odd-length input. */
export const errLength = errors.errorString("hex: odd length hex string");

/** InvalidByteError values describe errors resulting from an invalid byte in a hex string. */
export class InvalidByteError {
  byte: number;

  constructor(byte: number) {
    this.byte = byte;
  }

  error(): string {
    const rune = new TextDecoder("utf-8").decode(new Uint8Array([this.byte]));
    return `hex: invalid byte: ${rune}`;
  }

  detailedError(): string {
    return this.error();
  }
}

/**
 * encodedLen returns the length of an encoding of `n` source bytes.
 * Specifically, it returns `n * 2`.
 */
export function encodeLen(n: number): number {
  return n * 2;
}

/**
 * encode encodes `src` into `encodedLen(src.length)` bytes.
 * encode implements hexadecimal encoding.
 */
export function encode(src: Uint8Array): Uint8Array {
  const dst = new Uint8Array(encodeLen(src.length));
  let j = 0;
  for (const v of src) {
    dst[j] = hextable[v >> 4];
    dst[j + 1] = hextable[v & 0x0f];
    j += 2;
  }

  return dst;
}

/** encodeToString returns the hexadecimal encoding of src. */
export function encodeToString(src: Uint8Array): string {
  return new TextDecoder("utf-8").decode(encode(src));
}

/**
 * decodedLen returns the length of a decoding of `x` source bytes.
 * Specifically, it returns `x / 2`.
 */
export function decodeLen(x: number): number {
  return x / 2;
}

/**
 * fromHexChar converts a hex character into its value.
 * If `c` is not a valid hex character, `-1` is returned.
 */
function fromHexChar(c: number): number {
  // '0' <= c <= '9'
  if (c >= 48 && c <= 57) {
    return c - 48;
  }

  // 'a' <= c <= 'f'
  if (c >= 97 && c <= 102) {
    return c - 97 + 10;
  }

  // 'A' <= c <= 'F'
  if (c >= 65 && c <= 70) {
    return c - 65 + 10;
  }

  return -1;
}

/**
 * decode decodes `src` into `decodedLen(src.length)` bytes.
 * decode expects that `src` contains only hexadecimal
 * characters and that `src` has even length.
 * If the input is malformed, decode returns a failure with an error.
 */
export function decode(src: Uint8Array): Result<Uint8Array, error> {
  const dst = new Uint8Array(decodeLen(src.length));
  let i = 0;
  let j: number;

  for (j = 1; j < src.length; j += 2) {
    const a = fromHexChar(src[j - 1]);
    if (a === -1) {
      return Result.failure(new InvalidByteError(src[j - 1]));
    }

    const b = fromHexChar(src[j]);
    if (b === -1) {
      return Result.failure(new InvalidByteError(src[j]));
    }

    dst[i] = (a << 4) | b;
    i++;
  }

  if (src.length % 2 === 1) {
    // Check for invalid char before reporting bad length,
    // since the invalid char (if present) is an earlier problem.
    const v = fromHexChar(src[j - 1]);
    if (v === -1) {
      return Result.failure(new InvalidByteError(src[j - 1]));
    }

    return Result.failure(errLength);
  }

  return Result.success(dst);
}

/**
 * decodeString returns the bytes represented by the hexadecimal string `s`.
 * decodeString expects that `s` contains only hexadecimal
 * characters and that `s` has even length.
 * If the input is malformed, decode returns a failure with an error.
 */
export function decodeString(s: string): Result<Uint8Array, error> {
  return decode(new TextEncoder().encode(s));
}
