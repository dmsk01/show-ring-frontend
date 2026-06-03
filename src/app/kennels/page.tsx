import { CONFIG } from 'src/global-config';

import { KennelShowcaseView } from 'src/sections/kennel/view';

// ----------------------------------------------------------------------

export const metadata = { title: `Питомники - ${CONFIG.appName}` };

export default function Page() {
  return <KennelShowcaseView />;
}
