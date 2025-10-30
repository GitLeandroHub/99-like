export default {
  async fetch(req, env, ctx) {
    const url = new URL(req.url)
    const store = env.__STATE || (env.__STATE = new Map())
    const ensure = (room) => {
      if (!store.has(room)) store.set(room, { ice: [] })
      return store.get(room)
    }

    if (req.method === 'POST') {
      const body = await req.json().catch(()=>({}))
      if (url.pathname === '/offer') {
        const r = ensure(body.room)
        r.offer = body.sdp; r.answer = undefined; r.ice = []
        return new Response(JSON.stringify({ ok: true }), { headers: {'content-type':'application/json'} })
      }
      if (url.pathname === '/answer') {
        const r = ensure(body.room); r.answer = body.sdp
        return new Response(JSON.stringify({ ok: true }), { headers: {'content-type':'application/json'} })
      }
      if (url.pathname === '/ice') {
        const r = ensure(body.room); r.ice.push(body.candidate)
        return new Response(JSON.stringify({ ok: true }), { headers: {'content-type':'application/json'} })
      }
    } else if (req.method === 'GET') {
      if (url.pathname === '/offer') {
        const r = ensure(url.searchParams.get('room'))
        return new Response(JSON.stringify({ sdp: r.offer || null }), { headers: {'content-type':'application/json'} })
      }
      if (url.pathname === '/answer') {
        const r = ensure(url.searchParams.get('room'))
        return new Response(JSON.stringify({ sdp: r.answer || null }), { headers: {'content-type':'application/json'} })
      }
      if (url.pathname === '/ice') {
        const r = ensure(url.searchParams.get('room'))
        const list = r.ice || []; r.ice = []
        return new Response(JSON.stringify(list), { headers: {'content-type':'application/json'} })
      }
    }
    return new Response('ok')
  }
}
