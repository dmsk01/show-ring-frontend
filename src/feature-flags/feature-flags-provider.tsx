'use client';

import type { FeatureFlag } from 'src/config/feature-flags';

import { useMemo } from 'react';

import { isFeatureEnabled } from 'src/utils/feature-flags';

import { useFeatureFlagsQuery } from 'src/actions/feature-flag';

import { FeatureFlagsContext } from './feature-flags-context';

// ----------------------------------------------------------------------

type Props = { children: React.ReactNode };

export function FeatureFlagsProvider({ children }: Props) {
  const { flags, isLoading, error } = useFeatureFlagsQuery();

  const value = useMemo(
    () => ({
      flags,
      loading: isLoading,
      isEnabled: (flag: FeatureFlag) =>
        isFeatureEnabled(flags, flag, { loading: isLoading, error }),
    }),
    [flags, isLoading, error]
  );

  return <FeatureFlagsContext.Provider value={value}>{children}</FeatureFlagsContext.Provider>;
}
