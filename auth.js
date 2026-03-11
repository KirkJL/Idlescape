async function signup(){

const username = document.getElementById("username").value;
const password = document.getElementById("password").value;

const r = await call("/signup",{username,password});

if(r.token){
localStorage.setItem("token",r.token);
startGame();
}

}

async function login(){

const username = document.getElementById("username").value;
const password = document.getElementById("password").value;

const r = await call("/login",{username,password});

if(r.token){
localStorage.setItem("token",r.token);
startGame();
}

}

function logout(){

localStorage.removeItem("token");
location.reload();

}
