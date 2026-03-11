const API = "https://YOUR_WORKER_URL";

async function call(endpoint,data){

const token = localStorage.getItem("token");

const res = await fetch(API + endpoint,{
method:"POST",
headers:{
"Content-Type":"application/json",
"Authorization":token || ""
},
body:JSON.stringify(data)
});

return res.json();

}
