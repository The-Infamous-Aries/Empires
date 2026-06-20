/**
 * Empires Game - API Client
 *
 * Lightweight fetch-based API client with error handling.
 */

const api = {
    baseUrl: '',

    async request(method, path, body = null) {
        const opts = {
            method,
            headers: { 'Content-Type': 'application/json' },
            credentials: 'same-origin',
        };
        if (body) opts.body = JSON.stringify(body);

        const resp = await fetch(`${this.baseUrl}${path}`, opts);
        if (!resp.ok) {
            let errMsg = `HTTP ${resp.status}`;
            try { const err = await resp.json(); errMsg = err.detail || err.message || JSON.stringify(err); } catch (_) {}
            throw new Error(errMsg);
        }
        const text = await resp.text();
        return text ? JSON.parse(text) : null;
    },

    get(path) { return this.request('GET', path); },
    post(path, data) { return this.request('POST', path, data); },
    put(path, data) { return this.request('PUT', path, data); },
    del(path) { return this.request('DELETE', path); },
};
