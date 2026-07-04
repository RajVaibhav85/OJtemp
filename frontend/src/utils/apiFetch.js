const BACKEND_URL = import.meta.env.VITE_SERVER_URL || 'http://localhost:5000';
const AUTH_API = `${BACKEND_URL}/api/auth`;

// If several requests 401 at roughly the same moment (e.g. a page fires off
// 3 fetches in parallel right as the access token expires), we don't want
// each one to independently call /auth/refresh — that's a thundering herd
// and risks the refresh token being rotated/invalidated mid-flight. Sharing
// one in-flight promise means concurrent 401s all await the SAME refresh.
let refreshInFlight = null;

const refreshAccessToken = () => {
    if (!refreshInFlight) {
        refreshInFlight = fetch(`${AUTH_API}/refresh`, {
            method: 'POST',
            credentials: 'include',
        })
            .then(res => res.ok)
            .catch(() => false)
            .finally(() => { refreshInFlight = null; });
    }
    return refreshInFlight;
};

/**
 * Drop-in replacement for fetch() for any call that requires auth.
 *
 * On a 401, it silently calls /auth/refresh (using the httpOnly refresh
 * cookie) and retries the original request exactly once with the new access
 * token. The caller only ever sees a 401 if the refresh itself failed —
 * i.e. the refresh token is genuinely gone/expired, and it's correct to log
 * the user out at that point.
 *
 * Usage: identical to fetch(). credentials: 'include' is applied by default
 * so callers don't have to remember it on every call site.
 *
 *   const res = await apiFetch(`${CONTEST_API}/${id}`);
 *   if (res.status === 401) { navigate('/auth'); return; }
 *   const data = await res.json();
 */
export const apiFetch = async (url, options = {}) => {
    const opts = { credentials: 'include', ...options };
    let res = await fetch(url, opts);
    
    if (res.status === 401) {
        const refreshed = await refreshAccessToken();
        if (refreshed) {
            res = await fetch(url, opts);
        }
    }

    return res;
};