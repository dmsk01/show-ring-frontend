'use client';

import { useContext } from 'react';

import { FeatureFlagsContext } from './feature-flags-context';

// ----------------------------------------------------------------------

export function useFeatureFlags() {
  const ctx = useContext(FeatureFlagsContext);

  if (!ctx) {
    throw new Error('useFeatureFlags must be used within a FeatureFlagsProvider');
  }

  return ctx;
}
