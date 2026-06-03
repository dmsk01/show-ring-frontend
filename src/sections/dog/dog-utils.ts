import type { DogSex } from 'src/types/dog';

import { CONFIG } from 'src/global-config';

// Dogs have no photos in the backend — use a deterministic placeholder cover by sex.
const DOG_PLACEHOLDERS: Record<DogSex, string> = {
  male: `${CONFIG.assetsDir}/assets/images/mock/cover/cover-12.webp`,
  female: `${CONFIG.assetsDir}/assets/images/mock/cover/cover-7.webp`,
};

export function dogPlaceholderImage(sex?: DogSex | null): string {
  if (sex && sex in DOG_PLACEHOLDERS) {
    return DOG_PLACEHOLDERS[sex];
  }
  return DOG_PLACEHOLDERS.male;
}
