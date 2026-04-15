/**
 * URL-uri API în build-time (VITE_*) vs runtime.
 * În development, aliniem host-ul la fereastra curentă (ex. acces de pe telefon la IP:8080)
 * ca cookie-urile SameSite să coincidă cu backend-ul din rețea.
 * În producție păstrăm strict valorile din env (subdomeniu API separat pe cPanel).
 */

function trimTrailingSlash(url: string): string {
  return url.replace(/\/$/, '');
}

/**
 * LiteSpeed/Apache fac adesea 301 de la `/graphql` → `/graphql/`; preflight OPTIONS nu urmează redirect.
 * Forțăm slash final pe path-ul GraphQL.
 */
function ensureGraphqlTrailingSlash(url: string): string {
  try {
    if (!url.startsWith('http://') && !url.startsWith('https://')) {
      return url === '/graphql' ? '/graphql/' : url;
    }
    const u = new URL(url);
    if (u.pathname === '/graphql') {
      u.pathname = '/graphql/';
      return u.toString();
    }
  } catch {
    /* ignore */
  }
  return url;
}

/**
 * Baza API pentru fetch REST (refresh session, track, admin dacă folosește același base).
 */
export function resolveViteApiBaseUrl(): string {
  const configured = import.meta.env.VITE_API_BASE_URL || 'http://localhost:4000';
  if (typeof window === 'undefined') {
    return trimTrailingSlash(configured);
  }
  if (!import.meta.env.DEV) {
    return trimTrailingSlash(configured);
  }
  try {
    const apiUrl = new URL(configured);
    const currentHost = window.location.hostname;
    if (currentHost && apiUrl.hostname !== currentHost) {
      apiUrl.hostname = currentHost;
    }
    return trimTrailingSlash(apiUrl.toString());
  } catch {
    return trimTrailingSlash(configured);
  }
}

/**
 * Endpoint GraphQL pentru Apollo (absolute sau relativ la origin).
 */
export function resolveGraphqlEndpoint(): string {
  const configured = import.meta.env.VITE_GRAPHQL_ENDPOINT || '/graphql';
  let resolved: string;
  if (typeof window === 'undefined') {
    resolved = configured;
    return ensureGraphqlTrailingSlash(resolved);
  }
  if (!import.meta.env.DEV) {
    if (configured.startsWith('http://') || configured.startsWith('https://')) {
      resolved = configured;
    } else {
      resolved = new URL(configured, window.location.origin).toString();
    }
    return ensureGraphqlTrailingSlash(resolved);
  }
  try {
    const gqlUrl = new URL(configured, window.location.origin);
    const currentHost = window.location.hostname;
    if (currentHost && gqlUrl.hostname !== currentHost) {
      gqlUrl.hostname = currentHost;
    }
    resolved = gqlUrl.toString();
    return ensureGraphqlTrailingSlash(resolved);
  } catch {
    return ensureGraphqlTrailingSlash(configured);
  }
}
