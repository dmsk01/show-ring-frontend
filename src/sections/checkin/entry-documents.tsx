import type { IEntryCard } from 'src/types/checkin';

import Link from '@mui/material/Link';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';

import { fDate } from 'src/utils/format-time';

import { useTranslate } from 'src/locales';
import { dogDocumentUrl } from 'src/actions/checkin';

import { Label } from 'src/components/label';

import { rabiesBadge } from './checkin-utils';

// ----------------------------------------------------------------------

type Props = { card: IEntryCard };

/** Действующие документы собаки записи + бейджи прививки и проблем. */
export function EntryDocuments({ card }: Props) {
  const { t } = useTranslate('checkin');
  const rabies = rabiesBadge(card);
  const precheck = card.latest_checks.docs_precheck;

  return (
    <Stack spacing={1}>
      <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
        {precheck?.result === 'passed' && <Label color="success">{t('desk.prechecked')}</Label>}
        {precheck?.result === 'failed' && <Label color="error">{t('desk.precheckFailed')}</Label>}
        <Label color={rabies.color}>
          {rabies.color === 'success' && t('desk.rabies', { date: fDate(rabies.date) })}
          {rabies.color === 'error' && t('desk.rabiesExpired', { date: fDate(rabies.date) })}
          {rabies.color === 'default' && t('desk.rabiesUnknown')}
        </Label>
      </Stack>

      {precheck?.result === 'failed' && precheck.comment && (
        <Typography variant="caption" sx={{ color: 'error.main' }}>
          {precheck.comment}
        </Typography>
      )}

      {card.documents.length === 0 ? (
        <Typography variant="body2" sx={{ color: 'text.secondary' }}>
          {t('desk.noDocuments')}
        </Typography>
      ) : (
        <Stack direction="row" spacing={2} flexWrap="wrap" useFlexGap>
          {card.documents.map((doc) => (
            <Link
              key={doc.id}
              variant="body2"
              href={dogDocumentUrl(card.dog.id, doc.id)}
              target="_blank"
              rel="noopener"
            >
              {t(`kinds.${doc.kind}`)}
            </Link>
          ))}
        </Stack>
      )}

      {card.problems.map((p) => (
        <Typography key={p} variant="caption" sx={{ color: 'warning.main' }}>
          • {t(`problems.${p}`)}
        </Typography>
      ))}
    </Stack>
  );
}
