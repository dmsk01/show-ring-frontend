import type { IDogItem, IDogRelative } from 'src/types/dog';

import { useMemo, useState } from 'react';
import { useDebounce } from 'minimal-shared/hooks';

import Box from '@mui/material/Box';
import Link from '@mui/material/Link';
import Stack from '@mui/material/Stack';
import Avatar from '@mui/material/Avatar';
import Button from '@mui/material/Button';
import Dialog from '@mui/material/Dialog';
import Tooltip from '@mui/material/Tooltip';
import TextField from '@mui/material/TextField';
import IconButton from '@mui/material/IconButton';
import Typography from '@mui/material/Typography';
import DialogTitle from '@mui/material/DialogTitle';
import Autocomplete from '@mui/material/Autocomplete';
import DialogActions from '@mui/material/DialogActions';
import DialogContent from '@mui/material/DialogContent';

import { RouterLink } from 'src/routes/components';

import { usePermissions } from 'src/hooks/use-permissions';

import { fDate } from 'src/utils/format-time';

import { useTranslate } from 'src/locales';
import { fileUrl } from 'src/actions/file';
import {
  useGetDogs,
  addDogDescendant,
  useGetDogSiblings,
  removeDogDescendant,
  useGetDogDescendants,
} from 'src/actions/dog';

import { Label } from 'src/components/label';
import { toast } from 'src/components/snackbar';
import { Iconify } from 'src/components/iconify';
import { ConfirmDialog } from 'src/components/custom-dialog';

import { useAuthContext } from 'src/auth/hooks';

import { canManageDog, dogPlaceholderImage } from './dog-utils';

// ----------------------------------------------------------------------
// Потомки и сибсы. Родство выводится бэкендом из father_id/mother_id,
// поэтому «добавить потомка» = проставить эту собаку родителем выбранной,
// «убрать» = очистить эту связь. Сибсы только читаются — они меняются
// через родителей (форма собаки или «Добавить потомка» у родителя).
// ----------------------------------------------------------------------

type HrefFor = (dogId: string) => string;

/** Коды ошибок бэкенда для потомков → ключи dog:relatives.errors.* */
const RELATIVE_ERRORS = [
  'parent_already_set',
  'pedigree_cycle',
  'self_parent_forbidden',
  'forbidden',
] as const;

function useRelativeErrorMessage() {
  const { t } = useTranslate(['dog', 'common']);
  return (error: unknown) => {
    const code = error instanceof Error ? error.message : '';
    return (RELATIVE_ERRORS as readonly string[]).includes(code)
      ? t(`relatives.errors.${code}`)
      : code || t('common:state.error');
  };
}

// ----------------------------------------------------------------------

type RowProps = {
  dog: IDogRelative;
  hrefFor: HrefFor;
  caption?: React.ReactNode;
  action?: React.ReactNode;
};

function RelativeRow({ dog, hrefFor, caption, action }: RowProps) {
  const { t } = useTranslate('dog');

  return (
    <Stack direction="row" alignItems="center" spacing={2}>
      <Avatar
        alt={dog.name}
        src={dog.avatar_file_id ? fileUrl(dog.avatar_file_id) : dogPlaceholderImage(dog.sex)}
        sx={{ width: 48, height: 48 }}
      />

      <Box sx={{ minWidth: 0, flexGrow: 1 }}>
        <Link component={RouterLink} href={hrefFor(dog.id)} variant="subtitle2" noWrap>
          {dog.name}
        </Link>
        <Typography variant="body2" sx={{ color: 'text.secondary' }} noWrap>
          {[
            t(`enums.sex.${dog.sex}`),
            dog.date_of_birth ? fDate(dog.date_of_birth) : null,
            dog.rkf_number ? `${t('detail.rkfNumber')} ${dog.rkf_number}` : null,
          ]
            .filter(Boolean)
            .join(' · ')}
        </Typography>
        {caption}
      </Box>

      {action}
    </Stack>
  );
}

// ----------------------------------------------------------------------

type DescendantsProps = {
  dog: IDogItem;
  hrefFor: HrefFor;
  /** Показывать кнопки «Добавить»/«Убрать» (дашборд). В публичной витрине — false. */
  editable?: boolean;
};

