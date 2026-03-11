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

let xpDrops = [];
let shakeTiles = [];

const sounds = {
wood: new Audio("https://assets.mixkit.co/active_storage/sfx/2571/2571-preview.mp3"),
mine: new Audio("https://assets.mixkit.co/active_storage/sfx/2053/2053-preview.mp3"),
fish: new Audio("https://assets.mixkit.co/active_storage/sfx/2041/2041-preview.mp3")
};

const state = {
player: null,
canvas: null,
ctx: null,
renderX: 0,
renderY: 0,
cameraX: 0,
cameraY: 0
};

function getTile(x, y) {
if (y < 0 || y >= WORLD.length) return null;
if (x < 0 || x >= WORLD[0].length) return null;
return WORLD[y][x];
}

function updateStats(data) {
if (!data || !data.skills || !data.inventory || !data.xp) return;

document.getElementById("wood").innerText = data.skills.woodcutting;
document.getElementById("fish").innerText = data.skills.fishing;
document.getElementById("mine").innerText = data.skills.mining;

document.getElementById("logs").innerText = data.inventory.logs;
document.getElementById("fishInv").innerText = data.inventory.fish;
document.getElementById("ore").innerText = data.inventory.ore;

document.getElementById("woodXp").innerText = data.xp.woodcutting;
document.getElementById("fishXp").innerText = data.xp.fishing;
document.getElementById("mineXp").innerText = data.xp.mining;

document.getElementById("playerName").innerText = data.username || "Player";
}

function drawTile(x, y, tile) {
let px = x * TILE_SIZE - state.cameraX;
let py = y * TILE_SIZE - state.cameraY;

const shake = shakeTiles.find(t => t.x === x && t.y === y);
if (shake) {
px += Math.random() * 4 - 2;
py += Math.random() * 4 - 2;
}

if (tile === "G") {
state.ctx.fillStyle = "#2ea043";
state.ctx.fillRect(px, py, TILE_SIZE, TILE_SIZE);
state.ctx.strokeStyle = "rgba(0,0,0,0.08)";
state.ctx.strokeRect(px, py, TILE_SIZE, TILE_SIZE);
}

if (tile === "T") {
state.ctx.fillStyle = "#2ea043";
state.ctx.fillRect(px, py, TILE_SIZE, TILE_SIZE);

state.ctx.fillStyle = "#5c3b1e";
state.ctx.fillRect(px + 12, py + 12, 8, 16);

state.ctx.fillStyle = "#1f6f3d";
state.ctx.beginPath();
state.ctx.arc(px + 16, py + 10, 10, 0, Math.PI * 2);
state.ctx.fill();
}

if (tile === "R") {
state.ctx.fillStyle = "#2ea043";
state.ctx.fillRect(px, py, TILE_SIZE, TILE_SIZE);

state.ctx.fillStyle = "#888";
state.ctx.beginPath();
state.ctx.arc(px + 16, py + 16, 10, 0, Math.PI * 2);
state.ctx.fill();
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

state.renderX += (state.player.position.x - state.renderX) * 0.2;
state.renderY += (state.player.position.y - state.renderY) * 0.2;

state.cameraX = state.renderX * TILE_SIZE - state.canvas.width / 2 + TILE_SIZE / 2;
state.cameraY = state.renderY * TILE_SIZE - state.canvas.height / 2 + TILE_SIZE / 2;

let px = state.renderX * TILE_SIZE - state.cameraX;
let py = state.renderY * TILE_SIZE - state.cameraY;

state.ctx.fillStyle = "#ffd166";
state.ctx.beginPath();
state.ctx.arc(px + 16, py + 16, 10, 0, Math.PI * 2);
state.ctx.fill();

state.ctx.fillStyle = "#111";
state.ctx.fillRect(px + 12, py + 13, 2, 2);
state.ctx.fillRect(px + 18, py + 13, 2, 2);
state.ctx.fillRect(px + 13, py + 18, 6, 2);
}

function renderXpDrops() {
for (let i = xpDrops.length - 1; i >= 0; i--) {
const drop = xpDrops[i];

drop.y -= 0.02;
drop.life--;

state.ctx.fillStyle = "#ffff66";
state.ctx.font = "14px Arial";
state.ctx.fillText(
drop.text,
drop.x * TILE_SIZE - state.cameraX + 2,
drop.y * TILE_SIZE - state.cameraY
);

if (drop.life <= 0) {
xpDrops.splice(i, 1);
}
}
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
renderXpDrops();
}

async function loadPlayer() {
const r = await call("/player", {});

if (r.error) return;

state.player = r;
state.renderX = r.position.x;
state.renderY = r.position.y;

updateStats(r);
}

async function startGame() {
document.getElementById("auth").style.display = "none";
document.getElementById("game").style.display = "block";

state.canvas = document.getElementById("gameCanvas");
state.ctx = state.canvas.getContext("2d");

state.canvas.onclick = handleCanvasClick;

await loadPlayer();
}

async function moveTo(x, y) {
const r = await call("/move", { x, y });

if (r.error) return;

state.player = r;
updateStats(r);
}

function safePlay(sound) {
try {
sound.currentTime = 0;
const p = sound.play();
if (p && typeof p.catch === "function") {
p.catch(() => {});
}
} catch {}
}

async function interact(skill, x, y) {
const r = await call("/action", { skill, x, y });

if (r.error) return;

state.player = r;
updateStats(r);

let text = "+10 XP";
if (skill === "woodcutting") text = "+10 WC XP";
if (skill === "mining") text = "+10 Mining XP";
if (skill === "fishing") text = "+10 Fishing XP";

xpDrops.push({
x: state.player.position.x,
y: state.player.position.y,
text,
life: 60
});

shakeTiles.push({
x,
y,
life: 20
});

if (skill === "woodcutting") safePlay(sounds.wood);
if (skill === "mining") safePlay(sounds.mine);
if (skill === "fishing") safePlay(sounds.fish);
}

async function handleCanvasClick(event) {
if (!state.canvas) return;

const rect = state.canvas.getBoundingClientRect();

const scaleX = state.canvas.width / rect.width;
const scaleY = state.canvas.height / rect.height;

const clickX = (event.clientX - rect.left) * scaleX;
const clickY = (event.clientY - rect.top) * scaleY;

const tileX = Math.floor((clickX + state.cameraX) / TILE_SIZE);
const tileY = Math.floor((clickY + state.cameraY) / TILE_SIZE);

const tile = getTile(tileX, tileY);

if (tile === "G") await moveTo(tileX, tileY);
if (tile === "T") await interact("woodcutting", tileX, tileY);
if (tile === "R") await interact("mining", tileX, tileY);
if (tile === "W") await interact("fishing", tileX, tileY);
}

function moveBy(dx, dy) {
if (!state.player) return;

const x = state.player.position.x + dx;
const y = state.player.position.y + dy;

moveTo(x, y);
}

function updateEffects() {
for (let i = shakeTiles.length - 1; i >= 0; i--) {
shakeTiles[i].life--;
if (shakeTiles[i].life <= 0) {
shakeTiles.splice(i, 1);
}
}
}

function gameLoop() {
updateEffects();
render();
requestAnimationFrame(gameLoop);
}

window.onload = function() {
const token = localStorage.getItem("token");

if (token) {
startGame();
}

gameLoop();
};
