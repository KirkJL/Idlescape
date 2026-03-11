const TILE_SIZE = 32;

const WORLD = [
  "GGGGGGGGGGGGGGGGGGGG",
  "GGGGGGGGGTGGGGGGGGGG",
  "GGGGGGGGGGGGGGWGGGGG",
  "GGGGTRGGGGGGGGWGGGGG",
  "GGGGGGGGGGGGGGWGGGGG",
  "GGGGGGGGGGGGGGWGGGGG",
  "GGGGGGGGRGGGGGGGGGGG",
  "GGGGGGGGGGGGGGGGGGGG",
  "GGGGGGGGGGGTGGGGGGGG",
  "GGGGWGGGGGGGGGGGGGGG",
  "GGGGWGGGGGRGGGGGGGGG",
  "GGGGWGGGGGGGGGGGGGGG",
  "GGGGWGGGTGGGGGGGGGGG",
  "GGGGGGGGGGGGGGGGGGGG"
];

const state = {
  player: null,
  canvas: null,
  ctx: null
};

function isWalkable(tile) {
  return tile === "G";
}

function setGameMessage(text) {
  const el = document.getElementById("gameMessage");
  if (el) el.innerText = text || "";
}

function getTile(x, y) {
  if (y < 0 || y >= WORLD.length) return null;
  if (x < 0 || x >= WORLD[0].length) return null;
  return WORLD[y][x];
}

function updateStats(data) {
  document.getElementById("playerName").innerText = data.username;
  document.getElementById("wood").innerText = data.skills.woodcutting;
  document.getElementById("fish").innerText = data.skills.fishing;
  document.getElementById("mine").innerText = data.skills.mining;

  document.getElementById("logs").innerText = data.inventory.logs;
  document.getElementById("fishInv").innerText = data.inventory.fish;
  document.getElementById("ore").innerText = data.inventory.ore;

  document.getElementById("woodXp").innerText = data.xp.woodcutting;
  document.getElementById("fishXp").innerText = data.xp.fishing;
  document.getElementById("mineXp").innerText = data.xp.mining;
}

function drawTile(x, y, tile) {
  const px = x * TILE_SIZE;
  const py = y * TILE_SIZE;

  if (tile === "G") {
    state.ctx.fillStyle = "#2ea043";
    state.ctx.fillRect(px, py, TILE_SIZE, TILE_SIZE);
    state.ctx.strokeStyle = "rgba(0,0,0,0.08)";
    state.ctx.strokeRect(px, py, TILE_SIZE, TILE_SIZE);
    return;
  }

  if (tile === "T") {
    state.ctx.fillStyle = "#2ea043";
    state.ctx.fillRect(px, py, TILE_SIZE, TILE_SIZE);
    state.ctx.fillStyle = "#5c3b1e";
    state.ctx.fillRect(px + 12, py + 12, 8, 16);
    state.ctx.fillStyle = "#1f6f3d";
    state.ctx.beginPath();
    state.ctx.arc(px + 16, py + 11, 10, 0, Math.PI * 2);
    state.ctx.fill();
    return;
  }

  if (tile === "R") {
    state.ctx.fillStyle = "#2ea043";
    state.ctx.fillRect(px, py, TILE_SIZE, TILE_SIZE);
    state.ctx.fillStyle = "#8b949e";
    state.ctx.beginPath();
    state.ctx.arc(px + 16, py + 16, 11, 0, Math.PI * 2);
    state.ctx.fill();
    return;
  }

  if (tile === "W") {
    state.ctx.fillStyle = "#1f6feb";
    state.ctx.fillRect(px, py, TILE_SIZE, TILE_SIZE);
    state.ctx.fillStyle = "rgba(255,255,255,0.15)";
    state.ctx.fillRect(px, py + 8, TILE_SIZE, 4);
    state.ctx.fillRect(px, py + 20, TILE_SIZE, 4);
  }
}

function drawPlayer() {
  if (!state.player) return;

  const px = state.player.position.x * TILE_SIZE;
  const py = state.player.position.y * TILE_SIZE;

  state.ctx.fillStyle = "#f2cc60";
  state.ctx.beginPath();
  state.ctx.arc(px + 16, py + 16, 10, 0, Math.PI * 2);
  state.ctx.fill();

  state.ctx.fillStyle = "#0d1117";
  state.ctx.fillRect(px + 12, py + 12, 3, 3);
  state.ctx.fillRect(px + 17, py + 12, 3, 3);
}

function render() {
  if (!state.ctx) return;

  state.ctx.clearRect(0, 0, state.canvas.width, state.canvas.height);

  for (let y = 0; y < WORLD.length; y++) {
    for (let x = 0; x < WORLD[y].length; x++) {
      drawTile(x, y, WORLD[y][x]);
    }
  }

  drawPlayer();
}

async function loadPlayer() {
  const r = await call("/player", {});

  if (r.error) {
    localStorage.removeItem("token");
    location.reload();
    return;
  }

  state.player = r;
  updateStats(r);
  render();
}

async function startGame() {
  document.getElementById("auth").classList.add("hidden");
  document.getElementById("game").classList.remove("hidden");

  state.canvas = document.getElementById("gameCanvas");
  state.ctx = state.canvas.getContext("2d");

  state.canvas.onclick = handleCanvasClick;

  await loadPlayer();
  setGameMessage("Tap nearby grass to move. Tap nearby resources to train.");
}

async function moveTo(x, y) {
  const r = await call("/move", { x, y });

  if (r.error) {
    setGameMessage(r.error);
    return;
  }

  state.player = r;
  updateStats(r);
  render();
  setGameMessage("Moved.");
}

async function moveBy(dx, dy) {
  if (!state.player) return;

  const x = state.player.position.x + dx;
  const y = state.player.position.y + dy;

  await moveTo(x, y);
}

async function interact(skill, x, y) {
  const r = await call("/action", { skill, x, y });

  if (r.error) {
    setGameMessage(r.error);
    return;
  }

  state.player = r;
  updateStats(r);
  render();

  if (skill === "woodcutting") setGameMessage("+10 Woodcutting XP");
  if (skill === "fishing") setGameMessage("+10 Fishing XP");
  if (skill === "mining") setGameMessage("+10 Mining XP");
}

async function handleCanvasClick(event) {
  if (!state.player || !state.canvas) return;

  const rect = state.canvas.getBoundingClientRect();
  const scaleX = state.canvas.width / rect.width;
  const scaleY = state.canvas.height / rect.height;

  const clickX = (event.clientX - rect.left) * scaleX;
  const clickY = (event.clientY - rect.top) * scaleY;

  const tileX = Math.floor(clickX / TILE_SIZE);
  const tileY = Math.floor(clickY / TILE_SIZE);
  const tile = getTile(tileX, tileY);

  if (!tile) return;

  if (tile === "G") {
    await moveTo(tileX, tileY);
    return;
  }

  if (tile === "T") {
    await interact("woodcutting", tileX, tileY);
    return;
  }

  if (tile === "R") {
    await interact("mining", tileX, tileY);
    return;
  }

  if (tile === "W") {
    await interact("fishing", tileX, tileY);
  }
}

window.onload = async function () {
  const token = localStorage.getItem("token");
  if (token) {
    await startGame();
  }
};
