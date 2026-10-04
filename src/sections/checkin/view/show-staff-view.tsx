'use client';

import { useState } from 'react';

import Card from '@mui/material/Card';
import Stack from '@mui/material/Stack';
import Button from '@mui/material/Button';
import Divider from '@mui/material/Divider';
import TextField from '@mui/material/TextField';
import IconButton from '@mui/material/IconButton';
import Typography from '@mui/material/Typography';

import { paths } from 'src/routes/paths';

import { useTranslate } from 'src/locales';
import { useGetShow } from 'src/actions/show';
import { DashboardContent } from 'src/layouts/dashboard';
import { addShowStaff, useShowStaff, removeShowStaff } from 'src/actions/checkin';

import { toast } from 'src/components/snackbar';
import { Iconify } from 'src/components/iconify';
import { EmptyContent } from 'src/components/empty-content';
import { CustomBreadcrumbs } from 'src/components/custom-breadcrumbs';

// ----------------------------------------------------------------------

type Props = { id: string };

function staffErrorKey(error: unknown): string {
  const status = (error as { status?: number })?.status;
  if (status === 404) return 'staff.notFound';
  if (status === 409) return 'staff.already';
  return 'staff.failed';
}

export function ShowStaffView({ id }: Props) {
  const { t } = useTranslate(['checkin', 'show', 'common']);
  const { show } = useGetShow(id);
  const { staff, staffLoading } = useShowStaff(id);
  const [contact, setContact] = useState('');
  const [saving, setSaving] = useState(false);

  const onAdd = async () => {
    if (!contact.trim()) return;
    setSaving(true);
    try {
      await addShowStaff(id, contact);
      toast.success(t('staff.added'));
      setContact('');
    } catch (error) {
      toast.error(t(staffErrorKey(error)));
    } finally {
      setSaving(false);
    }
  };

  const onRemove = async (userId: string) => {
    try {
      await removeShowStaff(id, userId);
      toast.success(t('staff.removed'));
    } catch (error) {
      toast.error(t(staffErrorKey(error)));
    }
  };

  return (
    <DashboardContent>
      <CustomBreadcrumbs
        heading={show ? t('staff.heading', { name: show.name }) : t('staff.headingFallback')}
        links={[
          { name: t('common:dashboard'), href: paths.dashboard.root },
          { name: show?.name ?? '', href: paths.dashboard.shows.edit(id) },
          { name: t('staff.headingFallback') },
        ]}
        sx={{ mb: { xs: 3, md: 5 } }}
      />

      <Card sx={{ p: 3, mb: 3 }}>
        <Typography variant="body2" sx={{ color: 'text.secondary', mb: 2 }}>
          {t('staff.hint')}
        </Typography>
        <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
          <TextField
            fullWidth
            size="small"
            label={t('staff.contact')}
            value={contact}
            onChange={(e) => setContact(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && onAdd()}
          />
          <Button
            variant="contained"
            loading={saving}
            startIcon={<Iconify icon="solar:user-plus-bold" />}
            onClick={onAdd}
          >
            {t('staff.add')}
          </Button>
        </Stack>
      </Card>

      {!staffLoading && staff.length === 0 ? (
        <EmptyContent filled title={t('staff.empty')} sx={{ py: 6 }} />
      ) : (
        <Card>
          <Stack divider={<Divider sx={{ borderStyle: 'dashed' }} />}>
            {staff.map((member) => (
              <Stack
                key={member.user_id}
                direction="row"
                alignItems="center"
                justifyContent="space-between"
                sx={{ p: 2.5 }}
              >
                <Stack spacing={0.5}>
                  <Typography variant="subtitle2">{member.display_name}</Typography>
                  <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                    {[member.email, member.phone].filter(Boolean).join(' · ')}
                  </Typography>
                </Stack>
                <IconButton
                  color="error"
                  aria-label={t('staff.remove')}
                  onClick={() => onRemove(member.user_id)}
                >
                  <Iconify icon="solar:trash-bin-trash-bold" />
                </IconButton>
              </Stack>
            ))}
          </Stack>
        </Card>
      )}
    </DashboardContent>
  );
}
