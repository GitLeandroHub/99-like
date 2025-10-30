# 99-like (Local-first Super App) — Starter Kit

<p align="center">
  <img src="99-like.gif" alt="Logo 99-like" width="35%">
</p>

Arquitetura: **PWA + CRDT (Automerge) + WebRTC (DataChannel) + OPFS/IndexedDB**, com **sinalização mínima** (host fino).
Fluxos incluídos: **Conta digital (ledger simulado)**, **Mobilidade (corridas)**, **Comida (pedidos)** — todos no **mesmo barramento de eventos**.

> ⚠️ Este repositório é um **MVP local-first** pensado para provar conceitos com o mínimo de infraestrutura.  
> Sem Docker/K8s. Um *único* serviço de sinalização basta (Node/Express ou Cloudflare Worker).

---

## 📦 Preparação (uma vez)

1. **Node 18+** instalado.  
2. **Clonar** o projeto e abrir dois terminais (um pro cliente, outro pro servidor).
3. **Server de Sinalização (Node/Express)**  
   ```bash
   cd server-node
   npm install
   npm start            # http://localhost:8787
   ```
   > Opcional: habilite uma resposta amigável na raiz `/` adicionando `app.get('/', (_,res)=>res.send('ok'))` em `server.js`.

4. **Cliente (PWA)**
   ```bash
   cd client
   npm install
   npm run dev          # http://localhost:5173
   ```
   - O projeto usa `@vitejs/plugin-react-swc` + `vite-plugin-wasm` + `vite-plugin-top-level-await` para suportar o Automerge v2 (Wasm).
   - O Vite serve os arquivos de `public/` na raiz. Portanto:
     - Manifest: `<link rel="manifest" href="/manifest.webmanifest">`
     - Service Worker: arquivo em `public/sw.js` e registro `navigator.serviceWorker.register('/sw.js')`.

5. **(Opcional) Sinalização em edge** — Cloudflare Worker
   ```bash
   cd server-worker
   wrangler login
   wrangler deploy
   # use a URL do Worker em Config → Signal Server (no cliente)
   ```

6. **(Opcional) LAN / Mobile**
   - Para testar em dois dispositivos: em `vite.config.ts`, defina `server: { host: true }` e aponte o **Signal Server** para o IP acessível (ex.: `http://SEU_IP:8787`).

---

## 🚀 Como rodar (rápido)

### 1) Cliente (PWA)
```bash
cd client
npm install
npm run dev
# abra http://localhost:5173 em DOIS navegadores/abas perfis distintos para simular atores diferentes
```

### 2) Sinalização (Node/Express)
```bash
cd server-node
npm install
npm start             # http://localhost:8787
```
No cliente, em **Config → Signal Server**, use `http://localhost:8787` (ou a URL do seu Worker).

> Alternativa: `server-worker` traz uma versão Cloudflare Worker para sinalização (ótimo para fora da sua LAN).

---

## 🧠 Conceitos-chave

- **Local-first**: dados do usuário vivem no dispositivo (OPFS/IndexedDB).  
- **CRDT (Automerge v2)**: merge automático de estados concorrentes sem conflitos.  
- **WebRTC DataChannel**: sync P2P em tempo real. Precisa de **sinalização** HTTP simples (offer/answer/ice).  
- **Envelope único**: objetos `{ type, payload, meta, sig? }` para **wallet**, **rides** e **orders**.  
- **Sem Docker/K8s**: somente um serviço de sinalização leve (pode rodar em edge).

---

## 🧩 O que já vem pronto

- **Conta digital (wallet)**: ledger local e “transfers” entre peers (simuladas).  
- **Mobilidade (rides)**: passageiro cria requisição; motorista aceita; estados: `requested → accepted → arriving → started → completed`.  
- **Comida (food)**: merchant cria cardápio; usuário faz pedido; courier aceita; estados: `placed → accepted/preparing → picked_up → delivered`.  
- **PWA** com service worker simples, cache básico e UI leve.  
- **Sync P2P** via WebRTC; **sinalização** por Node/Express ou Cloudflare Worker.

> **Pagamentos e KYC** são **simulados**. Para produção real, integre um PSP (PIX/Stripe/etc.) e conformidade regulatória.

---

## 🎮 Guia de uso (3 janelas / 3 atores)

