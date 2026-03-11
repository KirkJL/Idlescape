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
wood:new Audio("https://assets.mixkit.co/active_storage/sfx/2571/2571-preview.mp3"),
mine:new Audio("https://assets.mixkit.co/active_storage/sfx/2053/2053-preview.mp3"),
fish:new Audio("https://assets.mixkit.co/active_storage/sfx/2041/2041-preview.mp3")
};

Object.values(sounds).forEach(s=>{
s.volume=0.35;
});

const state={
player:null,
canvas:null,
ctx:null,
renderX:0,
renderY:0,
anim:"idle",
animTimer:0
};

function byId(id){
return document.getElementById(id);
}

function setText(id,val){
const el=byId(id);
if(el) el.innerText=val;
}

function playSound(sound){
try{
sound.currentTime=0;
sound.play();
}catch{}
}

function getTile(x,y){
if(y<0||y>=WORLD.length) return null;
if(x<0||x>=WORLD[0].length) return null;
return WORLD[y][x];
}

function updateStats(data){

setText("playerName",data.username);

setText("wood",data.skills.woodcutting);
setText("fish",data.skills.fishing);
setText("mine",data.skills.mining);

setText("logs",data.inventory.logs);
setText("fishInv",data.inventory.fish);
setText("ore",data.inventory.ore);

setText("woodXp",data.xp.woodcutting);
setText("fishXp",data.xp.fishing);
setText("mineXp",data.xp.mining);

}

function drawTile(x,y,tile){

let px=x*TILE_SIZE;
let py=y*TILE_SIZE;

const shake=shakeTiles.find(t=>t.x===x&&t.y===y);

if(shake){
px+=Math.random()*4-2;
py+=Math.random()*4-2;
}

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

state.renderX+=(state.player.position.x-state.renderX)*0.2;
state.renderY+=(state.player.position.y-state.renderY)*0.2;

let px=state.renderX*TILE_SIZE;
let py=state.renderY*TILE_SIZE;

if(state.anim==="walk"){
py+=Math.sin(Date.now()*0.02)*2;
}

if(state.anim==="skill"){
py+=Math.sin(Date.now()*0.04)*4;
}

state.ctx.fillStyle="#ffd166";
state.ctx.beginPath();
state.ctx.arc(px+16,py+16,11,0,Math.PI*2);
state.ctx.fill();

state.ctx.fillStyle="#111";
state.ctx.fillRect(px+11,py+12,3,3);
state.ctx.fillRect(px+18,py+12,3,3);
state.ctx.fillRect(px+11,py+19,10,2);

}

function renderXpDrops(){

for(let i=xpDrops.length-1;i>=0;i--){

const drop=xpDrops[i];

drop.y-=0.02;
drop.life--;

state.ctx.fillStyle="#ffff66";
state.ctx.font="bold 14px Arial";

state.ctx.fillText(
drop.text,
drop.x*TILE_SIZE+2,
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

const r=await call("/player",{});

state.player=r;

state.renderX=r.position.x;
state.renderY=r.position.y;

updateStats(r);

}

async function startGame(){

byId("auth").style.display="none";
byId("game").style.display="block";

state.canvas=byId("gameCanvas");
state.ctx=state.canvas.getContext("2d");

state.canvas.onclick=handleCanvasClick;

await loadPlayer();

}

async function moveTo(x,y){

const r=await call("/move",{x,y});

if(!r.error){

state.player=r;

state.anim="walk";
state.animTimer=15;

updateStats(r);

}

}

async function interact(skill,x,y){

const r=await call("/action",{skill,x,y});

if(!r.error){

state.player=r;

state.anim="skill";
state.animTimer=30;

updateStats(r);

let text="+10 XP";

if(skill==="woodcutting") text="+10 WC XP";
if(skill==="mining") text="+10 Mining XP";
if(skill==="fishing") text="+10 Fishing XP";

xpDrops.push({
x:state.player.position.x,
y:state.player.position.y,
text,
life:60
});

shakeTiles.push({x,y,life:20});

}

}

async function walkPath(targetX,targetY){

let px=state.player.position.x;
let py=state.player.position.y;

while(px!==targetX||py!==targetY){

let dx=targetX-px;
let dy=targetY-py;

let stepX=px;
let stepY=py;

if(Math.abs(dx)>Math.abs(dy)){
stepX+=Math.sign(dx);
}else if(dy!==0){
stepY+=Math.sign(dy);
}

await moveTo(stepX,stepY);

px=stepX;
py=stepY;

await new Promise(r=>setTimeout(r,120));

}

}

async function handleCanvasClick(event){

const rect=state.canvas.getBoundingClientRect();

const scaleX=state.canvas.width/rect.width;
const scaleY=state.canvas.height/rect.height;

const clickX=(event.clientX-rect.left)*scaleX;
const clickY=(event.clientY-rect.top)*scaleY;

const tileX=Math.floor(clickX/TILE_SIZE);
const tileY=Math.floor(clickY/TILE_SIZE);

const tile=getTile(tileX,tileY);

if(!tile) return;

if(tile==="G"){
await walkPath(tileX,tileY);
}

if(tile==="T"){
playSound(sounds.wood);
await interact("woodcutting",tileX,tileY);
}

if(tile==="R"){
playSound(sounds.mine);
await interact("mining",tileX,tileY);
}

if(tile==="W"){
playSound(sounds.fish);
await interact("fishing",tileX,tileY);
}

}

function updateEffects(){

for(let i=shakeTiles.length-1;i>=0;i--){

shakeTiles[i].life--;

if(shakeTiles[i].life<=0){
shakeTiles.splice(i,1);
}

}

if(state.animTimer>0){
state.animTimer--;
}else{
state.anim="idle";
}

}

function gameLoop(){

updateEffects();
render();

requestAnimationFrame(gameLoop);

}

window.onload=function(){

const token=localStorage.getItem("token");

if(token){
startGame();
}

gameLoop();

};
