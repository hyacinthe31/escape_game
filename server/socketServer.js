const express = require("express");
const http = require("http");
const { Server } = require("socket.io");

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: { origin: "*", methods: ["GET", "POST"] },
});

const rooms = {};

// ---- TIMER GLOBAL ----
let globalTimer = {
  startTime: null,
  interval: null,
  running: false,
};

// 🔹 Démarre le chrono global
function startGlobalTimer(io) {
  if (globalTimer.running) return;
  globalTimer.startTime = Date.now();
  globalTimer.running = true;

  globalTimer.interval = setInterval(() => {
    const elapsed = Math.floor((Date.now() - globalTimer.startTime) / 1000); // secondes
    io.emit("timer_update", elapsed);
  }, 1000);

  console.log("⏱️ Timer global démarré");
}

// 🔹 Stoppe le chrono global
function stopGlobalTimer(io) {
  if (!globalTimer.running) return;
  globalTimer.running = false;
  clearInterval(globalTimer.interval);
  const total = Math.floor((Date.now() - globalTimer.startTime) / 1000);
  io.emit("timer_stop", total);
  console.log(`⏹️ Timer global arrêté (temps final : ${total}s)`);
}

// 🔹 Ajoute une pénalité (recul du start → ajoute du temps)
function addPenalty(io, seconds) {
  if (!globalTimer.running) return;
  globalTimer.startTime -= seconds * 1000;
  io.emit("timer_penalty", seconds);
  console.log(`⚠️ +${seconds}s de pénalité appliquée`);
}

// ---- OUTILS EXISTANTS ----
function generateNeurons() {
  return Array.from({ length: 16 }).map((_, i) => ({
    id: i + 1,
    x: Math.random() * 550 + 25,
    y: Math.random() * 350 + 25,
  }));
}

function randomTargetBpm() {
  return Math.floor(Math.random() * 31) + 55; // 55..85
}

function ensureLungsMaze(roomObj) {
  if (roomObj.lungsMaze) return roomObj.lungsMaze;

  const layout = [
    "11111111111111111111",
    "10000000100000000001",
    "10111000101111111001",
    "10001000100000001001",
    "10101011101110101001",
    "10001000000010101001",
    "10111111111010101001",
    "10000000001010100001",
    "10111101111010111101",
    "10000101000010000001",
    "10110101011111111001",
    "11111111111111111111",
  ];

  const grid = layout.map(row => row.split("").map(c => (c === "1" ? 1 : 0)));
  const start = { x: 1, y: 1 };
  const freeCells = [];

  for (let y = 1; y < grid.length - 1; y++) {
    for (let x = 1; x < grid[0].length - 1; x++) {
      if (grid[y][x] === 0) freeCells.push({ x, y });
    }
  }

  const shuffled = freeCells.sort(() => Math.random() - 0.5);
  const obstructions = shuffled.slice(0, 3).map((p, i) => ({
    id: String.fromCharCode(65 + i),
    ...p,
  }));

  const maze = {
    grid,
    start,
    techPos: { ...start },
    obstructions,
    cleared: new Set(),
    clearing: null,
  };

  roomObj.lungsMaze = maze;
  return maze;
}

