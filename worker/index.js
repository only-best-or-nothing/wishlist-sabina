const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
};

function json(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { ...CORS, 'Content-Type': 'application/json' },
  });
}

export default {
  async fetch(request, env) {
    const url = new URL(request.url);

    // Preflight
    if (request.method === 'OPTIONS') {
      return new Response(null, { headers: CORS });
    }

    // GET /claims — return state for all 16 items
    if (url.pathname === '/claims' && request.method === 'GET') {
      const result = {};
      for (let i = 1; i <= 16; i++) {
        const val = await env.CLAIMS.get(`item:${i}`);
        result[i] = val === 'claimed';
      }
      return json(result);
    }

    // POST /claim { id } — toggle one item
    if (url.pathname === '/claim' && request.method === 'POST') {
      let body;
      try {
        body = await request.json();
      } catch {
        return json({ error: 'invalid JSON' }, 400);
      }

      const id = parseInt(body.id, 10);
      if (!id || id < 1 || id > 16) {
        return json({ error: 'id must be 1–16' }, 400);
      }

      const key = `item:${id}`;
      const current = await env.CLAIMS.get(key);
      const nowClaimed = current !== 'claimed';

      if (nowClaimed) {
        await env.CLAIMS.put(key, 'claimed');
      } else {
        await env.CLAIMS.delete(key);
      }

      return json({ id, claimed: nowClaimed });
    }

    return new Response('Not found', { status: 404, headers: CORS });
  },
};
