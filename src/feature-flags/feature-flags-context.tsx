'use client';

import type { FeatureFlag } from 'src/config/feature-flags';

import { createContext } from 'react';

// ----------------------------------------------------------------------

export type FeatureFlagsContextValue = {
  flags: Record<string, boolean>;
  loading: boolean;
  isEnabled: (flag: FeatureFlag) => boolean;
};

export const FeatureFlagsContext = createContext<FeatureFlagsContextValue | undefined>(undefined);
