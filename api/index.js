require("dotenv").config();
const express = require("express");
const cors = require("cors");
const { initializeSteam } = require("../services/steamService");
const rootRoutes = require("../routes/index");
const playerStatsRoutes = require("../routes/playerStats");

const app = express();
const port = 3000;
const allowedOrigins = ["http://localhost:3000", "https://arenagg.vercel.app"];
app.use(cors({
  origin: allowedOrigins,
  methods: ["GET", "POST"]
}));
// Povezivanje ruta
app.use("/", rootRoutes);
app.use("/player-stats", playerStatsRoutes);

app.listen(port, async () => {
  console.log(`Server radi na PORT: ${port}`);
  try {
    await initializeSteam();
    console.log("Steam i CS:GO klijent su spremni!");
  } catch (error) {
    console.error("Došlo je do greške tokom inicijalizacije:", error.message);
  }
});
