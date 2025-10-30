import express from 'express'
import cors from 'cors'

const app = express()
app.use(cors())
app.use(express.json())

const rooms = new Map() // roomId -> { offer?: string, answer?: string, ice: any[] }

function ensure(room){
  if (!rooms.has(room)) rooms.set(room, { ice: [] })
  return rooms.get(room)
}

app.post('/offer', (req,res)=>{
  const { room, sdp } = req.body
  const r = ensure(room)
  r.offer = sdp
  r.answer = undefined
  r.ice = []
  res.json({ ok: true })
})

app.get('/offer', (req,res)=>{
  const r = ensure(req.query.room)
  res.json({ sdp: r.offer || null })
})

app.post('/answer', (req,res)=>{
  const { room, sdp } = req.body
  const r = ensure(room)
  r.answer = sdp
  res.json({ ok: true })
})

app.get('/answer', (req,res)=>{
  const r = ensure(req.query.room)
  res.json({ sdp: r.answer || null })
})

app.post('/ice', (req,res)=>{
  const { room, candidate } = req.body
  const r = ensure(room)
  r.ice.push(candidate)
  res.json({ ok: true })
})

app.get('/ice', (req,res)=>{
  const r = ensure(req.query.room)
  const list = r.ice || []
  r.ice = [] // esvazia (entrega pelo menos uma vez)
  res.json(list)
})

const PORT = process.env.PORT || 8787
app.listen(PORT, ()=> console.log('Signaling server on http://localhost:'+PORT))
