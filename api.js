const API = "autumn-king-2661.kirkjlemon.workers.dev";

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
