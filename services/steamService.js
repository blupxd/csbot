const SteamUser = require("steam-user");
const { loadToken, saveToken } = require("./database");

const client = new SteamUser();
let pendingSteamGuardCallback = null; // Za čuvanje callback funkcije dok ne stigne kod.

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
    console.log(`Steam Guard kod poslan na ${domain || 'mobilni autentifikator'}.`);
    pendingSteamGuardCallback = callback; // Čuvamo callback dok ne stigne kod.
    console.log("Čeka se Steam Guard kod putem API-ja...");
  });

  client.on("machineAuth", (machineAuth) => {
    saveToken(machineAuth.bytes);
    console.log("Sentry podaci su uspešno sačuvani.");
  });

  client.on("error", (err) => {
    console.error("Došlo je do greške:", err.message);
  });
}

// Funkcija za unos Steam Guard koda putem API-ja.
function submitSteamGuardCode(code) {
  if (pendingSteamGuardCallback) {
    pendingSteamGuardCallback(code);
    pendingSteamGuardCallback = null; // Resetovanje nakon uspešne prijave.
    console.log("Steam Guard kod je poslat klijentu!");
  } else {
    console.log("Trenutno nije zatražen Steam Guard kod.");
  }
}

module.exports = { client, logInSteam, submitSteamGuardCode };
