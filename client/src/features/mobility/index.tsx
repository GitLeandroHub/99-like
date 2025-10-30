import React, { useState } from 'react'
import { Envelope, makeEnvelope } from '../../bus/envelope'
import { CRDT } from '../../state/crdt'

export function MobilityView({ id, role, room, crdt, send }:{ id: string, role: 'user'|'driver', room: string, crdt: CRDT, send: (e: Envelope)=>void }){
  const [origin, setOrigin] = useState('Av. Paulista, 1000')
  const [destination, setDestination] = useState('Praça da Sé')
  const [price, setPrice] = useState(20)

  const requestRide = () => {
    const ride = { id: crypto.randomUUID(), riderId: id, origin, destination, price: Number(price), status: 'requested' as const, ts: Date.now() }
    send(makeEnvelope(room, id, 'cmd', { kind: 'ride/request', ride }))
  }

  const visible = [...crdt.doc.rides].reverse().slice(0,20)

  const accept = (rideId: string) => send(makeEnvelope(room, id, 'cmd', { kind: 'ride/accept', rideId, driverId: id }))
  const advance = (rideId: string, status: any) => send(makeEnvelope(room, id, 'cmd', { kind: 'ride/status', rideId, status }))

  return <div className="card">
    <div className="row">
      <div className="col"><h3>Mobilidade</h3><div className="muted">Peça/aceite corridas</div></div>
    </div>

    {role==='user' && <div className="row" style={{marginTop:8}}>
      <input className="col" placeholder="Origem" value={origin} onChange={e=>setOrigin(e.target.value)} />
      <input className="col" placeholder="Destino" value={destination} onChange={e=>setDestination(e.target.value)} />
      <input className="col" type="number" min={1} step={1} value={price} onChange={e=>setPrice(Number(e.target.value))} />
      <button className="btn" onClick={requestRide}>Pedir</button>
    </div>}

    <div style={{marginTop:12}}>
      <div className="muted">Corridas recentes:</div>
      <div className="list">
        {visible.map(r => (
          <div key={r.id} className="card" style={{padding:'8px'}}>
            <div className="hstack"><span className="badge">{r.status}</span><span className="muted">{new Date(r.ts).toLocaleString()}</span></div>
            <div>De <b>{r.origin}</b> para <b>{r.destination}</b> • R$ {r.price.toFixed(2)}</div>
            <div className="muted">Passageiro: {r.riderId} {r.driverId?(` • Motorista: ${r.driverId}`):''}</div>
            <div className="hstack" style={{marginTop:6}}>
              {role==='driver' && r.status==='requested' && <button className="btn" onClick={()=>accept(r.id)}>Aceitar</button>}
              {role==='driver' && r.driverId===id && r.status==='accepted' && <button className="btn" onClick={()=>advance(r.id,'arriving')}>A caminho</button>}
              {role==='driver' && r.driverId===id && r.status==='arriving' && <button className="btn" onClick={()=>advance(r.id,'started')}>Iniciar</button>}
              {role==='driver' && r.driverId===id && r.status==='started' && <button className="btn" onClick={()=>advance(r.id,'completed')}>Concluir</button>}
            </div>
          </div>
        ))}
      </div>
    </div>
  </div>
}
