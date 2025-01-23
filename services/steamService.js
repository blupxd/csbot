const SteamUser = require("steam-user");
const { loadToken, saveToken } = require("./database");

const client = new SteamUser({
  rememberPassword: true,
  renewRefreshTokens: true, // Automatski obnavljaj refresh tokene
});

let pendingSteamGuardCallback = null;

async function logInSteam() {
  try {
    const refreshToken = await loadToken();

    // Definišemo opcije za logovanje
    const logOnOptions = refreshToken
      ? { refreshToken } // Koristi refresh token ako postoji
      : {
          accountName: process.env.STEAM_USERNAME,
          password: process.env.STEAM_PASSWORD,
          rememberPassword: true,
        };

    client.logOn(logOnOptions);

    // Postavljamo događaje
    setupEventHandlers();
  } catch (error) {
    console.error("Greška prilikom logovanja na Steam:", error.message);
  }
}

function setupEventHandlers() {
  // Uspešno prijavljen
  client.on("loggedOn", () => {
    console.log("Uspešno prijavljen na Steam!");
    client.setPersona(SteamUser.EPersonaState.Online);
    client.gamesPlayed([730]); // Aktivira CS:GO
  });

  // Steam Guard kod
  client.on("steamGuard", (domain, callback) => {
    console.log(
      `Steam Guard kod je poslat na ${domain || "mobilni autentifikator"}.`
    );
    pendingSteamGuardCallback = callback; // Spremi callback za unos koda
  });

  // Novi refresh token
  client.on("refreshToken", (newToken) => {
    console.log("Novi refresh token:", newToken);
    saveToken(newToken); // Sačuvaj novi token
  });

  // Greške tokom rada
  client.on("error", (err) => {
    console.error("Došlo je do greške:", err.message);
    handleError(err);
  });

  // Diskonektovan
  client.on("disconnected", (eresult, msg) => {
    console.log(
      `Korisnik je odjavljen: ${msg}. Pokušavamo ponovo za 5 sekundi...`
    );
    setTimeout(logInSteam, 5000);
  });
}

function handleError(err) {
  if (err.eresult === SteamUser.EResult.InvalidPassword) {
    console.log("Nevalidna lozinka ili sesija je istekla. Pokušavam ponovo...");
    logInSteam();
  } else if (err.eresult === SteamUser.EResult.LoggedInElsewhere) {
    console.log("Korisnik je prijavljen na drugom uređaju. Ponovni pokušaj...");
    logInSteam();
  } else {
    console.log("Pokušavam ponovo za 5 sekundi...");
    setTimeout(logInSteam, 5000);
  }
}

// Funkcija za unos Steam Guard koda
function submitSteamGuardCode(code) {
  if (pendingSteamGuardCallback) {
    console.log("Šaljem Steam Guard kod:", code);
    pendingSteamGuardCallback(code); // Prosledi kod
    pendingSteamGuardCallback = null; // Reset callbacka
  } else {
    console.log("Nema čekajućeg Steam Guard koda.");
  }
}

async function initializeSteam() {
  await logInSteam(); // Pokreni logovanje na Steam
}

module.exports = {
  client,
  initializeSteam,
  submitSteamGuardCode,
};
