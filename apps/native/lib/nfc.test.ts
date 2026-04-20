import { describe, expect, it } from "vitest";

import {
  decodeFirstWristbandToken,
  decodeNdefTextPayload,
  isValidWristbandToken,
  normalizeWristbandToken,
} from "./nfc";

function encodeNdefTextRecord(text: string, language = "en"): Uint8Array {
  const langBytes = new TextEncoder().encode(language);
  const textBytes = new TextEncoder().encode(text);
  const out = new Uint8Array(1 + langBytes.length + textBytes.length);
  out[0] = langBytes.length & 0x3f;
  out.set(langBytes, 1);
  out.set(textBytes, 1 + langBytes.length);
  return out;
}

describe("isValidWristbandToken", () => {
  it.each([
    "WRISTBAND-SAFE-NFC-001",
    "WRISTBAND-A1B2-001",
    "wristband-safe-nfc-001",
    "  WRISTBAND-CONFLICT-NFC-002  ",
  ])("accepts %s", (token) => {
    expect(isValidWristbandToken(token)).toBe(true);
  });

  it.each(["", "PATIENT-1", "WRISTBAND_SAFE", "WRISTBAND-", "WRISTBAND-SAFE NFC"])(
    "rejects %s",
    (token) => {
      expect(isValidWristbandToken(token)).toBe(false);
    },
  );
});

describe("normalizeWristbandToken", () => {
  it("uppercases and trims", () => {
    expect(normalizeWristbandToken("  wristband-safe-nfc-001 ")).toBe("WRISTBAND-SAFE-NFC-001");
  });
});

describe("decodeNdefTextPayload", () => {
  it("decodes a UTF-8 NDEF text record", () => {
    const payload = encodeNdefTextRecord("WRISTBAND-SAFE-NFC-001");
    expect(decodeNdefTextPayload(payload)).toBe("WRISTBAND-SAFE-NFC-001");
  });

  it("accepts plain number arrays from native bridges", () => {
    const payload = Array.from(encodeNdefTextRecord("WRISTBAND-A-001"));
    expect(decodeNdefTextPayload(payload)).toBe("WRISTBAND-A-001");
  });

  it("returns null on empty payload", () => {
    expect(decodeNdefTextPayload(new Uint8Array())).toBeNull();
  });

  it("returns null when status byte claims a longer language than available", () => {
    expect(decodeNdefTextPayload(new Uint8Array([0x10]))).toBeNull();
  });
});

describe("decodeFirstWristbandToken", () => {
  it("returns the first non-empty decoded record", () => {
    const records = [
      { payload: new Uint8Array() },
      { payload: encodeNdefTextRecord("WRISTBAND-FIRST-NFC-001") },
      { payload: encodeNdefTextRecord("WRISTBAND-SECOND-NFC-002") },
    ];
    expect(decodeFirstWristbandToken(records)).toBe("WRISTBAND-FIRST-NFC-001");
  });

  it("trims whitespace surrounding the decoded payload", () => {
    const records = [{ payload: encodeNdefTextRecord("  WRISTBAND-PAD-NFC-001  ") }];
    expect(decodeFirstWristbandToken(records)).toBe("WRISTBAND-PAD-NFC-001");
  });

  it("returns null when no records decode to text", () => {
    expect(decodeFirstWristbandToken([{ payload: new Uint8Array() }])).toBeNull();
    expect(decodeFirstWristbandToken([])).toBeNull();
  });
});
