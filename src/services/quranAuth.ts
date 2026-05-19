import * as SecureStore from 'expo-secure-store';
import Constants from 'expo-constants';

// ─── Environment toggle ───────────────────────────────────────────────────────
// Switch USE_PRODUCTION in app.config.js (not here); credentials come from .env
const extra = Constants.expoConfig?.extra ?? {};

const CLIENT_ID     = extra.quranClientId     as string;
const CLIENT_SECRET = extra.quranClientSecret as string;

const AUTH_BASE = extra.quranClientId === extra.quranProdClientId
  ? 'https://oauth2.quran.foundation'
  : 'https://prelive-oauth2.quran.foundation';

const API_BASE = extra.quranClientId === extra.quranProdClientId
  ? 'https://apis.quran.foundation/auth/v1'
  : 'https://apis-prelive.quran.foundation/auth/v1';

const REDIRECT_URI = 'qurancompanion://oauth/callback';

export const QF_CLIENT_ID = CLIENT_ID;
export const QF_REDIRECT_URI = REDIRECT_URI;

export const QF_DISCOVERY = {
  authorizationEndpoint: `${AUTH_BASE}/oauth2/auth`,
  tokenEndpoint: `${AUTH_BASE}/oauth2/token`,
  revocationEndpoint: `${AUTH_BASE}/oauth2/revoke`,
};

/** Exchange the OAuth2 authorization code for an access token. */
export async function exchangeCodeForToken(
  code: string,
  codeVerifier: string,
  redirectUri: string = REDIRECT_URI,
): Promise<string> {
  const body = new URLSearchParams({
    grant_type: 'authorization_code',
    code,
    code_verifier: codeVerifier,
    redirect_uri: redirectUri,
  });

  // Server requires client_secret_basic: credentials in Authorization header
  const credentials = btoa(`${CLIENT_ID}:${CLIENT_SECRET}`);

  const res = await fetch(`${AUTH_BASE}/oauth2/token`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
      'Authorization': `Basic ${credentials}`,
    },
    body: body.toString(),
  });

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`Token exchange failed: ${err}`);
  }

  const data = await res.json();
  if (data.refresh_token) {
    await SecureStore.setItemAsync('qf_refresh_token', data.refresh_token);
  }
  if (data.access_token) {
    await SecureStore.setItemAsync('qf_access_token', data.access_token);
  }
  return data.access_token as string;
}

/** Fetch the user's current Quran reading streak from Quran Foundation. */
export async function fetchQuranComStreakDays(accessToken: string): Promise<number | null> {
  const res = await fetch(
    `${API_BASE}/streaks/current-streak-days?type=QURAN`,
    {
      headers: {
        'x-auth-token': accessToken,
        'x-client-id': CLIENT_ID,
        Accept: 'application/json',
      },
    },
  );
  if (!res.ok) return null;
  const json = await res.json();
  return (json?.data?.days as number) ?? null;
}

// In-memory cache to avoid redundant SecureStore reads and duplicate API calls.
// Cleared on app restart, which is fine — streaks are tracked server-side.
let _cachedToken: string | null | undefined = undefined; // undefined = not yet loaded
let _lastSyncedDate = ''; // YYYY-MM-DD of last successful POST

/**
 * Push today's reading activity to Quran Foundation.
 * This is what increments the streak on Quran.com.
 * Deduped to one network call per calendar day — safe to call on every ayah.
 *
 * @param verseKey  e.g. "2:255"
 * @param seconds   active reading seconds to credit (default 30)
 */
export async function syncActivityDay(
  verseKey: string,
  seconds = 30,
): Promise<void> {
  // Load token once per app session; skip if already known null
  if (_cachedToken === undefined) {
    _cachedToken = await getSavedAccessToken();
  }
  const accessToken = _cachedToken;
  if (!accessToken) return; // not logged in, skip silently

  // Only POST once per calendar day — the API records a day, not individual ayahs
  const today = new Date().toISOString().slice(0, 10);
  if (_lastSyncedDate === today) return;

  // Format verse key "2:255" → range "2:255-2:255"
  const range = `${verseKey}-${verseKey}`;

  const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone;

  await fetch(`${API_BASE}/activity-days`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Accept: 'application/json',
      'x-auth-token': accessToken,
      'x-client-id': CLIENT_ID,
      'x-timezone': timezone,
    },
    body: JSON.stringify({
      type: 'QURAN',
      date: today,
      seconds,
      ranges: [range],
      mushafId: 4, // UthmaniHafs — matches app's Arabic text
    }),
  })
    .then((res) => { if (res.ok) _lastSyncedDate = today; })
    .catch(() => {}); // fire-and-forget, never block the user
}

/** Retrieve a previously saved access token from secure storage. */
export async function getSavedAccessToken(): Promise<string | null> {
  return SecureStore.getItemAsync('qf_access_token');
}

/** Remove saved tokens (sign out). */
export async function clearTokens(): Promise<void> {
  await SecureStore.deleteItemAsync('qf_access_token');
  await SecureStore.deleteItemAsync('qf_refresh_token');
}
