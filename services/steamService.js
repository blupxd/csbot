const SteamUser = require("steam-user");
const { loadToken, saveToken } = require("./database");

const client = new SteamUser();

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

module.exports = { client, initializeSteam };
