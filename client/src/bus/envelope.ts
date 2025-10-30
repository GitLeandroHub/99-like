export type Envelope<T=unknown> = {
  id: string                 // hash do payload
  type: 'cmd'|'evt'|'state'
  payload: T
  meta: { ts: number, from: string, room: string }
  sig?: string               // base64 (opcional no MVP)
}

export function hashString(s: string): string {
  // Hash rápido (não-criptográfico) para id de envelope (MVP)
  let h = 0; for (let i=0;i<s.length;i++){ h = Math.imul(31,h) + s.charCodeAt(i) | 0 }
  return (h>>>0).toString(16)
}

export function makeEnvelope<T>(room: string, from: string, type: Envelope['type'], payload: T): Envelope<T> {
  const base = JSON.stringify({ type, payload })
  return {
    id: hashString(base + Date.now()),
    type, payload,
    meta: { ts: Date.now(), from, room }
  }
}
