"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.installFetchInterceptor = installFetchInterceptor;
// Intercepts all fetch('/api/*') calls and routes them to our Firestore client
// This patches the global fetch so we don't have to change every component
const client_1 = require("./api/client");
let installed = false;
function installFetchInterceptor() {
    if (installed || typeof window === 'undefined')
        return;
    installed = true;
    const originalFetch = window.fetch.bind(window);
    window.fetch = async (input, init) => {
        const url = typeof input === 'string' ? input : input instanceof URL ? input.href : input.url;
        // Only intercept relative /api/* paths
        if (typeof url === 'string' && url.startsWith('/api/')) {
            const method = (init?.method || 'GET').toUpperCase();
            let body = undefined;
            if (init?.body) {
                try {
                    body = JSON.parse(init.body);
                }
                catch {
                    body = init.body;
                }
            }
            try {
                const result = method === 'GET'
                    ? await client_1.api.get(url)
                    : method === 'POST' ? await client_1.api.post(url, body)
                        : method === 'PATCH' ? await client_1.api.patch(url, body)
                            : method === 'PUT' ? await client_1.api.put(url, body)
                                : method === 'DELETE' ? await client_1.api.delete(url)
                                    : await client_1.api.get(url);
                return new Response(JSON.stringify(result), {
                    status: 200,
                    headers: { 'Content-Type': 'application/json' },
                });
            }
            catch (err) {
                const e = err;
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
