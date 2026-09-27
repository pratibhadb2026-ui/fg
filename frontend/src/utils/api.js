export async function apiRequest(endpoint, method = 'GET', body = null) {
  const token = localStorage.getItem('token');

  const headers = {
    'Content-Type': 'application/json',
  };

  if (token) headers['Authorization'] = `Bearer ${token}`;

  const options = { method, headers };
  if (body) options.body = JSON.stringify(body);

  // Use Vite env var VITE_API_BASE when provided (set in Vercel), otherwise try relative /api
  const apiBase = import.meta.env.VITE_API_BASE || '';
  let url = `${apiBase}/api${endpoint}`;

  try {
    const res = await fetch(url, options);
    const data = await res.json().catch(() => ({}));

    if (!res.ok) {
      // In local testing, Vite may return 404 if the proxy is unavailable.
      // Retry directly against the backend before showing the error.
      if (!apiBase && res.status === 404) {
        const host = window.location.hostname || '127.0.0.1';
        const fallback = `http://${host}:5000/api${endpoint}`;
        const res2 = await fetch(fallback, options);
        const data2 = await res2.json().catch(() => ({}));
        if (res2.ok) return data2;
      }
      const errMsg = data.error || `Server Error (${res.status})`;
      throw new Error(errMsg);
    }

    return data;
  } catch (err) {
    console.error(`API Error [${method} ${endpoint}]:`, err.message);
    // Preserve previous fallback behavior for local development
    if (!apiBase) {
      // Try localhost:5000 as a last resort for local dev
      const host = window.location.hostname || '127.0.0.1';
      const fallback = `http://${host}:5000/api${endpoint}`;
      try {
        const res2 = await fetch(fallback, options);
        const data2 = await res2.json();
        if (!res2.ok) throw new Error(data2.error || `Server Error (${res2.status})`);
        return data2;
      } catch (err2) {
        console.error('Fallback API Error:', err2.message);
      }
    }

    throw err;
  }
}
