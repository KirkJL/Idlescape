async function startGame(){

document.getElementById("auth").style.display="none";
document.getElementById("game").style.display="block";

const r = await call("/player",{});

document.getElementById("player").innerText=r.username;

updateStats(r);

}

function updateStats(data){

document.getElementById("wood").innerText=data.skills.woodcutting;
document.getElementById("fish").innerText=data.skills.fishing;
document.getElementById("mine").innerText=data.skills.mining;

}

async function action(skill){

const r = await call("/action",{skill});

updateStats(r);

}

window.onload = ()=>{

if(localStorage.getItem("token")){
startGame();
}

}
