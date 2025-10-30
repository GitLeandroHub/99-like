import React, { useState } from 'react'
import { Envelope, makeEnvelope } from '../../bus/envelope'
import { CRDT } from '../../state/crdt'

export function WalletView({ id, room, crdt, send }: { id: string, room: string, crdt: CRDT, send: (e: Envelope)=>void }) {
  const [to, setTo] = useState('')
  const [amount, setAmount] = useState(10)
  const [note, setNote] = useState('')

  const balance = crdt.doc.wallet.reduce((acc, tx) => {
    if (tx.to === id) acc += tx.amount
    if (tx.from === id) acc -= tx.amount
    return acc
  }, 0)

  const submit = () => {
    const tx = { id: crypto.randomUUID(), from: id, to, amount: Number(amount), note, ts: Date.now() }
    const env = makeEnvelope(room, id, 'cmd', { kind: 'wallet/transfer', tx })
    send(env)
  }

  return <div className="card">
    <div className="row">
      <div className="col"><h3>Wallet</h3><div className="muted">Saldo (simulado): <b>R$ {balance.toFixed(2)}</b></div></div>
    </div>
    <div className="row" style={{marginTop:12}}>
      <input className="col" placeholder="Para (peerId)" value={to} onChange={e=>setTo(e.target.value)} />
      <input className="col" type="number" min={1} step={1} value={amount} onChange={e=>setAmount(Number(e.target.value))} />
      <input className="col" placeholder="Note (opcional)" value={note} onChange={e=>setNote(e.target.value)} />
      <button className="btn" onClick={submit}>Enviar</button>
    </div>
    <div style={{marginTop:12}}>
      <div className="muted">Transações:</div>
      <div className="list">
        {[...crdt.doc.wallet].reverse().slice(0,20).map(tx => (
          <div key={tx.id} className="card" style={{padding:'8px'}}>
            <div className="hstack"><span className="badge">{tx.from===id?'Saída':'Entrada'}</span>
              <span className="muted"> {new Date(tx.ts).toLocaleString()} </span>
            </div>
            <div>de <b>{tx.from}</b> para <b>{tx.to}</b> • R$ {tx.amount.toFixed(2)} {tx.note?('— '+tx.note):''}</div>
          </div>
        ))}
      </div>
    </div>
  </div>
}
