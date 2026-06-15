'use client';

import type { ReactNode } from 'react';
import type { FeatureFlag } from 'src/config/feature-flags';

import { useFeatureFlags } from 'src/feature-flags';

// ----------------------------------------------------------------------

export type FeatureProps = {
  flag: FeatureFlag;
  fallback?: ReactNode;
  children: ReactNode | ((ctx: { enabled: boolean }) => ReactNode);
};

export function Feature({ flag, fallback = null, children }: FeatureProps) {
  const { isEnabled } = useFeatureFlags();
  const enabled = isEnabled(flag);

  if (typeof children === 'function') return <>{children({ enabled })}</>;
  return <>{enabled ? children : fallback}</>;
}
