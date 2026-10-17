'use client';

// ----------------------------------------------------------------------
// Ошибка в корневом layout: тема, шрифты и i18n недоступны — отдельный
// документ на простом HTML (Next: global-error заменяет корневой layout).
// Ревью 2026-10-09, FE-26.

export default function GlobalError({
  error,
  retry,
}: {
  error: Error & { digest?: string };
  retry: () => void;
}) {
  console.error(error);
  return (
    <html lang="ru">
      <body
        style={{
          fontFamily: 'system-ui, sans-serif',
          margin: 0,
          padding: '64px 16px',
          textAlign: 'center',
        }}
      >
        <title>BisShow — ошибка</title>
        <h1 style={{ fontSize: 24, marginBottom: 8 }}>Что-то пошло не так</h1>
        <p style={{ color: '#555', marginBottom: 24 }}>
          Попробуйте ещё раз или вернитесь на главную.
        </p>
        <button
          type="button"
          onClick={() => retry()}
          style={{ padding: '10px 20px', marginRight: 12 }}
        >
          Повторить
        </button>
        <a href="/">На главную</a>
      </body>
    </html>
  );
}
