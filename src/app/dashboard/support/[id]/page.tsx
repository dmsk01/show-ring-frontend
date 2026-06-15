import { CONFIG } from 'src/global-config';
import { FeatureGuard } from 'src/feature-flags';

import { TicketDetailView } from 'src/sections/support/view';

import { PermissionGuard } from 'src/auth/guard';

// ----------------------------------------------------------------------

export const metadata = { title: `Ticket | Dashboard - ${CONFIG.appName}` };

type Props = { params: Promise<{ id: string }> };

export default async function Page({ params }: Props) {
  const { id } = await params;
  return (
    <FeatureGuard flag="support">
      <PermissionGuard permission="support:view">
        <TicketDetailView id={id} />
      </PermissionGuard>
    </FeatureGuard>
  );
}
