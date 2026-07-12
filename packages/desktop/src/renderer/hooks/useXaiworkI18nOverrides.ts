// FORK-CUSTOM: apply XAIWork-only translation overrides at the fork router boundary.

import { useEffect, useState } from 'react';
import i18n from '@renderer/services/i18n';

const CRON_DESCRIPTION_KEY = 'xaiwork.cron.description';

const applyXaiworkI18nOverrides = (): boolean => {
  const description = i18n.t(CRON_DESCRIPTION_KEY);
  if (!description || description === CRON_DESCRIPTION_KEY) return false;

  i18n.addResource(i18n.language, 'translation', 'cron.page.description', description);
  return true;
};

export const useXaiworkI18nOverrides = (): boolean => {
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const syncOverrides = () => setReady(applyXaiworkI18nOverrides());

    syncOverrides();
    i18n.on('languageChanged', syncOverrides);
    return () => i18n.off('languageChanged', syncOverrides);
  }, []);

  return ready;
};
