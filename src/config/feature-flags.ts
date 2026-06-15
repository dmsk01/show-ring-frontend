// ----------------------------------------------------------------------
// Feature flags the frontend references. The backend (`GET /feature-flags`)
// owns a closed enum and returns a snapshot of booleans; the keys here are the
// subset the UI gates on.
//
// `support` is intentionally listed even though it is NOT in the backend enum
// yet: under fail-closed semantics an absent flag reads as disabled, so tagging
// the Support feature with it keeps the whole section hidden until the backend
// adds the flag and the feature is ready.
// ----------------------------------------------------------------------

export const FEATURE_FLAGS = ['official_documents', 'phone_otp_auth', 'support'] as const;

export type FeatureFlag = (typeof FEATURE_FLAGS)[number];