export function DogDescendants({ dog, hrefFor, editable = false }: DescendantsProps) {
  const { t } = useTranslate('dog');
  const { user } = useAuthContext();
  const { can } = usePermissions();
  const errorMessage = useRelativeErrorMessage();

  const { descendants, descendantsLoading } = useGetDogDescendants(dog.id);

  const [addOpen, setAddOpen] = useState(false);
  const [removeId, setRemoveId] = useState<string | null>(null);
  const [removing, setRemoving] = useState(false);

  const removeTarget = descendants.find((d) => d.id === removeId);
  const canEdit = editable && !!user;

  const handleRemove = async () => {
    if (!removeId) return;
    setRemoving(true);
    try {
      await removeDogDescendant(dog.id, removeId);
      toast.success(t('relatives.toast.removed'));
      setRemoveId(null);
    } catch (error) {
      toast.error(errorMessage(error));
    } finally {
      setRemoving(false);
    }
  };

  return (
    <Stack spacing={2}>
      <Stack direction="row" alignItems="center" justifyContent="space-between">
        <Typography variant="h6">
          {t('relatives.descendants')} ({descendants.length})
        </Typography>
        {canEdit && (
          <Button
            size="small"
            variant="outlined"
            startIcon={<Iconify icon="mingcute:add-line" />}
            onClick={() => setAddOpen(true)}
          >
            {t('relatives.addDescendant')}
          </Button>
        )}
      </Stack>

      {!descendantsLoading && descendants.length === 0 ? (
        <Typography variant="body2" sx={{ color: 'text.secondary' }}>
          {t('relatives.noDescendants')}
        </Typography>
      ) : (
        <Stack spacing={2}>
          {descendants.map((child) => (
            <RelativeRow
              key={child.id}
              dog={child}
              hrefFor={hrefFor}
              caption={
                child.other_parent && (
                  <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                    {dog.sex === 'male' ? t('relatives.withMother') : t('relatives.withFather')}{' '}
                    <Link component={RouterLink} href={hrefFor(child.other_parent.id)}>
                      {child.other_parent.name}
                    </Link>
                  </Typography>
                )
              }
              action={
                canEdit &&
                canManageDog(child, user?.id, can) && (
                  <Tooltip title={t('relatives.removeDescendant')}>
                    <IconButton color="error" onClick={() => setRemoveId(child.id)}>
                      <Iconify icon="solar:trash-bin-trash-bold" />
                    </IconButton>
                  </Tooltip>
                )
              }
            />
          ))}
        </Stack>
      )}

      {canEdit && (
        <AddDescendantDialog
          open={addOpen}
          onClose={() => setAddOpen(false)}
          parent={dog}
          existingIds={descendants.map((d) => d.id)}
        />
      )}

      <ConfirmDialog
        open={!!removeId}
        onClose={() => setRemoveId(null)}
        title={t('relatives.removeTitle')}
        content={t('relatives.removeContent', {
          child: removeTarget?.name ?? '',
          parent: dog.name,
        })}
        action={
          <Button variant="contained" color="error" loading={removing} onClick={handleRemove}>
            {t('relatives.removeConfirm')}
          </Button>
        }
      />
    </Stack>
  );
}

// ----------------------------------------------------------------------

type AddDialogProps = {
  open: boolean;
  onClose: () => void;
  parent: IDogItem;
  existingIds: string[];
};

