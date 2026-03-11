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

const state = {
player: null,
canvas: null,
ctx: null,
renderX: 0,
renderY: 0,
message: ""
};

function byId(id) {
return document.getElementById(id);
}

function setText(id, value) {
const el = byId(id);
if (el) el.innerText = value;
}

function setMessage(text) {
state.message = text || "";
const el = byId("gameMessage");
if (el) el.innerText = state.message;
}

function getTile(x, y) {
if (y < 0 || y >= WORLD.length) return null;
if (x < 0 || x >= WORLD[0].length) return null;
return WORLD[y][x];
}

function updateStats(data) {
if (!data) return;

setText("playerName", data.username || "Player");

if (data.skills) {
setText("wood", data.skills.woodcutting ?? 1);
setText("fish", data.skills.fishing ?? 1);
setText("mine", data.skills.mining ?? 1);
}

if (data.inventory) {
setText("logs", data.inventory.logs ?? 0);
setText("fishInv", data.inventory.fish ?? 0);
setText("ore", data.inventory.ore ?? 0);
}

if (data.xp) {
setText("woodXp", data.xp.woodcutting ?? 0);
setText("fishXp", data.xp.fishing ?? 0);
setText("mineXp", data.xp.mining ?? 0);
}
}

function drawTile(x, y, tile) {
let px = x * TILE_SIZE;
let py = y * TILE_SIZE;

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

state.ctx.fillStyle = "#8b8b8b";
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

const px = state.renderX * TILE_SIZE;
const py = state.renderY * TILE_SIZE;

state.ctx.fillStyle = "#ffd166";
state.ctx.beginPath();
state.ctx.arc(px + 16, py + 16, 11, 0, Math.PI * 2);
state.ctx.fill();

state.ctx.fillStyle = "#111";
state.ctx.fillRect(px + 11, py + 12, 3, 3);
state.ctx.fillRect(px + 18, py + 12, 3, 3);
state.ctx.fillRect(px + 11, py + 19, 10, 2);
}

function renderXpDrops() {
for (let i = xpDrops.length - 1; i >= 0; i--) {
const drop = xpDrops[i];

drop.y -= 0.02;
drop.life--;

state.ctx.fillStyle = "#ffff66";
state.ctx.font = "bold 14px Arial";
state.ctx.fillText(
drop.text,
drop.x * TILE_SIZE + 2,
drop.y * TILE_SIZE
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

if (r.error) {
setMessage(r.error);
return;
}

state.player = r;
state.renderX = r.position.x;
state.renderY = r.position.y;

updateStats(r);
setMessage("Loaded character.");
}

async function startGame() {
const auth = byId("auth");
const game = byId("game");

if (auth) auth.style.display = "none";
if (game) game.style.display = "block";

state.canvas = byId("gameCanvas");
if (!state.canvas) {
setMessage("Canvas missing from page.");
return;
}

state.ctx = state.canvas.getContext("2d");
state.canvas.onclick = handleCanvasClick;

await loadPlayer();
}

async function moveTo(x, y) {
const r = await call("/move", { x, y });

if (r.error) {
setMessage(r.error);
return;
}

state.player = r;
updateStats(r);
setMessage("Moved.");
}

async function interact(skill, x, y) {
const r = await call("/action", { skill, x, y });

if (r.error) {
setMessage(r.error);
return;
}

state.player = r;
updateStats(r);

let text = "+10 XP";
let msg = "Action complete.";

if (skill === "woodcutting") {
text = "+10 WC XP";
msg = "Chopped tree.";
}

if (skill === "mining") {
text = "+10 Mining XP";
msg = "Mined rock.";
}

if (skill === "fishing") {
text = "+10 Fishing XP";
msg = "Caught fish.";
}

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

setMessage(msg);
}

async function handleCanvasClick(event) {
if (!state.canvas || !state.player) return;

const rect = state.canvas.getBoundingClientRect();

const scaleX = state.canvas.width / rect.width;
const scaleY = state.canvas.height / rect.height;

const clickX = (event.clientX - rect.left) * scaleX;
const clickY = (event.clientY - rect.top) * scaleY;

const tileX = Math.floor(clickX / TILE_SIZE);
const tileY = Math.floor(clickY / TILE_SIZE);

const tile = getTile(tileX, tileY);

if (!tile) {
setMessage("Out of bounds.");
return;
}

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
