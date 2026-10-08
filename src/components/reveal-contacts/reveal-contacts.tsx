'use client';

import { useState } from 'react';

import Link from '@mui/material/Link';
import Stack from '@mui/material/Stack';
import Button from '@mui/material/Button';
import Typography from '@mui/material/Typography';

import axios from 'src/lib/axios';
import { useTranslate } from 'src/locales';

import { Iconify } from '../iconify';

// ----------------------------------------------------------------------
// «Показать контакты» (план защиты 2026-10-05, этап 4). Открытые контакты
// не лежат в HTML карточки — их собирали бы боты-сборщики. Посетитель жмёт
// кнопку, и только тогда контакты запрашиваются отдельным запросом
// (бэкенд: GET /…/{id}/contacts, лимит 30 в час с IP).

type Contacts = {
  contact_phone?: string | null;
  contact_email?: string | null;
  website?: string | null;
};

type Props = {
  /** URL эндпоинта контактов, например endpoints.kennel.contacts(id). */
  url: string;
};

export function RevealContacts({ url }: Props) {
  const { t } = useTranslate('common');
  const [contacts, setContacts] = useState<Contacts | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(false);

  const handleReveal = async () => {
    setLoading(true);
    setError(false);
    try {
      const res = await axios.get<Contacts>(url);
      setContacts(res.data);
    } catch {
      setError(true);
    } finally {
      setLoading(false);
    }
  };

  if (!contacts) {
    return (
      <Stack spacing={1} sx={{ alignItems: 'flex-start' }}>
        <Button
          variant="outlined"
          color="inherit"
          loading={loading}
          startIcon={<Iconify icon="solar:phone-bold" />}
          onClick={handleReveal}
        >
          {t('contacts.reveal')}
        </Button>
        {error && (
          <Typography variant="caption" sx={{ color: 'error.main' }}>
            {t('contacts.revealFailed')}
          </Typography>
        )}
      </Stack>
    );
  }

  return (
    <Stack spacing={1}>
      {contacts.contact_phone && (
        <Link href={`tel:${contacts.contact_phone}`}>{contacts.contact_phone}</Link>
      )}
      {contacts.contact_email && (
        <Link href={`mailto:${contacts.contact_email}`}>{contacts.contact_email}</Link>
      )}
      {contacts.website && (
        <Link href={contacts.website} target="_blank" rel="noopener nofollow">
          {contacts.website}
        </Link>
      )}
    </Stack>
  );
}
