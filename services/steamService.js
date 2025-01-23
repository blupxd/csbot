const SteamUser = require("steam-user");
const { loadToken, saveToken } = require("./database");

const client = new SteamUser({
  rememberPassword: true,
  renewRefreshTokens: true,
});

let pendingSteamGuardCallback = null;
let isLoggingIn = false; // Indikator za praćenje statusa logovanja

async function logInSteam() {
  if (isLoggingIn) {
    console.log("Već se pokušava prijava. Čekamo trenutni pokušaj da završi.");
    return;
  }

  isLoggingIn = true; // Obeležavamo da je prijava u toku

  try {
    const refreshToken = await loadToken();

    const logOnOptions = refreshToken
      ? { refreshToken }
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
  } finally {
    isLoggingIn = false; // Resetujemo indikator nakon pokušaja
  }
}

function setupEventHandlers() {
  client.on("loggedOn", () => {
    console.log("Uspešno prijavljen na Steam!");
    client.setPersona(SteamUser.EPersonaState.Online);
    client.gamesPlayed([730]); // Aktivira CS:GO
  });

  client.on("steamGuard", (domain, callback) => {
    console.log(
      `Steam Guard kod je poslat na ${domain || "mobilni autentifikator"}.`
    );
    pendingSteamGuardCallback = callback;
  });

  client.on("refreshToken", (newToken) => {
    console.log("Novi refresh token:", newToken);
    saveToken(newToken); // Sačuvaj novi token
  });

  client.on("error", (err) => {
    console.error("Došlo je do greške:", err.message);
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

function submitSteamGuardCode(code) {
  if (pendingSteamGuardCallback) {
    console.log("Šaljem Steam Guard kod:", code);
    pendingSteamGuardCallback(code);
    pendingSteamGuardCallback = null;
  } else {
    console.log("Nema čekajućeg Steam Guard koda.");
  }
}

module.exports = {
  client,
  initializeSteam,
  submitSteamGuardCode,
};
