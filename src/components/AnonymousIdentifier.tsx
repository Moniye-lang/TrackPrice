'use client';

import { useEffect } from 'react';

/**
 * AnonymousIdentifier
 * Generates and persists a unique ID for anonymous users using a 10-year cookie.
 * This ID is used to attribute actions (like price updates) to the same guest device.
 */
export default function AnonymousIdentifier() {
  useEffect(() => {
    // Check if anon_id already exists in cookies
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

    if (!getCookie('anon_id')) {
      const newId = `anon_${crypto.randomUUID()}`;
      setCookie('anon_id', newId, 3650); // ~10 years
      console.log('Generated new anonymous ID:', newId);
    }
  }, []);

  return null; // This component doesn't render anything
}
