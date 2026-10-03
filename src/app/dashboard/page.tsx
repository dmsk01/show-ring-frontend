import { redirect } from 'next/navigation';

import { paths } from 'src/routes/paths';

// ----------------------------------------------------------------------

// Своей главной у кабинета пока нет: шаблонный обзор Minimal (виджеты на
// моках) удалён. Вход ведёт сюда (CONFIG.auth.redirectPath) — отправляем
// в профиль, как и только что зарегистрированных пользователей.
export default function Page() {
  redirect(paths.dashboard.profile);
}
