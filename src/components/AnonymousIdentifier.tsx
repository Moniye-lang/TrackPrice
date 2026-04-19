'use client';

import { useEffect } from 'react';

/**
 * AnonymousIdentifier
 * Generates and persists a unique ID for anonymous users using a 10-year cookie.
 * This ID is used to attribute actions (like price updates) to the same guest device.
 */
export default function AnonymousIdentifier() {
  useEffect(() => {
    const LIFESPAN_DAYS = 60;
    const STORAGE_KEY = 'tp_anon_id';

    const getCookie = (name: string) => {
      const value = `; ${document.cookie}`;
      const parts = value.split(`; ${name}=`);
      if (parts.length === 2) return parts.pop()?.split(';').shift();
      return null;
    };

    const setCookie = (name: string, value: string, days: number) => {
      const date = new Date();
      date.setTime(date.getTime() + (days * 24 * 60 * 60 * 1000));
      const expires = `; expires=${date.toUTCString()}`;
      document.cookie = `${name}=${value || ""}${expires}; path=/; SameSite=Lax`;
    };

    // 1. Try to get ID from cookie or localStorage
    let existingId = getCookie('anon_id');
    const localId = localStorage.getItem(STORAGE_KEY);

    // 2. Synthesize/Restore if missing in one but present in other
    if (!existingId && localId) {
        existingId = localId;
    } else if (existingId && !localId) {
        localStorage.setItem(STORAGE_KEY, existingId);
    }

    // 3. Generate new if absolutely missing
    if (!existingId) {
      existingId = `anon_${crypto.randomUUID()}`;
      localStorage.setItem(STORAGE_KEY, existingId);
      console.log('Generated new anonymous ID:', existingId);
    }

    // 4. Always refresh/set cookie to extend lifespan (rolling expiry)
    setCookie('anon_id', existingId, LIFESPAN_DAYS);
  }, []);

  return null;
}
