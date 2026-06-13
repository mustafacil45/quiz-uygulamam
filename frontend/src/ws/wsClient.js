class WSClient {
  constructor(url) {
    this.url = url
    this.ws = null
    this._onMessage = null
  }

  onMessage(fn) { this._onMessage = fn }

  connect() {
    try {
      this.ws = new WebSocket(this.url)
      this.ws.onopen = () => console.log('ws open')
      this.ws.onmessage = (ev) => {
        if (this._onMessage) this._onMessage(ev.data)
      }
      this.ws.onclose = () => console.log('ws closed')
      this.ws.onerror = (e) => console.warn('ws error', e)
    } catch (err) {
      console.warn('ws connect failed', err)
    }
  }

  send(msg) { if (this.ws && this.ws.readyState === 1) this.ws.send(msg) }
  disconnect() { if (this.ws) this.ws.close() }
}

export default WSClient
