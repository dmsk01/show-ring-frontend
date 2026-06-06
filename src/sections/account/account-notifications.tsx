'use client';

import type { CardProps } from '@mui/material/Card';

import { useForm, Controller } from 'react-hook-form';

import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import Grid from '@mui/material/Grid';
import Switch from '@mui/material/Switch';
import Button from '@mui/material/Button';
import ListItemText from '@mui/material/ListItemText';
import FormControlLabel from '@mui/material/FormControlLabel';

import { useTranslate } from 'src/locales';

import { toast } from 'src/components/snackbar';
import { Form } from 'src/components/hook-form';

// ----------------------------------------------------------------------

const NOTIFICATION_GROUP_KEYS = ['activity', 'application'] as const;

const NOTIFICATION_ITEM_KEYS: Record<string, string[]> = {
  activity: ['activity_comments', 'activity_answers', 'activityFollows'],
  application: ['application_news', 'application_product', 'application_blog'],
};

// ----------------------------------------------------------------------

export function AccountNotifications({ sx, ...other }: CardProps) {
  const { t } = useTranslate('account');

  const methods = useForm({
    defaultValues: { selected: ['activity_comments', 'application_product'] },
  });

  const {
    watch,
    control,
    handleSubmit,
    formState: { isSubmitting },
  } = methods;

  const values = watch();

  const onSubmit = handleSubmit(async (data) => {
    try {
      await new Promise((resolve) => setTimeout(resolve, 500));
      toast.success(t('toast.updated'));
      console.info('DATA', data);
    } catch (error) {
      console.error(error);
    }
  });

  const getSelected = (selectedItems: string[], item: string) =>
    selectedItems.includes(item)
      ? selectedItems.filter((value) => value !== item)
      : [...selectedItems, item];

  return (
    <Form methods={methods} onSubmit={onSubmit}>
      <Card
        sx={[
          {
            p: 3,
            gap: 3,
            display: 'flex',
            flexDirection: 'column',
          },
          ...(Array.isArray(sx) ? sx : [sx]),
        ]}
        {...other}
      >
        {NOTIFICATION_GROUP_KEYS.map((groupKey) => (
          <Grid key={groupKey} container spacing={3}>
            <Grid size={{ xs: 12, md: 4 }}>
              <ListItemText
                primary={t(`notifications.groups.${groupKey}.subheader`)}
                secondary={t(`notifications.groups.${groupKey}.caption`)}
                slotProps={{
                  primary: { sx: { typography: 'h6' } },
                  secondary: { sx: { mt: 0.5 } },
                }}
              />
            </Grid>

            <Grid size={{ xs: 12, md: 8 }}>
              <Box
                sx={{
                  p: 3,
                  gap: 1,
                  borderRadius: 2,
                  display: 'flex',
                  flexDirection: 'column',
                  bgcolor: 'background.neutral',
                }}
              >
                <Controller
                  name="selected"
                  control={control}
                  render={({ field }) => (
                    <>
                      {NOTIFICATION_ITEM_KEYS[groupKey].map((itemKey) => (
                        <FormControlLabel
                          key={itemKey}
                          label={t(`notifications.groups.${groupKey}.items.${itemKey}`)}
                          labelPlacement="start"
                          control={
                            <Switch
                              checked={field.value.includes(itemKey)}
                              onChange={() =>
                                field.onChange(getSelected(values.selected, itemKey))
                              }
                              slotProps={{
                                input: {
                                  id: `${itemKey}-switch`,
                                  'aria-label': `${t(`notifications.groups.${groupKey}.items.${itemKey}`)} switch`,
                                },
                              }}
                            />
                          }
                          sx={{ m: 0, width: 1, justifyContent: 'space-between' }}
                        />
                      ))}
                    </>
                  )}
                />
              </Box>
            </Grid>
          </Grid>
        ))}

        <Button type="submit" variant="contained" loading={isSubmitting} sx={{ ml: 'auto' }}>
          {t('common:actions.save')}
        </Button>
      </Card>
    </Form>
  );
}
