'use client';

import { SegmentErrorView } from 'src/sections/error';

// ----------------------------------------------------------------------

export default function Error({
  error,
  retry,
}: {
  error: Error & { digest?: string };
  retry: () => void;
}) {
  return <SegmentErrorView error={error} retry={retry} />;
}
