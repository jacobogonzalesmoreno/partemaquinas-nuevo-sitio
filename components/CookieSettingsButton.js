'use client';

export default function CookieSettingsButton() {
  return <button type="button" onClick={() => window.dispatchEvent(new Event('open-cookie-settings'))}>Preferencias de cookies</button>;
}
