import { paths } from 'src/routes/paths';

// ----------------------------------------------------------------------

/** Откуда пришёл новый пользователь: экран профиля показывает разные подсказки. */
export type WelcomeSource = 'sign-up' | 'sign-in';

export const WELCOME_PARAM = 'welcome';

/**
 * returnTo приходит из query-строки — им может управлять кто угодно. Пускаем
 * только относительный путь внутри приложения: иначе ссылка вида
 * ?returnTo=https://evil.example или ?returnTo=javascript:... превращает вход
 * в open redirect / XSS. «//host» и «/\host» браузер трактует как другой домен.
 */
export function safeReturnTo(value: string | null | undefined): string | null {
  if (!value || !value.startsWith('/')) return null;
  if (value.startsWith('//') || value.startsWith('/\\')) return null;
  return value;
}

/**
 * Куда вести только что созданный по телефону аккаунт. Без returnTo — в профиль
 * дозаполнить ФИО; с returnTo — туда, откуда человек пришёл (например, со
 * страницы выставки).
 *
 * Навигация полная (window.location), а не router.push: AuthProvider и так
 * перезагружает страницу при смене пользователя, а полная загрузка сразу
 * на нужный URL не гоняется с этим reload.
 */
export function redirectNewUser(source: WelcomeSource, returnTo: string | null): void {
  const target = safeReturnTo(returnTo) ?? `${paths.dashboard.profile}?${WELCOME_PARAM}=${source}`;
  window.location.assign(target);
}
