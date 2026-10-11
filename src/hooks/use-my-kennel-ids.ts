import { useMemo } from 'react';

import { myKennelIds } from 'src/utils/ownership';

import { useGetKennels } from 'src/actions/reference';

import { useAuthContext } from 'src/auth/hooks';

// ----------------------------------------------------------------------

/** id питомников текущего пользователя — для прав на собак и помёты (FE-33). */
export function useMyKennelIds(): Set<string> {
  const { user } = useAuthContext();
  const { kennels } = useGetKennels();
  const userId = user?.id as string | undefined;

  return useMemo(() => myKennelIds(kennels, userId), [kennels, userId]);
}
