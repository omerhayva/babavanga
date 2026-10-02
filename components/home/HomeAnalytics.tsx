'use client';

import { useEffect } from 'react';

/** Anonim analytics: sadece sayfa görüntüleme olayı, kişisel veri yok. */
export default function HomeAnalytics() {
  useEffect(() => {
    fetch('/api/analytics', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ type: 'homepage_view' }),
    }).catch(() => undefined);
  }, []);
  return null;
}
