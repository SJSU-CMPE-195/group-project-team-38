export const wristbandTokenPattern = /^WRISTBAND-[A-Z0-9-]+$/i;

export function isValidWristbandToken(token: string): boolean {
  return wristbandTokenPattern.test(token.trim());
}

export function normalizeWristbandToken(token: string): string {
  return token.trim().toUpperCase();
}

export type NdefRecordLike = {
  payload: Uint8Array | number[] | ArrayLike<number>;
};

export function decodeNdefTextPayload(
  payload: Uint8Array | number[] | ArrayLike<number>,
): string | null {
  const bytes = payload instanceof Uint8Array ? payload : new Uint8Array(Array.from(payload));
  if (bytes.length === 0) {
    return null;
  }

  const statusByte = bytes[0];
  const isUtf16 = (statusByte & 0x80) !== 0;
  const languageLength = statusByte & 0x3f;
  const textStart = 1 + languageLength;

  if (textStart > bytes.length) {
    return null;
  }

  const textBytes = bytes.subarray(textStart);
  try {
    return new TextDecoder(isUtf16 ? "utf-16" : "utf-8").decode(textBytes);
  } catch {
    return null;
  }
}

export function decodeFirstWristbandToken(records: ReadonlyArray<NdefRecordLike>): string | null {
  for (const record of records) {
    const decoded = decodeNdefTextPayload(record.payload);
    if (!decoded) {
      continue;
    }
    const trimmed = decoded.trim();
    if (trimmed.length > 0) {
      return trimmed;
    }
  }
  return null;
}
