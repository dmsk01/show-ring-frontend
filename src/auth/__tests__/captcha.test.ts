import { it, vi, expect, describe } from 'vitest';
import { pbkdf2, verifySolution, createChallenge } from 'altcha/lib';

import axios from 'src/lib/axios';

import { solveCaptcha } from '../captcha';

// ----------------------------------------------------------------------

describe('solveCaptcha', () => {
  it('solves a server challenge into a payload the verifier accepts', async () => {
    const secret = 'test-secret';
    // Дешёвая задача (cost=1), как на бэкенде, только подписанная тестовым ключом.
    const challenge = await createChallenge({
      algorithm: 'PBKDF2/SHA-256',
      cost: 1,
      deriveKey: pbkdf2.deriveKey,
      hmacSignatureSecret: secret,
      expiresAt: Math.floor(Date.now() / 1000) + 600,
    });
    vi.spyOn(axios, 'get').mockResolvedValueOnce({ data: challenge });

    const payload = await solveCaptcha();

    const decoded = JSON.parse(atob(payload));
    const result = await verifySolution({
      challenge: decoded.challenge,
      solution: decoded.solution,
      deriveKey: pbkdf2.deriveKey,
      hmacSignatureSecret: secret,
    });
    expect(result.verified).toBe(true);
  });
});
