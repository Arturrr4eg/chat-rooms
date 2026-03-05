const express = require("express");
const cors = require("cors");
const jwt = require("jsonwebtoken");
const { WebSocketServer, WebSocket } = require("ws");

const app = express();
app.use(cors());
app.use(express.json());

const PORT = Number(process.env.PORT ?? 4000);
const JWT_SECRET = process.env.JWT_SECRET;

if (!JWT_SECRET) {
  throw new Error("JWT_SECRET is required");
}

let users = [];
let rooms = [];

function roomExists(roomId) {
  return rooms.some((room) => room.id === roomId);
}

function extractBearerToken(header) {
  if (!header) return null;

  const [type, token] = header.split(" ");
  if (type !== "Bearer" || !token) return null;

  return token;
}

function findUserByToken(token) {
  try {
    const payload = jwt.verify(token, JWT_SECRET);
    return users.find((u) => u.id === payload.userId) ?? null;
  } catch {
    return null;
  }
}

function auth(req, res, next) {
  const token = extractBearerToken(req.headers.authorization);

  if (!token) {
    return res.status(401).json({ message: "Invalid Authorization format" });
  }

  const user = findUserByToken(token);

  if (!user) {
    return res.status(401).json({ message: "Invalid token" });
  }

  req.user = user;
  next();
}

app.post("/auth/login", (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ message: "email and password required" });
  }

  let user = users.find((u) => u.email === email);

  if (!user) {
    user = { id: crypto.randomUUID(), email };
    users.push(user);
  }

  const accessToken = jwt.sign({ userId: user.id }, JWT_SECRET, { expiresIn: "2h" });

  res.json({ accessToken, user: { id: user.id, email: user.email } });
});

app.get("/rooms", auth, (req, res) => {
  res.json(rooms);
});

app.post("/rooms", auth, (req, res) => {
  const { name } = req.body;
  if (!name || typeof name !== "string") {
    return res.status(400).json({ message: "name required" });
  }

  const room = {
    id: crypto.randomUUID(),
    name,
    createdBy: req.user.email,
  };

  rooms.push(room);

  res.status(201).json(room);
});

app.use((req, res) => {
  res.status(404).json({ message: `Route not found: ${req.method} ${req.path}` });
});

app.use((err, req, res, next) => {
  const message = err instanceof Error ? err.message : "Unknown error";
  res.status(500).json({ message });
});

const server = app.listen(PORT, () => {
  console.log(`REST server: http://localhost:${PORT}`);
});

const wss = new WebSocketServer({ server });
const messagesByRoom = new Map();

wss.on("connection", (ws, req) => {
  const requestUrl = new URL(req.url, `http://${req.headers.host}`);
  const token = requestUrl.searchParams.get("token");
  const user = token ? findUserByToken(token) : null;

  if (!user) {
    ws.close(1008, "Unauthorized");
    return;
  }

  ws.user = user;
  ws.currentRoomId = null;

  ws.on("message", (raw) => {
    let data;

    try {
      data = JSON.parse(raw.toString());
    } catch {
      ws.send(JSON.stringify({ type: "error", message: "Invalid JSON" }));
      return;
    }

    if (data.type === "send_message") {
      const { roomId, text } = data.payload ?? {};

      if (!roomId || typeof roomId !== "string") return;
      if (!text || typeof text !== "string") return;
      if (!roomExists(roomId)) {
        ws.send(JSON.stringify({ type: "error", message: "Room not found" }));
        return;
      }
      if (ws.currentRoomId !== roomId) {
        ws.send(JSON.stringify({ type: "error", message: "Join room first" }));
        return;
      }

      const msg = {
        id: crypto.randomUUID(),
        roomId,
        text,
        senderEmail: ws.user.email,
        createdAt: new Date().toISOString(),
      };

      const list = messagesByRoom.get(roomId) ?? [];
      list.push(msg);
      messagesByRoom.set(roomId, list);

      const out = JSON.stringify({ type: "message", payload: msg });

      wss.clients.forEach((client) => {
        if (client.readyState === WebSocket.OPEN && client.currentRoomId === roomId) {
          client.send(out);
        }
      });
    }

    if (data.type === "get_room_messages") {
      const { roomId } = data.payload ?? {};
      if (!roomId || typeof roomId !== "string") return;
      if (!roomExists(roomId)) {
        ws.send(JSON.stringify({ type: "error", message: "Room not found" }));
        return;
      }

      ws.currentRoomId = roomId;
      const list = messagesByRoom.get(roomId) ?? [];
      ws.send(JSON.stringify({ type: "room_messages", payload: { roomId, messages: list } }));
    }
  });
});
