import { CONFIG } from 'src/global-config';

import { ShowRegisterView } from 'src/sections/show/view';

import { AuthGuard } from 'src/auth/guard';

// ----------------------------------------------------------------------

export const metadata = { title: `Запись на выставку - ${CONFIG.appName}` };

type Props = { params: Promise<{ id: string }> };

export default async function Page({ params }: Props) {
  const { id } = await params;

  return (
    <AuthGuard>
      <ShowRegisterView id={id} />
    </AuthGuard>
  );
}
