// Netlify serverless function — shared field mapping store using Netlify Blobs.
// GET  ?template=<key>  → returns stored fields for that template (public, no auth)
// POST                  → saves fields for a template (requires admin password header)

const { getStore } = require('@netlify/blobs');

const ADMIN_PASSWORD = 'PartnerAdmin2026!';

const CORS_HEADERS = {
  'Access-Control-Allow-Origin':  '*',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, x-admin-password'
};

exports.handler = async function(event) {
  // Handle CORS preflight
  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 200, headers: CORS_HEADERS, body: '' };
  }

  try {
    const store = getStore('form-mappings');

    // ── GET: return stored fields for one or all templates ──────────────────
    if (event.httpMethod === 'GET') {
      const template = event.queryStringParameters && event.queryStringParameters.template;

      if (template) {
        const raw = await store.get(template);
        return {
          statusCode: 200,
          headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' },
          body: raw || 'null'
        };
      }

      // No template param → return all templates as one object
      const keys = ['portability', 'ownership_seller', 'ownership_buyer', 'ide-terms-agreement'];
      const result = {};
      for (const key of keys) {
        const raw = await store.get(key);
        result[key] = raw ? JSON.parse(raw) : null;
      }
      return {
        statusCode: 200,
        headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' },
        body: JSON.stringify(result)
      };
    }

    // ── POST: save fields for a template (admin only) ────────────────────────
    if (event.httpMethod === 'POST') {
      const adminPassword = event.headers['x-admin-password'];
      if (adminPassword !== ADMIN_PASSWORD) {
        return { statusCode: 401, headers: CORS_HEADERS, body: 'Unauthorized' };
      }

      const body = JSON.parse(event.body);
      const { template, fields } = body;

      if (!template || !Array.isArray(fields)) {
        return { statusCode: 400, headers: CORS_HEADERS, body: 'Missing template or fields' };
      }

      await store.set(template, JSON.stringify({ fields }));

      return { statusCode: 200, headers: CORS_HEADERS, body: 'OK' };
    }

    return { statusCode: 405, headers: CORS_HEADERS, body: 'Method Not Allowed' };

  } catch (err) {
    console.error('sync-mapping error:', err);
    return {
      statusCode: 500,
      headers: CORS_HEADERS,
      body: JSON.stringify({ error: err.message })
    };
  }
};
