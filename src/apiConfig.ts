import Constants from 'expo-constants';

const BACKEND_PORT = 3001;
const ENV_API_URL = process.env.EXPO_PUBLIC_API_URL || `http://localhost:${BACKEND_PORT}`;

/** Dev server host (e.g. 192.168.1.34:8081) — same LAN IP the phone uses for Metro. */
function devServerHost(): string | null {
  const hostUri = Constants.expoConfig?.hostUri;
  if (!hostUri) return null;
  const host = hostUri.split(':')[0]?.trim();
  if (!host || host === 'localhost' || host === '127.0.0.1') return null;
  return host;
}

/** API base URL. In dev, follow Metro's LAN IP so Wi‑Fi changes don't break login. */
export function getApiUrl(): string {
  if (__DEV__) {
    const host = devServerHost();
    if (host) return `http://${host}:${BACKEND_PORT}`;
  }
  return ENV_API_URL;
}

export function connectionErrorMessage(): string {
  const url = getApiUrl();
  return `Could not reach the server at ${url}. Make sure the backend is running (npm run dev in backend/) and your phone is on the same Wi‑Fi. On Windows, allow Node.js through the firewall for port ${BACKEND_PORT}.`;
}
