// ----------------------------------------------------------------------
// Синхронизация входа/выхода между вкладками (ревью 2026-10-09, FE-05).
// Куки httpOnly, поэтому без сообщения другая вкладка узнаёт о выходе только
// при следующем запросе к API и до тех пор показывает данные пользователя.

export type AuthChangeEvent = 'login' | 'logout';

const CHANNEL = 'showring-auth';

function openChannel(): BroadcastChannel | null {
  return typeof BroadcastChannel === 'undefined' ? null : new BroadcastChannel(CHANNEL);
}

/** Сообщить другим вкладкам, что пользователь вошёл или вышел. */
export function notifyAuthChanged(event: AuthChangeEvent): void {
  const channel = openChannel();
  if (!channel) return;
  channel.postMessage(event);
  channel.close();
}

/** Подписаться на вход/выход в других вкладках; возвращает отписку. */
export function onAuthChanged(listener: (event: AuthChangeEvent) => void): () => void {
  const channel = openChannel();
  if (!channel) return () => {};
  channel.onmessage = (message: MessageEvent<AuthChangeEvent>) => {
    if (message.data === 'login' || message.data === 'logout') listener(message.data);
  };
  return () => channel.close();
}
