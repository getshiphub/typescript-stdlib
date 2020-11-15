import { inspect } from "util";
import { uuid } from "../../../src";

const v4Regex = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const namespace = uuid.mustFromString("1d4f6d02-1146-48a8-b0ad-f562220303de");

describe("uuid/uuid.ts", () => {
  test("uuid.nil: all nil uuids are equal", () => {
    const nilUUID = uuid.nil;
    const nilInstance = uuid.mustFromString("00000000-0000-0000-0000-000000000000");

    // nil uuid is a singleton and will always be the same instance
    expect(nilUUID).toBe(uuid.nil);
    expect(nilUUID.toString()).toBe("00000000-0000-0000-0000-000000000000");
    expect(nilUUID.equals(nilInstance)).toBe(true);
  });

  test("uuid.UUID.bytes", () => {
    const uuidString = "1d4f6d02-1146-48a8-b0ad-f562220303de";
    const u = uuid.mustFromString(uuidString);
    const expected = new Uint8Array([
      0x1d,
      0x4f,
      0x6d,
      0x02,
      0x11,
      0x46,
      0x48,
      0xa8,
      0xb0,
      0xad,
      0xf5,
      0x62,
      0x22,
      0x03,
      0x03,
      0xde,
    ]);
    expect(u.bytes()).toEqual(expected);
  });

  test("uuid.UUID.equals: not equal", () => {
    const uuidString1 = "1d4f6d02-1146-48a8-b0ad-f562220303de";
    const u1 = uuid.fromString(uuidString1).unwrap();
    const uuidString2 = "1d4f6d02-1146-58a8-b0ad-f562220303de";
    const u2 = uuid.fromString(uuidString2).unwrap();
    expect(u1.equals(u2)).toBe(false);
  });

  test.each([
    ["00000000-0000-0000-0000-000000000000", uuid.Variant.ncs],
    ["00000000-0000-0000-8000-000000000000", uuid.Variant.rfc4122],
    ["00000000-0000-0000-c000-000000000000", uuid.Variant.microsoft],
    ["00000000-0000-0000-e000-000000000000", uuid.Variant.future],
  ])("uuid.UUID.variant: %s", (s, variant) => {
    const u = uuid.mustFromString(s);
    expect(u.variant()).toBe(variant);
  });

  test("uuid.newV4", () => {
    const u = uuid.newV4();
    expect(u.toString()).toMatch(v4Regex);
    expect(u.version()).toBe(uuid.Version.v4);
    expect(u.variant()).toBe(uuid.Variant.rfc4122);
  });

  test("uuid.newV3", () => {
    const u = uuid.newV3(namespace, "hello");
    expect(u.toString()).toBe("2dcc63e2-4ad4-30e2-98a9-609940113153");
  });

  test("uuid.newV5", () => {
    const u = uuid.newV5(namespace, "hello");
    expect(u.toString()).toBe("0b6de54f-2342-5355-aa90-44957e68d403");
  });

  test("uuid.newV5: creates the same uuid for the same namespace and name", () => {
    const uuid1 = uuid.newV5(namespace, "always the same");
    const uuid2 = uuid.newV5(namespace, "always the same");
    expect(uuid1.equals(uuid2)).toBe(true);
  });

  test("uuid.fromString", () => {
    const uuidString = "1d4f6d02-1146-48a8-b0ad-f562220303de";
    const u = uuid.fromString(uuidString).unwrap();
    expect(u.toString()).toBe(uuidString);
    expect(u.version()).toBe(uuid.Version.v4);
    expect(u.variant()).toBe(uuid.Variant.rfc4122);
  });

  test.each([
    ["abcde", "uuid: incorrect UUID length: abcde"],
    [
      "1d4f6d021-146-48a8-b0ad-f562220303de",
      "uuid: incorrect UUID format: 1d4f6d021-146-48a8-b0ad-f562220303de",
    ],
    [
      "1h4f6d02-1146-48a8-b0ad-f562220303de",
      "uuid: invalid character in UUID: 1h4f6d02-1146-48a8-b0ad-f562220303de",
    ],
    [
      "1d4f6d02-1146-78a8-b0ad-f562220303de",
      "uuid: invalid UUID version: 1d4f6d02-1146-78a8-b0ad-f562220303de",
    ],
  ])("uuid.fromString: error", (str, reason) => {
    const r = uuid.fromString(str);
    expect(r.unwrapFailure().error()).toBe(reason);
  });

  test("uuid.mustFromString", () => {
    const uuidString = "1d4f6d02-1146-48a8-b0ad-f562220303de";
    const u = uuid.mustFromString(uuidString);
    expect(u.toString()).toBe(uuidString);
    expect(u.version()).toBe(uuid.Version.v4);
    expect(u.variant()).toBe(uuid.Variant.rfc4122);
  });

  test.each([
    ["abcde", "uuid: incorrect UUID length: abcde"],
    [
      "1d4f6d021-146-48a8-b0ad-f562220303de",
      "uuid: incorrect UUID format: 1d4f6d021-146-48a8-b0ad-f562220303de",
    ],
    [
      "1h4f6d02-1146-48a8-b0ad-f562220303de",
      "uuid: invalid character in UUID: 1h4f6d02-1146-48a8-b0ad-f562220303de",
    ],
    [
      "1d4f6d02-1146-78a8-b0ad-f562220303de",
      "uuid: invalid UUID version: 1d4f6d02-1146-78a8-b0ad-f562220303de",
    ],
  ])("uuid.mustFromString: panic: %s", (str, reason) => {
    expect(() => {
      uuid.mustFromString(str);
    }).toPanic(reason);
  });

  test("uuid: inspect", () => {
    const uuidString = "1d4f6d02-1146-48a8-b0ad-f562220303de";
    const u = uuid.mustFromString(uuidString);
    const s = inspect(u);
    expect(s).toBe("UUID(1d4f6d02-1146-48a8-b0ad-f562220303de)");
  });
});
