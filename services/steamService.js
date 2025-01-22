const SteamUser = require("steam-user");
const { loadToken, saveToken } = require("./database");

const client = new SteamUser();
let pendingSteamGuardCallback = null;
async function logInSteam() {
  const sentry = await loadToken();
  const logOnOptions = {
    accountName: process.env.STEAM_USERNAME,
    password: process.env.STEAM_PASSWORD,
    rememberPassword: true,
    sentry,
  };

  client.logOn(logOnOptions);

  client.on("loggedOn", () => {
    console.log("Uspešno prijavljen na Steam!");
    client.setPersona(SteamUser.EPersonaState.Online);
    client.gamesPlayed([730]); // CS:GO
  });

  client.on("steamGuard", (domain, callback) => {
    console.log(
      `Steam Guard kod je poslat na ${domain || "mobilni autentifikator"}.`
    );
    pendingSteamGuardCallback = callback; // Spremamo callback za kasniju upotrebu
  });

  client.on("machineAuthToken", (machineAuth) => {
    saveToken(machineAuth);
  });

  client.on("error", (err) => {
    console.error("Došlo je do greške:", err.message);
  });
}

async function initializeSteam() {
  await logInSteam();
}

// Funkcija za Steam Guard kod
function submitSteamGuardCode(code) {
  if (pendingSteamGuardCallback) {
    console.log("Šaljemo Steam Guard kod:", code);
    pendingSteamGuardCallback(code);
    pendingSteamGuardCallback = null;
  } else {
    console.log("Nema čekajućeg Steam Guard koda.");
  }
}

module.exports = { client, initializeSteam, submitSteamGuardCode };
