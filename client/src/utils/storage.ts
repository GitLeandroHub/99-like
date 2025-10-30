import { set, get } from 'idb-keyval'

export async function kvSet<T>(k: string, v: T): Promise<void> { await set(k, v as any) }
export async function kvGet<T>(k: string): Promise<T | undefined> { return await get(k) as any }

export async function saveOPFS(path: string, blob: Blob): Promise<void> {
  // OPFS (Origin Private File System) – requer permissões de armazenamento persistente em alguns navegadores.
  // Fallback simples: IndexedDB já cobre muita coisa neste MVP.
  if ('showSaveFilePicker' in window) {
    try {
      const handle = await (window as any).showSaveFilePicker({ suggestedName: path })
      const writable = await handle.createWritable()
      await writable.write(await blob.arrayBuffer())
      await writable.close()
    } catch { /* ignore */ }
  }
}
