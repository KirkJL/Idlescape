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

const state = {
player:null,
canvas:null,
ctx:null,
renderX:0,
renderY:0
};

function getTile(x,y){

if(y<0 || y>=WORLD.length) return null;
if(x<0 || x>=WORLD[0].length) return null;

return WORLD[y][x];

}

function updateStats(data){

document.getElementById("wood").innerText = data.skills.woodcutting;
document.getElementById("fish").innerText = data.skills.fishing;
document.getElementById("mine").innerText = data.skills.mining;

document.getElementById("logs").innerText = data.inventory.logs;
document.getElementById("fishInv").innerText = data.inventory.fish;
document.getElementById("ore").innerText = data.inventory.ore;

document.getElementById("woodXp").innerText = data.xp.woodcutting;
document.getElementById("fishXp").innerText = data.xp.fishing;
document.getElementById("mineXp").innerText = data.xp.mining;

document.getElementById("playerName").innerText = data.username;

}

function drawTile(x,y,tile){

let px = x*TILE_SIZE;
let py = y*TILE_SIZE;

if(tile==="G"){
state.ctx.fillStyle="#2ea043";
state.ctx.fillRect(px,py,TILE_SIZE,TILE_SIZE);
}

if(tile==="T"){
state.ctx.fillStyle="#2ea043";
state.ctx.fillRect(px,py,TILE_SIZE,TILE_SIZE);

state.ctx.fillStyle="#5c3b1e";
state.ctx.fillRect(px+12,py+12,8,16);

state.ctx.fillStyle="#1f6f3d";
state.ctx.beginPath();
state.ctx.arc(px+16,py+10,10,0,Math.PI*2);
state.ctx.fill();
}

if(tile==="R"){
state.ctx.fillStyle="#2ea043";
state.ctx.fillRect(px,py,TILE_SIZE,TILE_SIZE);

state.ctx.fillStyle="#888";
state.ctx.beginPath();
state.ctx.arc(px+16,py+16,10,0,Math.PI*2);
state.ctx.fill();
}

if(tile==="W"){
state.ctx.fillStyle="#1f6feb";
state.ctx.fillRect(px,py,TILE_SIZE,TILE_SIZE);
}

}

function drawPlayer(){

if(!state.player) return;

state.renderX += (state.player.position.x - state.renderX)*0.2;
state.renderY += (state.player.position.y - state.renderY)*0.2;

let px = state.renderX*TILE_SIZE;
let py = state.renderY*TILE_SIZE;

state.ctx.fillStyle="#ffd166";

state.ctx.beginPath();
state.ctx.arc(px+16,py+16,10,0,Math.PI*2);
state.ctx.fill();

}

function renderXpDrops(){

for(let i=xpDrops.length-1;i>=0;i--){

let drop = xpDrops[i];

drop.y -= 0.02;
drop.life--;

state.ctx.fillStyle="#ffff66";
state.ctx.font="14px Arial";

state.ctx.fillText(
drop.text,
drop.x*TILE_SIZE,
drop.y*TILE_SIZE
);

if(drop.life<=0){
xpDrops.splice(i,1);
}

}

}

function render(){

if(!state.ctx) return;

state.ctx.clearRect(0,0,state.canvas.width,state.canvas.height);

for(let y=0;y<WORLD.length;y++){
for(let x=0;x<WORLD[y].length;x++){

drawTile(x,y,WORLD[y][x]);

}
}

drawPlayer();

renderXpDrops();

}

async function loadPlayer(){

const r = await call("/player",{});

state.player = r;

state.renderX = r.position.x;
state.renderY = r.position.y;

updateStats(r);

}

async function startGame(){

document.getElementById("auth").style.display="none";
document.getElementById("game").style.display="block";

state.canvas = document.getElementById("gameCanvas");
state.ctx = state.canvas.getContext("2d");

state.canvas.onclick = handleCanvasClick;

await loadPlayer();

}

async function moveTo(x,y){

const r = await call("/move",{x,y});

if(r.error) return;

state.player = r;

updateStats(r);

}

async function interact(skill,x,y){

const r = await call("/action",{skill,x,y});

if(r.error) return;

state.player = r;

updateStats(r);

xpDrops.push({
x:state.player.position.x,
y:state.player.position.y,
text:"+10 XP",
life:60
});

}

async function handleCanvasClick(event){

const rect = state.canvas.getBoundingClientRect();

let clickX = event.clientX - rect.left;
let clickY = event.clientY - rect.top;

let tileX = Math.floor(clickX/TILE_SIZE);
let tileY = Math.floor(clickY/TILE_SIZE);

let tile = getTile(tileX,tileY);

if(tile==="G"){
await moveTo(tileX,tileY);
}

if(tile==="T"){
await interact("woodcutting",tileX,tileY);
}

if(tile==="R"){
await interact("mining",tileX,tileY);
}

if(tile==="W"){
await interact("fishing",tileX,tileY);
}

}

function moveBy(dx,dy){

if(!state.player) return;

let x = state.player.position.x + dx;
let y = state.player.position.y + dy;

moveTo(x,y);

}

function gameLoop(){

render();

requestAnimationFrame(gameLoop);

}

window.onload = function(){

const token = localStorage.getItem("token");

if(token){
startGame();
}

gameLoop();

}
