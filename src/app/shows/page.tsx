import { CONFIG } from 'src/global-config';

import { ShowShowcaseView } from 'src/sections/show/view';

// ----------------------------------------------------------------------

export const metadata = { title: `Выставки - ${CONFIG.appName}` };

export default function Page() {
  return <ShowShowcaseView />;
}
