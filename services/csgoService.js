const GlobalOffensive = require("globaloffensive");
const { client } = require("./steamService");

const csgo = new GlobalOffensive(client);

const csgoReady = new Promise((resolve, reject) => {
  csgo.on("connectedToGC", () => {
    console.log("CS:GO Game Coordinator povezan!");
    resolve();
  });

  csgo.on("error", (err) => {
    console.error("CS:GO GC greška:", err.message);
    reject(err);
  });
  csgo.on("matchList", (game) => {
    console.log(game);
    console.log("IMAO MATCH LIST")
    resolve();
  });
});

module.exports = { csgo, csgoReady };
