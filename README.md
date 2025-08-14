# MiniChat Socket.IO Server (Training)

A minimal Socket.IO chat backend with **username/password** login stored **in-memory** (for training only).

> ⚠️ Not for production (no password hashing, no persistence).

## Endpoints

- `POST /register` – body `{ "username": "Sara", "password": "1234" }`
- `POST /login` – body `{ "username": "Sara", "password": "1234" }`
- `GET /health` – health check

## Socket.IO Events

- Client emits: `join` with the logged-in `username`.
- Client emits: `privateMessage` with `{ to: "<username>", message: "<text>" }`.
- Server emits: `receiveMessage` with `{ from, message, ts }`.
- Server emits: `onlineUsers` with `string[]` of online usernames.
- Optional broadcast: emit `broadcastMessage` with `{ message }`, server emits `receiveBroadcast`.

## Run locally

```bash
npm install
npm start
# server on http://localhost:3000
```

## Connect from Postman (Socket.IO)

1. New → **WebSocket (Socket.IO)** request.
2. URL: `http://localhost:3000/`
3. Connect.
4. Send event `join` with raw JSON body `"Sara"` (or `{"data":"Sara"}` depending on Postman build).
5. Send event `privateMessage` with body:
```json
{ "to": "Omar", "message": "Hi!" }
```

> Tip: open two WebSocket tabs, join as two users, send messages between them.

## Deploy on Railway

1. Push this folder to GitHub.
2. On Railway → New Project → **Deploy from GitHub** → select your repo.
3. Add env var: `PORT=3000` (Railway will inject a random port; our server reads it).
4. Deploy. Copy the public URL, e.g. `https://your-app.up.railway.app`.
5. In your frontend, connect with:
```js
import { io } from "socket.io-client";
const socket = io("https://your-app.up.railway.app");
```


Happy hacking!
