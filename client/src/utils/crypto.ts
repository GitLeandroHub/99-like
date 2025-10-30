export async function ensureKeyPair(): Promise<CryptoKeyPair> {
  const existing = await window.crypto.subtle.generateKey(
    { name: 'ECDSA', namedCurve: 'P-256' },
    true,
    ['sign', 'verify']
  )
  // Para simplificar o MVP, gera sempre em memória; você pode persistir em IndexedDB depois.
  return existing
}

export async function exportPubKeyJwk(pub: CryptoKey): Promise<JsonWebKey> {
  return await crypto.subtle.exportKey('jwk', pub)
}

export async function signBytes(priv: CryptoKey, data: Uint8Array): Promise<ArrayBuffer> {
  return await crypto.subtle.sign(
    { name: 'ECDSA', hash: 'SHA-256' },
    priv,
    data
  )
}
