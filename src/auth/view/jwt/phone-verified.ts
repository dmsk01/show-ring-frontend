import { paths } from 'src/routes/paths';

// ----------------------------------------------------------------------

/** Откуда пришёл новый пользователь: экран профиля показывает разные подсказки. */
export type WelcomeSource = 'sign-up' | 'sign-in';

export const WELCOME_PARAM = 'welcome';

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
  const target = returnTo ?? `${paths.dashboard.profile}?${WELCOME_PARAM}=${source}`;
  window.location.assign(target);
}
