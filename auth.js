function setAuthMessage(text) {
  const el = document.getElementById("authMessage");
  if (el) el.innerText = text || "";
}

function setGameMessage(text) {
  const el = document.getElementById("gameMessage");
  if (el) el.innerText = text || "";
}

async function signup() {
  const username = document.getElementById("username").value.trim();
  const password = document.getElementById("password").value;

  if (!username || !password) {
    setAuthMessage("Enter a username and password.");
    return;
  }

  const r = await call("/signup", { username, password });

  if (r.token) {
    localStorage.setItem("token", r.token);
    setAuthMessage("");
    await startGame();
    return;
  }

  setAuthMessage(r.error || "Sign up failed.");
}

async function login() {
  const username = document.getElementById("username").value.trim();
  const password = document.getElementById("password").value;

  if (!username || !password) {
    setAuthMessage("Enter a username and password.");
    return;
  }

  const r = await call("/login", { username, password });

  if (r.token) {
    localStorage.setItem("token", r.token);
    setAuthMessage("");
    await startGame();
    return;
  }

  setAuthMessage(r.error || "Login failed.");
}

async function logout() {
  await call("/logout", {});
  localStorage.removeItem("token");
  location.reload();
}
