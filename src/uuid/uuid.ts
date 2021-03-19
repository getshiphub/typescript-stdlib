// Copyright (c) 2020-2021 Christopher Szatmary <cs@christopherszatmary.com>
// All rights reserved. MIT License.

/* eslint-disable no-bitwise */

import crypto from "crypto";
import { runtime } from "../_runtime/runtime";
import { Result, panic } from "../global";
import * as errors from "../errors/mod";

export enum Version {
  nil,
  v1,
  v2,
  v3,
  v4,
  v5,
}

export enum Variant {
  ncs,
  rfc4122,
  microsoft,
  future,
}

const uuidSize = 16;
const versionIndex = 6;
const variantIndex = 8;

function createNameBasedUUID(namespace: Uint8Array, name: string, version: 3 | 5): Buffer {
  // Section 4.3 describes the algorithm for creating a name based uuid
  // https://tools.ietf.org/html/rfc4122#section-4.3
  // This is used to create v3 and v5 uuids

  // Convert name to bytes and concatenate it with the namespace
  const buf = Buffer.concat([namespace, Buffer.from(name, "utf8")]);

  // Compute the hash of the namespace concatenated with the name
  let algorithm: "sha1" | "md5";
  if (version === 5) {
    algorithm = "sha1";
  } else {
    algorithm = "md5";
  }

  const hash = crypto.createHash(algorithm).update(buf).digest();

  // Set version and variant as required
  hash[versionIndex] = (hash[versionIndex] & 0b00001111) | (version << 4);
  hash[variantIndex] = (hash[variantIndex] & 0b00111111) | 0b10000000;

  return hash;
}

// Small helper to convert bytes to a hex string so we don't
// need to import the hex module.
function bytesToHex(bytes: Uint8Array, start: number, end: number): string {
  const digits: string[] = [];
  for (let i = start; i < end; i++) {
    const bit = bytes[i];
    let s = bit.toString(16);
    if (bit < 0x10) {
      // eslint-disable-next-line prefer-template
      s = "0" + s;
    }
    digits.push(s);
  }
  return digits.join("");
}

/**
 * Represents a RFC 4122 spec compliant UUID.
 * https://tools.ietf.org/html/rfc4122
 */
class UUID {
  #buf: Uint8Array;

  constructor(buf: Uint8Array) {
    this.#buf = buf;
  }

