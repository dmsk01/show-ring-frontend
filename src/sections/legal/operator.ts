// ----------------------------------------------------------------------

/**
 * Единый источник реквизитов для всех правовых документов.
 *
 * `null` = значение ещё не заполнено: на странице оно выводится жёлтой
 * плашкой «[заполнить: …]», чтобы незаполненный документ нельзя было
 * перепутать с готовым. Перед публикацией в прод все `null` должны
 * быть заменены реальными данными — ничего не выдумывать.
 */
export type LegalOperator = {
  /** «ИП Иванов Иван Иванович» / «ООО «Шоу Ринг»». */
  name: string | null;
  /** ОГРН (юрлицо) или ОГРНИП (ИП). */
  ogrn: string | null;
  inn: string | null;
  /** Адрес места нахождения (юрлицо) / регистрации (ИП) — для претензий. */
  address: string | null;
  /** Адрес для обращений субъектов ПДн (ст. 14, 20, 21 152-ФЗ). */
  privacyEmail: string | null;
  /** Общая поддержка и претензии. */
  supportEmail: string | null;
  /** Адрес для заявлений правообладателей (ст. 1253.1 ГК РФ). */
  abuseEmail: string | null;
  /** Регистрационный номер в реестре операторов ПДн Роскомнадзора (ст. 22 152-ФЗ). */
  rknRegistryNumber: string | null;
  /** Хостинг-провайдер: наименование, ИНН, адрес; ЦОД в РФ (ч. 5 ст. 18 152-ФЗ). */
  hosting: string | null;
  /** SMTP-провайдер для писем (если не собственный почтовый сервер). */
  emailProvider: string | null;
  /** SMS-шлюз для кодов входа (в коде предусмотрен sms.ru: SMS_PROVIDER). */
  smsProvider: string | null;
};

export const LEGAL_OPERATOR: LegalOperator = {
  name: null,
  ogrn: null,
  inn: null,
  address: null,
  privacyEmail: null,
  supportEmail: 'support@showring.app',
  abuseEmail: null,
  rknRegistryNumber: null,
  hosting: null,
  emailProvider: null,
  smsProvider: null,
};

export const LEGAL_SITE = {
  name: 'Show Ring',
  url: 'https://showring.app',
};

/**
 * Даты редакций. Меняются только вместе с текстом документа:
 * старая редакция должна оставаться доступной (архив), см. раздел
 * «Изменение документа» в каждом из них.
 */
export const LEGAL_REVISIONS = {
  privacy: '04.10.2026',
  terms: '04.10.2026',
  consent: '04.10.2026',
  publicConsent: '04.10.2026',
} as const;

/** Минимальный возраст самостоятельной регистрации (ст. 21, 26 ГК РФ). */
export const LEGAL_MIN_AGE = 18;
