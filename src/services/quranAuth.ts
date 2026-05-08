import * as SecureStore from 'expo-secure-store';

const CLIENT_ID = 'e7bf6ca0-8080-4238-a426-ba4472b5806d';
// NOTE: For a production app the client secret must live on a backend server.
// This is a hackathon demo with no backend, so we include it here temporarily.
const CLIENT_SECRET = 'XltKYlz0_FCIK5VuKO2Ot3FkZG';
const REDIRECT_URI = 'qurancompanion://oauth/callback';
const AUTH_BASE = 'https://oauth2.quran.foundation';
const API_BASE = 'https://apis.quran.foundation/auth/v1';

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
): Promise<string> {
  const body = new URLSearchParams({
    grant_type: 'authorization_code',
    code,
    code_verifier: codeVerifier,
    redirect_uri: REDIRECT_URI,
    client_id: CLIENT_ID,
    client_secret: CLIENT_SECRET,
  });

  const res = await fetch(`${AUTH_BASE}/oauth2/token`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
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

/** Retrieve a previously saved access token from secure storage. */
export async function getSavedAccessToken(): Promise<string | null> {
  return SecureStore.getItemAsync('qf_access_token');
}

/** Remove saved tokens (sign out). */
export async function clearTokens(): Promise<void> {
  await SecureStore.deleteItemAsync('qf_access_token');
  await SecureStore.deleteItemAsync('qf_refresh_token');
}
