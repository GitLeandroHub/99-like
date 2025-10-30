import * as A from 'automerge'

export type Role = 'user' | 'driver' | 'merchant' | 'courier'
export type RideStatus = 'requested'|'accepted'|'arriving'|'started'|'completed'|'cancelled'
export type OrderStatus = 'placed'|'accepted'|'preparing'|'picked_up'|'delivered'|'cancelled'

export type WalletTx = { id: string, from: string, to: string, amount: number, note?: string, ts: number }
export type Ride = { id: string, riderId: string, driverId?: string, origin: string, destination: string, price: number, status: RideStatus, ts: number }
export type MenuItem = { id: string, merchantId: string, name: string, price: number }
export type Order = { id: string, userId: string, merchantId: string, courierId?: string, items: {itemId: string, qty: number}[], total: number, status: OrderStatus, ts: number }

export type MarketDoc = {
  users: {[id: string]: { id: string, name: string, role: Role }},
  wallet: WalletTx[],
  rides: Ride[],
  menu: MenuItem[],
  orders: Order[]
}

export class CRDT {
  public doc: A.Doc<MarketDoc>
  constructor() {
    this.doc = A.from<MarketDoc>({
      users: {}, wallet: [], rides: [], menu: [], orders: []
    })
  }
  applyBinary(bin: Uint8Array) {
    const incoming = A.load<MarketDoc>(bin)
    this.doc = A.merge(this.doc, incoming)
  }
  snapshotBinary(): Uint8Array {
    return A.save(this.doc)
  }
}
