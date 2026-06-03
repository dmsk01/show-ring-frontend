import { CONFIG } from 'src/global-config';

import { ClassifiedShowcaseView } from 'src/sections/classified/view';

// ----------------------------------------------------------------------

export const metadata = { title: `Животные - ${CONFIG.appName}` };

export default function Page() {
  return <ClassifiedShowcaseView />;
}
