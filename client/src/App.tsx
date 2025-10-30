import React, { useEffect, useMemo, useRef, useState } from 'react'
import { RTCBus } from './bus/webrtc'
import { Envelope, makeEnvelope } from './bus/envelope'
import { CRDT } from './state/crdt'
import { ensureKeyPair, exportPubKeyJwk } from './utils/crypto'
import { WalletView } from './features/wallet'
import { MobilityView } from './features/mobility'
import { FoodView } from './features/food'

type Tab = 'wallet'|'mobility'|'food'|'config'

export default function App(){
  const [tab, setTab] = useState<Tab>('wallet')
  const [signalURL, setSignalURL] = useState(localStorage.getItem('signal') || 'http://localhost:8787')
  const [room, setRoom] = useState(localStorage.getItem('room') || 'demo-room')
  const [role, setRole] = useState<'user'|'driver'|'merchant'|'courier'>((localStorage.getItem('role') as any) || 'user')
  const [host, setHost] = useState(localStorage.getItem('host')==='true')
  const [peerId, setPeerId] = useState('')
  const [status, setStatus] = useState<'disconnected'|'connecting'|'connected'>('disconnected')

  const [crdt] = useState(()=> new CRDT())
  const busRef = useRef<RTCBus|null>(null)

  useEffect(()=>{ localStorage.setItem('signal', signalURL) },[signalURL])
  useEffect(()=>{ localStorage.setItem('room', room) },[room])
  useEffect(()=>{ localStorage.setItem('role', role) },[role])
  useEffect(()=>{ localStorage.setItem('host', String(host)) },[host])

  // identidade mínima
  useEffect(()=>{
    (async () => {
      const kp = await ensureKeyPair()
      const jwk = await exportPubKeyJwk(kp.publicKey)
      const id = (jwk.x || 'x') + '.' + (jwk.y || 'y')
      setPeerId(id.slice(0,12))
    })()
  }, [])

  const connect = async () => {
    setStatus('connecting')
    const role = host ? 'host' : 'guest'
    const bus = new RTCBus({ role, room, signalURL })
    busRef.current = bus
    bus.onopen = () => setStatus('connected')
    bus.onclose = () => setStatus('disconnected')
    bus.onmessage = (msg) => {
      if (msg.kind === 'crdt/sync' && msg.bin) {
        const bin = Uint8Array.from(atob(msg.bin), c => c.charCodeAt(0))
        crdt.applyBinary(bin)
        force()
      } else if (msg.kind === 'envelope') {
        applyEnvelope(msg.envelope)
      }
    }
    await bus.connect()
    // ao conectar, envia snapshot
    const bin = crdt.snapshotBinary()
    bus.send({ kind: 'crdt/sync', bin: btoa(String.fromCharCode(...Array.from(bin))) })
  }

  function force(){ setTab(t => t) }

  function applyEnvelope(env: Envelope){
    // aplica efeitos determinísticos no estado CRDT
    const d = crdt.doc
    if (env.type === 'cmd') {
      const p: any = env.payload
      if (p.kind === 'wallet/transfer') {
        d.wallet.push(p.tx)
      }
      if (p.kind === 'ride/request') {
        d.rides.push(p.ride)
      }
      if (p.kind === 'ride/accept') {
        const r = d.rides.find(x => x.id === p.rideId); if (r){ r.driverId = p.driverId; (r as any).status = 'accepted' }
      }
      if (p.kind === 'ride/status') {
        const r = d.rides.find((x:any)=>x.id===p.rideId); if (r){ (r as any).status = p.status }
      }
      if (p.kind === 'menu/add') {
        d.menu.push(p.item)
      }
      if (p.kind === 'order/place') {
        d.orders.push(p.order)
      }
      if (p.kind === 'order/accept') {
        const o = d.orders.find(x=>x.id===p.orderId); if (o){
          if (p.merchantId) (o as any).status = 'accepted'
          if (p.courierId) (o as any).courierId = p.courierId
        }
      }
      if (p.kind === 'order/status') {
        const o = d.orders.find(x=>x.id===p.orderId); if (o){ (o as any).status = p.status }
      }
    }
    force()
  }

  const send = (env: Envelope) => {
    // aplica local + envia
    applyEnvelope(env)
    busRef.current?.send({ kind: 'envelope', envelope: env })
  }

  return <div className="container">
    <div className="card">
      <div className="row">
        <div className="col"><b>99-like • Local-first MVP</b></div>
        <div className="col"><span className="pill">peer: {peerId || '...'}</span> <span className="pill">room: {room}</span> <span className="pill">{status}</span></div>
      </div>
      <div className="tabs" style={{marginTop:12}}>
        {(['wallet','mobility','food','config'] as Tab[]).map(t => (
          <div key={t} className={'tab'+(tab===t?' active':'')} onClick={()=>setTab(t)}>{t}</div>
        ))}
      </div>
      {tab==='wallet' && <WalletView id={peerId} room={room} crdt={crdt} send={send} />}
      {tab==='mobility' && <MobilityView id={peerId} role={role==='driver'?'driver':'user'} room={room} crdt={crdt} send={send} />}
      {tab==='food' && <FoodView id={peerId} role={role==='merchant'?'merchant':role==='courier'?'courier':'user'} room={room} crdt={crdt} send={send} />}
      {tab==='config' && <div className="card">
        <div className="vstack">
          <div className="row">
            <div className="col">
              <label className="muted">Signal Server</label>
              <input className="col" value={signalURL} onChange={e=>setSignalURL(e.target.value)} />
            </div>
            <div className="col">
              <label className="muted">Room</label>
              <input className="col" value={room} onChange={e=>setRoom(e.target.value)} />
            </div>
          </div>
          <div className="row">
            <div className="col">
              <label className="muted">Meu papel</label>
              <select className="col" value={role} onChange={e=>setRole(e.target.value as any)}>
                <option value="user">Usuário</option>
                <option value="driver">Motorista</option>
                <option value="merchant">Merchant</option>
                <option value="courier">Entregador</option>
              </select>
            </div>
            <div className="col">
              <label className="muted">Modo</label>
              <div className="hstack">
                <label><input type="checkbox" checked={host} onChange={e=>setHost(e.target.checked)} /> Eu serei o HOST</label>
                <button className="btn" onClick={connect}>{status==='connected'?'Reconectar':'Conectar'}</button>
              </div>
            </div>
          </div>
          <div className="muted">Dica: Abra duas abas; em uma, marque "Eu serei o HOST"; na outra, deixe desmarcado e conecte na mesma sala.</div>
          <div className="muted mono">Este é um MVP: ledger e pagamentos são simulados; use apenas para prototipagem.</div>
        </div>
      </div>}
    </div>
  </div>
}
