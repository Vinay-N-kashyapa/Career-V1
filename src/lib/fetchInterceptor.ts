// Intercepts all fetch('/api/*') calls and routes them to our Firestore client
// This patches the global fetch so we don't have to change every component
import { api } from './api/client';

let installed = false;

export function installFetchInterceptor() {
  if (installed || typeof window === 'undefined') return;
  installed = true;

  const originalFetch = window.fetch.bind(window);

  window.fetch = async (input: RequestInfo | URL, init?: RequestInit): Promise<Response> => {
    const url = typeof input === 'string' ? input : input instanceof URL ? input.href : (input as Request).url;

    // Only intercept relative /api/* paths
    if (typeof url === 'string' && url.startsWith('/api/')) {
      const method = (init?.method || 'GET').toUpperCase();
      let body: unknown = undefined;
      if (init?.body) {
        try { body = JSON.parse(init.body as string); } catch { body = init.body; }
      }

      try {
        const result = method === 'GET'
          ? await api.get(url)
          : method === 'POST'  ? await api.post(url, body)
          : method === 'PATCH' ? await api.patch(url, body)
          : method === 'PUT'   ? await api.put(url, body)
          : method === 'DELETE'? await api.delete(url)
          : await api.get(url);

        return new Response(JSON.stringify(result), {
          status: 200,
          headers: { 'Content-Type': 'application/json' },
        });
      } catch (err: unknown) {
        const e = err as { status?: number; message?: string; code?: string };
        return new Response(JSON.stringify({ error: e.message || 'Error', code: e.code || 'ERROR' }), {
          status: e.status || 500,
          headers: { 'Content-Type': 'application/json' },
        });
      }
    }

    // Pass through all non-API calls
    return originalFetch(input, init);
  };
}
