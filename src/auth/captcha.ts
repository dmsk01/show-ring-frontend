import type { Challenge } from 'altcha/lib';

import { pbkdf2, solveChallenge } from 'altcha/lib';

import axios, { endpoints } from 'src/lib/axios';

// ----------------------------------------------------------------------
// Невидимая капча ALTCHA (proof-of-work). Задачу выдаёт и проверяет наш
// бэкенд (app/services/captcha.py) — сторонних сервисов и cookie нет.
// Браузер перебирает счётчик, пока PBKDF2 (WebCrypto) не даст ключ с нужным
// префиксом: для человека это ~0,5 с ожидания на кнопке, для бота с тысячами
// запросов — тысячи секунд CPU.
//
// Решение одноразовое: на каждую отправку SMS (включая повторную) — новое.

const SOLVE_TIMEOUT_MS = 30_000;

/** Получить задачу, решить и вернуть payload для поля `captcha` (base64). */
export async function solveCaptcha(): Promise<string> {
  const { data: challenge } = await axios.get<Challenge>(endpoints.captcha.challenge);

  const solution = await solveChallenge({
    challenge,
    deriveKey: pbkdf2.deriveKey,
    timeout: SOLVE_TIMEOUT_MS,
  });
  if (!solution) {
    throw new Error('captcha_unsolved');
  }

  // Формат payload ALTCHA v3: base64(JSON {challenge, solution}). JSON
  // содержит только ASCII (hex, цифры, латиница), поэтому btoa безопасен.
  return btoa(
    JSON.stringify({
      challenge: { parameters: challenge.parameters, signature: challenge.signature },
      solution,
    })
  );
}