1. Abra **3 janelas** do app. Em **Config** de cada uma:  
   - **Merchant**: marque **HOST**, `room = pilot-1`, **Conectar**, papel = **merchant**.  
   - **Usuário**: **GUEST**, mesma `room`, papel = **user**, **Conectar**.  
   - **Courier**: **GUEST**, mesma `room`, papel = **courier**, **Conectar**.

2. **Merchant → food**: cadastre 2–3 pratos (**Adicionar ao cardápio**).  
3. **Usuário → food**: clique **Pedir de merchant {id}** (gera `placed`).  
4. **Merchant → food**: **Aceitar (merchant)** → **Preparando**.  
5. **Courier → food**: **Aceitar (courier)** → **Retirado** → **Entregue**.  
6. **Usuário → wallet**: transfira valor do pedido ao **merchant**; opcional gorjeta ao **courier**.

> **Mobilidade**: em **Usuário → mobility** faça **Pedir**; em **Driver → mobility**, **Aceitar** e avance status até **Concluir**.

---

## 🧾 Integração com ERP (cardápio/estoque)

- O ERP é a **fonte de verdade** de cardápio/estoque. O app orquestra e sincroniza:
  - `menu/sync { items }` *(ERP → app)*
  - `inventory/reserve { orderId, items }` *(app → ERP no aceite)*
  - `inventory/decrement { orderId }` *(app → ERP no picked_up/delivered)*
  - `inventory/unreserve { orderId }` *(app → ERP no cancel/decline)*

> No MVP atual, o cardápio é inserido pela tela do merchant (mock).

---

## 🧭 Roadmap

- **D1** ✅ PWA + identidade + envelope + storage (OPFS/IDB – base)  
- **D2** ⏳ Estado CRDT + **persistência em IndexedDB** + **backup/export**  
- **D3** ⏳ WebRTC + **reconexão automática** + organização de **rooms**  
- **D4** ⏳ Fluxo Wallet + **assinaturas/verificação de envelope** (ECDSA)  
- **D5** ⏳ Mobilidade: matching simples por sala + guard-rails (não aceitar o próprio rider)  
- **D6** ⏳ Comida: cardápios/descoberta por sala + courier UX melhor  
- **D7** ⏳ Hardening (CSP, COOP/COEP), PWA install, métricas no cliente, docs e scripts

---

## ✅ Estado atual vs. produção

- **Piloto fechado / PoC** (dezenas/centenas de usuários): **~60–70%** pronto.  
- **Produção aberta (milhares)**: **~40–50%** (falta TURN, métricas e automações).  
- **Escala “99 real”**: **~10–15%** (compliance, antifraude, auditoria e SRE 24/7).

---

## 🐞 Problemas conhecidos (MVP)

- **Mesma aba = mesmo peer**: trocar de papel mantém o mesmo ator e você pode “se aceitar”. (Use abas diferentes ou aplique `actorId = peerId:role`.)  
- **Re-render só ao trocar de aba**: o `force()` atual pode não re-renderizar imediatamente após cada mutação; patch recomendado: `useState` tick ou `useSyncExternalStore`.  
- **Sem cancel/decline/unassign**: ainda não há botões para cancelar/recusar/desatribuir (os envelopes são fáceis de adicionar).  
- **Sem reconexão automática**: se a conexão cair, é preciso **Conectar** de novo.  
- **Sem TURN**: em redes mais restritivas, P2P pode falhar (use Worker público ou adicione TURN).  
- **Pagamentos simulados**: wallet não integra PSP; **split** e estorno são manuais.  
- **Identidade volátil**: o par de chaves não é persistido (reiniciar pode mudar o peerId).

---

## 🧰 Troubleshooting

- **GUEST não conecta**: o **HOST** precisa conectar primeiro (publica a *offer*) e todos devem estar na **mesma room**.  
- **`Cannot GET /` no servidor**: é normal; o server só expõe `/offer`, `/answer` e `/ice`. (Opcional: responder `"ok"` na raiz.)  
- **Dois devices e nada conecta**: exponha o Vite (`server.host = true`) e use o IP correto no **Signal Server**.  
- **Rede corporativa**: pode exigir **TURN**.  
- **Wasm/Automerge erro no Vite**: use `vite-plugin-wasm` + `vite-plugin-top-level-await`, `build.target = 'esnext'` e `optimizeDeps.exclude = ['@automerge/automerge','@automerge/automerge-wasm']`.

---

## 📜 Licença

MIT. Use, remixe, escale como quiser. Sem garantias.
#
