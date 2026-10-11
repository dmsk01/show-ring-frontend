import { it, expect, describe } from 'vitest';

import { latestOnly } from '../latest-only';

// ----------------------------------------------------------------------
// Ревью фронтенда 2026-10-09, FE-21: ответ на «Ива» приходил позже ответа на
// «Иван» и затирал его — на стойке показывались устаревшие карточки.

function deferred<T>() {
  let resolve!: (v: T) => void;
  const promise = new Promise<T>((r) => {
    resolve = r;
  });
  return { promise, resolve };
}

describe('latestOnly', () => {
  it('drops a result that arrives after a newer request', async () => {
    const shown: string[] = [];
    const run = latestOnly();
    const slow = deferred<string>();
    const fast = deferred<string>();

    const first = run(() => slow.promise).then((r) => r.ok && shown.push(r.value));
    const second = run(() => fast.promise).then((r) => r.ok && shown.push(r.value));

    fast.resolve('Иван');
    slow.resolve('Ива');
    await Promise.all([first, second]);

    expect(shown).toEqual(['Иван']);
  });

  it('passes through a single request', async () => {
    const run = latestOnly();
    expect(await run(async () => 42)).toEqual({ ok: true, value: 42 });
  });
});
