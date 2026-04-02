'use client';

import { useEffect } from 'react';
import { useStore } from '@/store/useStore';

export default function StoreHydrator() {
  useEffect(() => {
    // Hydrate settings from localStorage after client mount
    try {
      const saved = localStorage.getItem('admin_settings');
      if (saved) {
        const parsed = JSON.parse(saved);
        useStore.getState().updateSettings(parsed);
      }
    } catch { /* empty */ }
  }, []);

  return null;
}
