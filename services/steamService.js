const SteamUser = require("steam-user");
const { loadToken, saveToken } = require("./database");

const client = new SteamUser({
  rememberPassword: true,
  renewRefreshTokens: true
});
let pendingSteamGuardCallback = null;

async function logInSteam() {
  const refreshToken = await loadToken();
  const logOnOptions = refreshToken
    ? { refreshToken } // Koristi postojeći refresh token ako postoji
    : {
        accountName: process.env.STEAM_USERNAME,
        password: process.env.STEAM_PASSWORD,
        rememberPassword: true,
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

  client.on("refreshToken", (token) => {
    saveToken(token)
      .then(() => console.log("Refresh token uspešno sačuvan u MongoDB!"))
      .catch((err) =>
        console.error("Greška pri čuvanju refresh tokena:", err.message)
      );
  });

  client.on("error", (err) => {
    console.error("Došlo je do greške:", err.message);
    if (err.eresult === SteamUser.EResult.InvalidPassword) {
      console.log(
        "Sesija je istekla, pokušavamo ponovo prijaviti korisnika..."
      );
      logInSteam();
    } else if (err.eresult === SteamUser.EResult.LoggedInElsewhere) {
      console.log(
        "Korisnik je prijavljen na drugom uređaju, pokušavamo ponovo..."
      );
      logInSteam();
    } else {
      console.log("Pokušavamo ponovo prijaviti korisnika za 5 sekundi...");
      setTimeout(logInSteam, 5000);
    }
  });

  client.on("disconnected", (eresult, msg) => {
    console.log(
      `Korisnik je odjavljen: ${msg}. Pokušavamo ponovo prijaviti korisnika za 5 sekundi...`
    );
    setTimeout(logInSteam, 5000);
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
