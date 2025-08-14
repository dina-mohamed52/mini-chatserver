// server.js
// Minimal Socket.IO chat server with username/password login (in-memory storage).
// For training/demo only. Not production-safe (no hashing, no DB).

const express = require("express");
const http = require("http");
const cors = require("cors");
const { Server } = require("socket.io");

const PORT = process.env.PORT || 3000;

const app = express();
const server = http.createServer(app);

// Middleware
app.use(cors({ origin: "*"}));
app.use(express.json());

// In-memory stores (reset on restart)
/** @type {Record<string, { password: string, socketId: string | null }>} */
const users = {}; // username -> {password, socketId}

/** Simple health check */
app.get("/health", (_req, res) => { res.json({ ok: true, uptime: process.uptime() }); });

/** Register endpoint */
app.post("/register", (req, res) => {
  const { username, password } = req.body || {};
  if (!username || !password) return res.status(400).json({ error: "username and password are required" });
  if (users[username]) return res.status(409).json({ error: "username already exists" });
  users[username] = { password, socketId: null };
  console.log("✅ Registered:", username);
  res.json({ success: true });
});

/** Login endpoint */
app.post("/login", (req, res) => {
  const { username, password } = req.body || {};
  if (!username || !password) return res.status(400).json({ error: "username and password are required" });
  if (!users[username] || users[username].password !== password) {
    return res.status(401).json({ error: "invalid credentials" });
  }
  res.json({ success: true });
});

// Socket.IO
const io = new Server(server, {
  cors: { origin: "*", methods: ["GET","POST"] },
  transports: ["websocket", "polling"],
});

/** Helper to emit current online users */
function emitOnlineUsers() {
  const online = Object.entries(users)
    .filter(([_, v]) => v.socketId)
    .map(([k]) => k);
  io.emit("onlineUsers", online);
}

io.on("connection", (socket) => {
  console.log("🔌 Connected:", socket.id);

  // Client should emit join with the username after successful login
  socket.on("join", (username) => {
    if (!username || !users[username]) {
      socket.emit("errorMessage", "join refused: unknown username (register/login first)");
      return;
    }
    users[username].socketId = socket.id;
    socket.data.username = username;
    console.log(`👤 ${username} joined (${socket.id})`);
    emitOnlineUsers();
  });

  // Private message: { to: username, message: string }
  socket.on("privateMessage", ({ to, message }) => {
    const from = socket.data.username;
    if (!from) return socket.emit("errorMessage", "not joined");
    if (!to || typeof message !== "string") return;
    const target = users[to];
    if (target && target.socketId) {
      io.to(target.socketId).emit("receiveMessage", { from, message, ts: Date.now() });
    } else {
      // optionally queue or just notify sender
      socket.emit("errorMessage", `user ${to} is offline`);
    }
  });

  // Optional: broadcast to everyone (simple roomless chat)
  socket.on("broadcastMessage", ({ message }) => {
    const from = socket.data.username || "anonymous";
    if (typeof message === "string") {
      io.emit("receiveBroadcast", { from, message, ts: Date.now() });
    }
  });

  socket.on("disconnect", () => {
    const username = socket.data.username;
    if (username && users[username]?.socketId === socket.id) {
      users[username].socketId = null;
      console.log(`❌ Disconnected: ${username} (${socket.id})`);
      emitOnlineUsers();
    } else {
      console.log("❌ Disconnected:", socket.id);
    }
  });
});

server.listen(PORT, () => {
  console.log(`🚀 Server listening on port ${PORT}`);
});
