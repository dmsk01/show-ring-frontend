import { it, expect, describe } from 'vitest';

import { mbToBytes, bytesToMb, isValidQuota } from '../quota';

describe('bytesToMb / mbToBytes', () => {
  it('round-trips whole megabytes', () => {
    expect(bytesToMb(10 * 1024 * 1024)).toBe(10);
    expect(mbToBytes(10)).toBe(10 * 1024 * 1024);
    expect(bytesToMb(mbToBytes(25))).toBe(25);
  });

  it('rounds bytes to the nearest MB', () => {
    expect(bytesToMb(1024 * 1024 + 100)).toBe(1);
    expect(bytesToMb(Math.round(1.6 * 1024 * 1024))).toBe(2);
  });
});

describe('isValidQuota', () => {
  it('accepts positive integers for both fields', () => {
    expect(isValidQuota(50, 100 * 1024 * 1024)).toBe(true);
  });

  it('rejects zero or negative values', () => {
    expect(isValidQuota(0, 1024)).toBe(false);
    expect(isValidQuota(10, 0)).toBe(false);
    expect(isValidQuota(-1, 1024)).toBe(false);
  });

  it('rejects non-integers (e.g. NaN from empty input)', () => {
    expect(isValidQuota(Number.NaN, 1024)).toBe(false);
    expect(isValidQuota(10, 1.5)).toBe(false);
  });
});