  /**
   * Returns a `Uint8Array` containing the bytes stored in the `UUID`.
   *
   * **Note:** This will return a copy of the bytes to ensure the
   * `UUID` remains immutable.
   */
  bytes(): Uint8Array {
    const buf = new Uint8Array(uuidSize);
    buf.set(this.#buf);
    return buf;
  }

  /**
   * Creates a string representation of the uuid instance.
   *
   * i.e. xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx
   */
  toString(): string {
    return [
      bytesToHex(this.#buf, 0, 4),
      "-",
      bytesToHex(this.#buf, 4, 6),
      "-",
      bytesToHex(this.#buf, 6, 8),
      "-",
      bytesToHex(this.#buf, 8, 10),
      "-",
      bytesToHex(this.#buf, 10, this.#buf.length),
    ].join("");
  }

  /** Checks if the current UUID instance is equal to the given UUID instance. */
  equals(uuid: UUID): boolean {
    // Check that all the bytes are equal
    for (let i = 0; i < this.#buf.length; i++) {
      if (this.#buf[i] !== uuid.#buf[i]) {
        return false;
      }
    }

    return true;
  }

  /** Returns the version of the uuid. */
  version(): Version {
    return this.#buf[versionIndex] >> 4;
  }

  /** Returns the layout variant of the uuid. */
  variant(): Variant {
    const variantOctet = this.#buf[variantIndex];
    if (variantOctet >> 7 === 0) {
      return Variant.ncs;
    } else if (variantOctet >> 6 === 0b10) {
      return Variant.rfc4122;
    } else if (variantOctet >> 5 === 0b110) {
      return Variant.microsoft;
    }

    return Variant.future;
  }

  /** Custom inspect implementation to print a debug description. */
  [runtime.customInspect](): string {
    return `UUID(${this.toString()})`;
  }
}

// Only export the type, not the class itself.
export type { UUID };

/* ----- UUID Creation Methods ----- */

/** Creates a RFC 4122 spec compliant v4 uuid. */
export function newV4(): UUID {
  // Section 4.4 describes the algorithm for creating a v4 UUID
  // https://tools.ietf.org/html/rfc4122#section-4.4

  // Generate 128 bits of cryptographically strong pseudo-random data
  const rnds = crypto.randomBytes(uuidSize);

  // Octet 6-7 is time_hi_and_version
  // Need to set the 4 most significant bits to the 4-bit version number
  // Version number for v4 is 0100 per 4.1.3
  // https://tools.ietf.org/html/rfc4122#section-4.1.3
  rnds[versionIndex] = (rnds[versionIndex] & 0b00001111) | 0b01000000;

  // Octet 8 is clock_seq_hi_and_reserved
  // Need to set the 2 most significant bits to 1 and 0
  rnds[variantIndex] = (rnds[variantIndex] & 0b00111111) | 0b10000000;

  return new UUID(rnds);
}

/** Creates a RFC 4122 spec compliant v3 uuid. */
export function newV3(namespace: UUID, name: string): UUID {
  const hash = createNameBasedUUID(namespace.bytes(), name, 3);
  // v3 uses MD5 which is 16 bytes so no need to modify
  return new UUID(hash);
}

/** Creates a RFC 4122 spec compliant v5 uuid. */
export function newV5(namespace: UUID, name: string): UUID {
  const hash = createNameBasedUUID(namespace.bytes(), name, 5);
  // v5 uses SHA1 which creates a 20 byte buffer so we need to trim it
  return new UUID(hash.subarray(0, uuidSize));
}

/**
 * Creates a new UUID instance from the given uuid string.
 * If the string is not a valid uuid, an error will be returned.
 */
export function fromString(uuidString: string): Result<UUID, error> {
  // uuid strings are 36 chars, 32 hex digits + 4 dashes
  if (uuidString.length !== 36) {
    return Result.failure(errors.errorString(`uuid: incorrect UUID length: ${uuidString}`));
  }

  // Make sure dashes are present at the correct indices
  if (
    uuidString[8] !== "-" ||
    uuidString[13] !== "-" ||
    uuidString[18] !== "-" ||
    uuidString[23] !== "-"
  ) {
    return Result.failure(errors.errorString(`uuid: incorrect UUID format: ${uuidString}`));
  }

  const buf = new Uint8Array(uuidSize);
  const ranges = [
    [0, 8],
    [9, 13],
    [14, 18],
    [19, 23],
    [24, 36],
  ];
  let offset = 0;

  for (const range of ranges) {
    for (let i = range[0]; i < range[1]; i += 2) {
      const firstDigit = parseInt(uuidString[i], 16);
      const secondDigit = parseInt(uuidString[i + 1], 16);

      // Char was not a valid hex digit
      if (Number.isNaN(firstDigit) || Number.isNaN(secondDigit)) {
        return Result.failure(errors.errorString(`uuid: invalid character in UUID: ${uuidString}`));
      }

      // Combine digits into one byte
      buf[offset] = (firstDigit << 4) | secondDigit;
      offset++;
    }
  }

  const uuid = new UUID(buf);

  // Make sure version is valid
  const version = uuid.version();
  if (version < Version.nil || version > Version.v5) {
    return Result.failure(errors.errorString(`uuid: invalid UUID version: ${uuidString}`));
  }

  return Result.success(uuid);
}

/**
 * `mustFromString` is like `fromString` but panics if an error occurred.
 * This is useful when creating UUIDs from string literals.
 */
export function mustFromString(uuidString: string): UUID {
  const r = fromString(uuidString);
  if (r.isFailure()) {
    panic(r.failure().error());
  }

  return r.success();
}

/* ----- Special UUIDs ----- */

/** The nil uuid where all bits are set to 0. */
export const nil = new UUID(new Uint8Array(uuidSize));

/**
 * Name space IDs defined in Appendix C.
 * https://tools.ietf.org/html/rfc4122#appendix-C
 */
export const namespaceIDs = Object.freeze({
  /* eslint-disable @typescript-eslint/naming-convention */
  DNS: mustFromString("6ba7b810-9dad-11d1-80b4-00c04fd430c8"),
  URL: mustFromString("6ba7b811-9dad-11d1-80b4-00c04fd430c8"),
  OID: mustFromString("6ba7b812-9dad-11d1-80b4-00c04fd430c8"),
  X500: mustFromString("6ba7b814-9dad-11d1-80b4-00c04fd430c8"),
  /* eslint-enable @typescript-eslint/naming-convention */
});
