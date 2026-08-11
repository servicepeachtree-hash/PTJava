import { randomBytes, createHash } from 'crypto';

/** Generates human-typeable codes like "7F2K-9QRT". */
export function generateBackupCodes(count = 10): string[] {
  const codes: string[] = [];
  for (let i = 0; i < count; i++) {
    const raw = randomBytes(5).toString('hex').toUpperCase(); // 10 hex chars
    codes.push(`${raw.slice(0, 5)}-${raw.slice(5, 10)}`);
  }
  return codes;
}

export function hashBackupCode(code: string): string {
  return createHash('sha256').update(code.trim().toUpperCase()).digest('hex');
}