// ---- SOCKET.IO ----
io.on("connection", (socket) => {
  console.log("🧩 Nouveau joueur :", socket.id);

  socket.on("join_room", (room) => {
    if (!rooms[room]) {
      rooms[room] = {
        players: new Set(),
        roles: new Map(),
        neurons: generateNeurons(),
        heartTarget: null,
      };
    }

    const r = rooms[room];
    r.players.add(socket.id);
    socket.join(room);

    // Attribution des rôles
    let role = r.roles.get(socket.id);
    if (!role) {
      const rolesUsed = new Set(r.roles.values());
      if (!rolesUsed.has("medic")) role = "medic";
      else if (!rolesUsed.has("tech")) role = "tech";
      else role = "spectator";
      r.roles.set(socket.id, role);
    }

    socket.emit("role_assigned", role);
    socket.emit("neurons_data", r.neurons);

    const players = [...r.roles.values()].filter(
      (v) => v === "medic" || v === "tech"
    ).length;
    io.to(room).emit("player_joined", { players });

    console.log(`Room ${room}: ${players} joueurs`);
  });

  // 🕒 Démarre le chrono global au moment où la première salle se crée
  if (!globalTimer.running) startGlobalTimer(io);

  // ---- TIMER EVENTS ----
  socket.on("timer_start_request", () => startGlobalTimer(io));
  socket.on("timer_stop_request", () => stopGlobalTimer(io));
  socket.on("penalty_add", (sec = 5) => addPenalty(io, sec));

  // ---- PSEUDO ----
  socket.on("pseudo_chosen", ({ pseudo }) => {
    socket.to("patient-1").emit("medic_pseudo", pseudo);
  });

  // ---- ACTIONS ----
  socket.on("action", (data) => {
    socket.to(data.room).emit("update_state", data);
  });

  // ---- DÉCONNEXION ----
  socket.on("disconnect", () => {
    for (const [roomName, r] of Object.entries(rooms)) {
      if (r.players.delete(socket.id)) {
        r.roles.delete(socket.id);
        const players = [...r.roles.values()].filter(
          (v) => v === "medic" || v === "tech"
        ).length;
        io.to(roomName).emit("player_left", players);

        if (r.players.size === 0) {
          if (r.lungsSim?.timer) clearInterval(r.lungsSim.timer);
          delete rooms[roomName];
        }
      }
    }
  });

  // ---- CŒUR ----
  socket.on("heart_init", (room) => {
    if (!rooms[room]) return;
    const r = rooms[room];
    if (r.heartTarget == null) r.heartTarget = randomTargetBpm();

    const role = r.roles.get(socket.id);
    if (role === "medic") socket.emit("heart_target", r.heartTarget);
  });

  socket.on("heart_validate", ({ room, bpm }) => {
    if (!rooms[room]) return;
    const r = rooms[room];
    if (r.heartTarget == null) r.heartTarget = randomTargetBpm();

    const ok = Number(bpm) === Number(r.heartTarget);
    if (ok) {
      io.to(room).emit("heart_solved");
    } else {
      socket.emit("heart_wrong");
      addPenalty(io, 5); // ⚠️ pénalité si mauvais BPM
    }
  });

  // ---- POUMONS ----
  socket.on("lungs3_init", (room) => {
    if (!rooms[room]) return;
    const r = rooms[room];
    const maze = ensureLungsMaze(r);

    socket.emit("lungs3_bootstrap", {
      grid: maze.grid,
      start: maze.start,
      techPos: maze.techPos,
      obstructions: maze.obstructions,
      cleared: Array.from(maze.cleared),
      clearing: maze.clearing,
    });

    io.to(room).emit("lungs3_state", {
      techPos: maze.techPos,
      cleared: Array.from(maze.cleared),
      clearing: maze.clearing,
    });
  });

  socket.on("lungs3_move", ({ room, dir }) => {
    if (!rooms[room]) return;
    const r = rooms[room];
    const m = ensureLungsMaze(r);

    const DIRS = { up: [0, -1], down: [0, 1], left: [-1, 0], right: [1, 0] };
    const d = DIRS[dir];
    if (!d) return;

    const nx = m.techPos.x + d[0];
    const ny = m.techPos.y + d[1];
    if (ny < 0 || ny >= m.grid.length || nx < 0 || nx >= m.grid[0].length)
      return;
    if (m.grid[ny][nx] === 1) return;

    m.techPos = { x: nx, y: ny };
    m.clearing = null;

    io.to(room).emit("lungs3_state", {
      techPos: m.techPos,
      cleared: Array.from(m.cleared),
      clearing: m.clearing,
    });
  });

  socket.on("lungs3_hold", ({ room, holding }) => {
    if (!rooms[room]) return;
    const r = rooms[room];
    const m = ensureLungsMaze(r);

    const here = m.obstructions.find(
      (o) => o.x === m.techPos.x && o.y === m.techPos.y && !m.cleared.has(o.id)
    );

    if (!holding) {
      m.clearing = null;
      io.to(room).emit("lungs3_state", {
        techPos: m.techPos,
        cleared: Array.from(m.cleared),
        clearing: null,
      });
      return;
    }

    if (!here) {
      m.clearing = null;
      io.to(room).emit("lungs3_state", {
        techPos: m.techPos,
        cleared: Array.from(m.cleared),
        clearing: null,
      });
      return;
    }

    if (!m.clearing || m.clearing.id !== here.id) {
      m.clearing = { id: here.id, startTime: Date.now() };
    }

    const elapsed = Date.now() - m.clearing.startTime;
    const needed = 1500;

    if (elapsed < needed) {
      io.to(room).emit("lungs3_state", {
        techPos: m.techPos,
        cleared: Array.from(m.cleared),
        clearing: { id: here.id, progress: elapsed / needed },
      });
      return;
    }

    // ✅ Obstruction retirée
    m.cleared.add(here.id);
    m.clearing = null;

    io.to(room).emit("lungs3_state", {
      techPos: { ...m.techPos },
      cleared: Array.from(m.cleared),
      clearing: null,
    });

    // Check si tout est fini
    if (m.cleared.size >= m.obstructions.length) {
      io.to(room).emit("lungs3_solved");
      stopGlobalTimer(io);
    }
  });
});

const PORT = process.env.PORT || 4000;
server.listen(PORT, () =>
  console.log(`✅ Socket server running on port ${PORT}`)
);



