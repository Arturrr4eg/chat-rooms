const express = require("express");
const cors = require("cors");
const jwt = require("jsonwebtoken");
const { WebSocketServer, WebSocket } = require("ws");
const { randomUUID, randomBytes, scryptSync, timingSafeEqual } = require("node:crypto");
const fs = require("node:fs");
const path = require("node:path");

function loadEnvFile() {
  const envPath = path.join(__dirname, ".env");

  if (!fs.existsSync(envPath)) return;

  const content = fs.readFileSync(envPath, "utf8");
  const lines = content.split(/\r?\n/);

  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;

    const separatorIndex = trimmed.indexOf("=");
    if (separatorIndex < 1) continue;

    const key = trimmed.slice(0, separatorIndex).trim();
    let value = trimmed.slice(separatorIndex + 1).trim();

    if (
      (value.startsWith("\"") && value.endsWith("\"")) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }

    if (process.env[key] === undefined) {
      process.env[key] = value;
    }
  }
}

loadEnvFile();

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

function normalizeEmail(email) {
  return email.trim().toLowerCase();
}

function normalizeUsername(username) {
  return username.trim().toLowerCase();
}

function isValidUsername(username) {
  return /^[a-zA-Z0-9_]{3,20}$/.test(username);
}

function hashPassword(password) {
  const salt = randomBytes(16).toString("hex");
  const hash = scryptSync(password, salt, 64).toString("hex");

  return { salt, hash };
}

function verifyPassword(password, user) {
  if (!user?.passwordSalt || !user?.passwordHash) return false;

  const calculatedHash = scryptSync(password, user.passwordSalt, 64);
  const storedHash = Buffer.from(user.passwordHash, "hex");

  if (calculatedHash.length !== storedHash.length) return false;

  return timingSafeEqual(calculatedHash, storedHash);
}

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

app.post("/auth/register", (req, res) => {
  const { email, password, username } = req.body;

  if (typeof email !== "string" || typeof password !== "string" || typeof username !== "string") {
    return res.status(400).json({ message: "email, password and username required" });
  }

  const normalizedEmail = normalizeEmail(email);

  if (!normalizedEmail.includes("@")) {
    return res.status(400).json({ message: "Invalid email format" });
  }

  if (password.length < 8) {
    return res.status(400).json({ message: "Password must be at least 8 characters" });
  }

  if (!isValidUsername(username)) {
    return res.status(400).json({
      message: "Username must be 3-20 chars and contain only letters, numbers or underscore",
    });
  }

  const normalizedUsername = normalizeUsername(username);

  const existingUser = users.find((u) => u.email === normalizedEmail);
  if (existingUser) {
    return res.status(409).json({ message: "User already exists" });
  }

  const existingUsername = users.find((u) => u.usernameNormalized === normalizedUsername);
  if (existingUsername) {
    return res.status(409).json({ message: "Username is already taken" });
  }

  const { salt, hash } = hashPassword(password);

  const user = {
    id: randomUUID(),
    email: normalizedEmail,
    username: username.trim(),
    usernameNormalized: normalizedUsername,
    passwordSalt: salt,
    passwordHash: hash,
  };

  users.push(user);

  const accessToken = jwt.sign({ userId: user.id }, JWT_SECRET, { expiresIn: "2h" });

  res.status(201).json({
    accessToken,
    user: { id: user.id, email: user.email, username: user.username },
  });
});

app.post("/auth/login", (req, res) => {
  const { email, password } = req.body;

  if (typeof email !== "string" || typeof password !== "string") {
    return res.status(400).json({ message: "email and password required" });
  }

  const normalizedEmail = normalizeEmail(email);
  const user = users.find((u) => u.email === normalizedEmail);

  if (!user || !verifyPassword(password, user)) {
    return res.status(401).json({ message: "Invalid credentials" });
  }

  const accessToken = jwt.sign({ userId: user.id }, JWT_SECRET, { expiresIn: "2h" });

  res.json({ accessToken, user: { id: user.id, email: user.email, username: user.username } });
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
    id: randomUUID(),
    name,
    createdBy: req.user.username,
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
const joinedUsersByRoom = new Map();

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
        id: randomUUID(),
        roomId,
        text,
        senderUsername: ws.user.username,
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
      const joinedUsers = joinedUsersByRoom.get(roomId) ?? new Set();
      const isFirstJoinForUser = !joinedUsers.has(ws.user.id);

      if (isFirstJoinForUser) {
        joinedUsers.add(ws.user.id);
        joinedUsersByRoom.set(roomId, joinedUsers);

        const joinMessage = {
          id: randomUUID(),
          roomId,
          text: `${ws.user.username} joined the chat`,
          senderUsername: "System",
          createdAt: new Date().toISOString(),
        };

        const existingMessages = messagesByRoom.get(roomId) ?? [];
        existingMessages.push(joinMessage);
        messagesByRoom.set(roomId, existingMessages);
      }

      const list = messagesByRoom.get(roomId) ?? [];
      ws.send(JSON.stringify({ type: "room_messages", payload: { roomId, messages: list } }));
    }

    if (data.type === "leave_room") {
      ws.currentRoomId = null;
    }
  });
});
