// WebRTC com sinalização HTTP simples.
// Design: um 'host' (hub) cria a sala e gera uma oferta; os 'guests' conectam via resposta.
// Para MVP, usa polling HTTP em /rooms/:roomId para publicar/obter SDP.

type Role = 'host' | 'guest'

export class RTCBus {
  private pc?: RTCPeerConnection
  private dc?: RTCDataChannel
  private role: Role
  private room: string
  private signalURL: string
  public onmessage?: (data: any) => void
  public onopen?: () => void
  public onclose?: () => void

  constructor(args: { role: Role, room: string, signalURL: string }) {
    this.role = args.role
    this.room = args.room
    this.signalURL = args.signalURL.replace(/\/$/, '')
  }

  async connect() {
    this.pc = new RTCPeerConnection({ iceServers: [{ urls: 'stun:stun.l.google.com:19302' }] })

    if (this.role === 'host') {
      this.dc = this.pc.createDataChannel('events', { ordered: true })
      this.wireDC(this.dc)
      const offer = await this.pc.createOffer()
      await this.pc.setLocalDescription(offer)
      await this.post(`/offer`, { room: this.room, sdp: offer.sdp })
      // aguarda answer
      await this.waitForAnswer()
    } else {
      // guest
      const offer = await this.get(`/offer?room=${encodeURIComponent(this.room)}`)
      if (!offer?.sdp) throw new Error('Nenhuma oferta disponível. Aguarde o host.')
      await this.pc.setRemoteDescription({ type: 'offer', sdp: offer.sdp })
      const answer = await this.pc.createAnswer()
      await this.pc.setLocalDescription(answer)
      await this.post(`/answer`, { room: this.room, sdp: answer.sdp })
      this.pc.ondatachannel = (e) => {
        this.dc = e.channel
        this.wireDC(this.dc)
      }
    }

    this.pc.onicecandidate = (e) => {
      if (e.candidate) {
        this.post('/ice', { room: this.room, candidate: e.candidate })
      }
    }

    // coleta ICE remotos
    const pollIce = async () => {
      if (!this.pc) return
      const list = await this.get(`/ice?room=${encodeURIComponent(this.room)}`)
      if (Array.isArray(list)) {
        for (const c of list) {
          try { await this.pc.addIceCandidate(c) } catch {}
        }
      }
      setTimeout(pollIce, 1000)
    }
    pollIce()
  }

  private wireDC(dc: RTCDataChannel) {
    dc.onopen = () => this.onopen && this.onopen()
    dc.onclose = () => this.onclose && this.onclose()
    dc.onmessage = (e) => {
      try { const data = JSON.parse(e.data); this.onmessage && this.onmessage(data) }
      catch { /* ignore */ }
    }
  }

  send(data: any) { this.dc?.send(JSON.stringify(data)) }

  private async waitForAnswer() {
    // polling por answer
    const loop = async () => {
      const ans = await this.get(`/answer?room=${encodeURIComponent(this.room)}`)
      if (ans?.sdp) {
        await this.pc!.setRemoteDescription({ type: 'answer', sdp: ans.sdp })
      } else {
        setTimeout(loop, 1000)
      }
    }
    await loop()
  }

  private async get(path: string) {
    const res = await fetch(`${this.signalURL}${path}`)
    if (!res.ok) return null
    return await res.json().catch(() => null)
  }

  private async post(path: string, body: any) {
    await fetch(`${this.signalURL}${path}`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) })
  }
}
