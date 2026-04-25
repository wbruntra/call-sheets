export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);
    const path = url.pathname;

    const cors = {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    };

    if (request.method === 'OPTIONS') {
      return new Response(null, { status: 204, headers: cors });
    }

    // POST /b — create a new bin
    if (path === '/b' && request.method === 'POST') {
      try {
        const body = await request.json();
        const id = generateId();
        await env.CALLSHEETS_KV.put(id, JSON.stringify(body));
        return json({
          record: body,
          metadata: {
            id,
            createdAt: new Date().toISOString(),
            private: false,
          }
        }, cors);
      } catch (err) {
        return json({ message: 'Invalid JSON' }, cors, 400);
      }
    }

    // GET /b/<id> or GET /b/<id>/latest — read a bin
    const getMatch = path.match(/^\/b\/(.+?)(?:\/latest)?$/);
    if (getMatch && request.method === 'GET') {
      const id = getMatch[1];
      const data = await env.CALLSHEETS_KV.get(id);
      if (!data) {
        return json({ message: 'Bin not found' }, cors, 404);
      }
      return json({ record: JSON.parse(data) }, cors);
    }

    // PUT /b/<id> — update a bin
    const putMatch = path.match(/^\/b\/(.+)$/);
    if (putMatch && request.method === 'PUT') {
      const id = putMatch[1];
      try {
        const body = await request.json();
        await env.CALLSHEETS_KV.put(id, JSON.stringify(body));
        return json({ record: body }, cors);
      } catch (err) {
        return json({ message: 'Invalid JSON' }, cors, 400);
      }
    }

    return json({ message: 'Not found' }, cors, 404);
  }
};

function generateId() {
  // URL-safe random ID, 12 chars
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let id = '';
  const arr = crypto.getRandomValues(new Uint8Array(12));
  for (let i = 0; i < 12; i++) {
    id += chars[arr[i] % chars.length];
  }
  return id;
}

function json(data, cors, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { ...cors, 'Content-Type': 'application/json' }
  });
}
