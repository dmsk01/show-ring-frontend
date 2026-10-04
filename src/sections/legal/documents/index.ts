import { consent } from './consent';
import { privacyPolicy } from './privacy-policy';
import { termsOfService } from './terms-of-service';
import { publicDataConsent } from './public-data-consent';

// ----------------------------------------------------------------------

export const LEGAL_DOCUMENTS = {
  privacy: privacyPolicy,
  terms: termsOfService,
  consent,
  publicConsent: publicDataConsent,
};

export type LegalDocumentKey = keyof typeof LEGAL_DOCUMENTS;
