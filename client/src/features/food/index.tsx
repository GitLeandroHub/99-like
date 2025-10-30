import React, { useState } from 'react'
import { Envelope, makeEnvelope } from '../../bus/envelope'
import { CRDT } from '../../state/crdt'

export function FoodView({ id, role, room, crdt, send }:{ id: string, role: 'user'|'merchant'|'courier', room: string, crdt: CRDT, send: (e: Envelope)=>void }){
  const [name, setName] = useState('Sanduíche')
  const [price, setPrice] = useState(25)
  const [merchantId, setMerchantId] = useState(id)
  const [cart, setCart] = useState<{itemId: string, qty: number}[]>([])

  const addMenu = () => {
    const item = { id: crypto.randomUUID(), merchantId, name, price: Number(price) }
    send(makeEnvelope(room, id, 'cmd', { kind: 'menu/add', item }))
  }

  const placeOrder = (merchantId: string) => {
    const selected = crdt.doc.menu.filter(m => m.merchantId === merchantId).slice(0,2)
    const items = selected.map(i => ({ itemId: i.id, qty: 1 }))
    const total = selected.reduce((a,b)=>a+b.price,0)
    const order = { id: crypto.randomUUID(), userId: id, merchantId, items, total, status: 'placed' as const, ts: Date.now() }
    send(makeEnvelope(room, id, 'cmd', { kind: 'order/place', order }))
  }

  const accept = (orderId: string) => {
    const who = role==='merchant' ? { merchantId: id } : { courierId: id }
    send(makeEnvelope(room, id, 'cmd', { kind: 'order/accept', orderId, ...who }))
  }
  const progress = (orderId: string, status: any) => send(makeEnvelope(room, id, 'cmd', { kind: 'order/status', orderId, status }))

  const merchants = Array.from(new Set(crdt.doc.menu.map(m=>m.merchantId)))

  return <div className="card">
    <h3>Comida</h3>
    {role==='merchant' && <div className="row" style={{marginTop:8}}>
      <input className="col" placeholder="Nome do prato" value={name} onChange={e=>setName(e.target.value)} />
      <input className="col" type="number" min={1} step={1} value={price} onChange={e=>setPrice(Number(e.target.value))} />
      <button className="btn" onClick={addMenu}>Adicionar ao cardápio</button>
    </div>}

    <div className="row" style={{marginTop:12}}>
      <div className="col">
        <div className="muted">Cardápio (todos):</div>
        <div className="list">
          {crdt.doc.menu.slice(-20).reverse().map(i => (
            <div key={i.id} className="card" style={{padding:'8px'}}>
              <div><b>{i.name}</b> • R$ {i.price.toFixed(2)} <span className="pill">merchant {i.merchantId}</span></div>
            </div>
          ))}
        </div>
      </div>
      <div className="col">
        <div className="muted">Pedidos:</div>
        <div className="list">
          {crdt.doc.orders.slice(-20).reverse().map(o => (
            <div key={o.id} className="card" style={{padding:'8px'}}>
              <div className="hstack"><span className="badge">{o.status}</span><span className="muted">{new Date(o.ts).toLocaleString()}</span></div>
              <div>Cliente {o.userId} → Merchant {o.merchantId} {o.courierId?`→ Courier ${o.courierId}`:''}</div>
              <div>Total R$ {o.total.toFixed(2)}</div>
              <div className="hstack" style={{marginTop:6}}>
                {role==='user' && <button className="btn" onClick={()=>placeOrder(o.merchantId)}>Repetir</button>}
                {role==='merchant' && o.status==='placed' && <button className="btn" onClick={()=>accept(o.id)}>Aceitar (merchant)</button>}
                {role==='merchant' && o.status==='accepted' && <button className="btn" onClick={()=>progress(o.id,'preparing')}>Preparando</button>}
                {role==='courier' && (o.status==='preparing' || o.status==='accepted') && <button className="btn" onClick={()=>accept(o.id)}>Aceitar (courier)</button>}
                {role==='courier' && o.courierId===id && o.status==='preparing' && <button className="btn" onClick={()=>progress(o.id,'picked_up')}>Retirado</button>}
                {role==='courier' && o.courierId===id && o.status==='picked_up' && <button className="btn" onClick={()=>progress(o.id,'delivered')}>Entregue</button>}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>

    <div style={{marginTop:12}}>
      <div className="muted">Ações rápidas:</div>
      <div className="hstack">
        {merchants.map(mid => <button key={mid} className="btn secondary" onClick={()=>placeOrder(mid)}>Pedir de merchant {mid}</button>)}
      </div>
    </div>
  </div>
}