function AddDescendantDialog({ open, onClose, parent, existingIds }: AddDialogProps) {
  const { t } = useTranslate('dog');
  const { user } = useAuthContext();
  const { can } = usePermissions();
  const errorMessage = useRelativeErrorMessage();

  const [search, setSearch] = useState('');
  const [selected, setSelected] = useState<IDogItem | null>(null);
  const [saving, setSaving] = useState(false);

  // Серверный поиск по кличке: каталог может быть большим.
  const debouncedSearch = useDebounce(search, 300);
  const { dogs, dogsLoading } = useGetDogs({ search: debouncedSearch, per_page: 50 });

  const slot = parent.sex === 'male' ? 'father_id' : 'mother_id';

  const options = useMemo(
    () => dogs.filter((d) => d.id !== parent.id && !existingIds.includes(d.id)),
    [dogs, parent.id, existingIds]
  );

  // Бэкенд не перезаписывает чужого родителя (409) — предупреждаем заранее.
  const disabledReason = (option: IDogItem): string | null => {
    if (!canManageDog(option, user?.id, can)) return t('relatives.optionNoAccess');
    if (option[slot]) {
      return parent.sex === 'male'
        ? t('relatives.optionHasFather')
        : t('relatives.optionHasMother');
    }
    return null;
  };

  const handleClose = () => {
    setSelected(null);
    setSearch('');
    onClose();
  };

  const handleSubmit = async () => {
    if (!selected) return;
    setSaving(true);
    try {
      await addDogDescendant(parent.id, selected.id);
      toast.success(t('relatives.toast.added'));
      handleClose();
    } catch (error) {
      toast.error(errorMessage(error));
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog fullWidth maxWidth="sm" open={open} onClose={handleClose}>
      <DialogTitle>{t('relatives.addDescendant')}</DialogTitle>

      <DialogContent sx={{ pt: 1 }}>
        <Typography variant="body2" sx={{ color: 'text.secondary', mb: 3 }}>
          {parent.sex === 'male'
            ? t('relatives.addHintFather', { name: parent.name })
            : t('relatives.addHintMother', { name: parent.name })}
        </Typography>

        <Autocomplete
          value={selected}
          options={options}
          loading={dogsLoading}
          // Фильтрация на сервере — клиентская бы прятала найденное бэкендом.
          filterOptions={(x) => x}
          onChange={(_e, value) => setSelected(value)}
          onInputChange={(_e, value, reason) => {
            if (reason === 'input') setSearch(value);
          }}
          getOptionLabel={(option) => option.name}
          getOptionDisabled={(option) => !!disabledReason(option)}
          isOptionEqualToValue={(option, value) => option.id === value.id}
          noOptionsText={t('relatives.noOptions')}
          renderOption={(props, option) => {
            const { key, ...optionProps } = props;
            const reason = disabledReason(option);
            return (
              <li key={key} {...optionProps}>
                <Box sx={{ minWidth: 0 }}>
                  <Typography variant="body2">{option.name}</Typography>
                  <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                    {[
                      t(`enums.sex.${option.sex}`),
                      option.date_of_birth ? fDate(option.date_of_birth) : null,
                      reason,
                    ]
                      .filter(Boolean)
                      .join(' · ')}
                  </Typography>
                </Box>
              </li>
            );
          }}
          renderInput={(params) => (
            <TextField {...params} autoFocus label={t('relatives.pickDog')} />
          )}
        />
      </DialogContent>

      <DialogActions>
        <Button variant="outlined" color="inherit" onClick={handleClose}>
          {t('relatives.cancel')}
        </Button>
        <Button variant="contained" disabled={!selected} loading={saving} onClick={handleSubmit}>
          {t('relatives.add')}
        </Button>
      </DialogActions>
    </Dialog>
  );
}

// ----------------------------------------------------------------------

type SiblingsProps = {
  dog: IDogItem;
  hrefFor: HrefFor;
};

export function DogSiblings({ dog, hrefFor }: SiblingsProps) {
  const { t } = useTranslate('dog');
  const { siblings, siblingsLoading } = useGetDogSiblings(dog.id);

  return (
    <Stack spacing={2}>
      <Typography variant="h6">
        {t('relatives.siblings')} ({siblings.length})
      </Typography>

      {!siblingsLoading && siblings.length === 0 ? (
        <Typography variant="body2" sx={{ color: 'text.secondary' }}>
          {dog.father_id || dog.mother_id
            ? t('relatives.noSiblings')
            : t('relatives.noSiblingsNoParents')}
        </Typography>
      ) : (
        <Stack spacing={2}>
          {siblings.map((sibling) => (
            <RelativeRow
              key={sibling.id}
              dog={sibling}
              hrefFor={hrefFor}
              action={
                <Label variant="soft" color={sibling.kind === 'full' ? 'success' : 'default'}>
                  {sibling.kind === 'full'
                    ? t('relatives.full')
                    : t(`relatives.half.${sibling.shared_parent}`)}
                </Label>
              }
            />
          ))}
        </Stack>
      )}
    </Stack>
  );
}
