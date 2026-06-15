// ----------------------------------------------------------------------
// Pure resolution of a feature flag's effective state.
//
// Fail-closed: a flag that is still loading, whose fetch errored, that is
// absent from the snapshot, or that is explicitly `false` resolves to
// disabled. Only an explicit `true` enables the feature.
// ----------------------------------------------------------------------

type FlagState = { loading?: boolean; error?: unknown };

export function isFeatureEnabled(
  flags: Record<string, boolean> | undefined | null,
  flag: string,
  state?: FlagState
): boolean {
  if (state?.loading || state?.error) return false;
  return Boolean(flags?.[flag]);
}
