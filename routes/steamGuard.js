const express = require("express");
const { submitSteamGuardCode } = require("./services/steamService");

const router = express.Router();

// Ruta za unošenje Steam Guard koda
router.post("/submit-steam-guard", (req, res) => {
  const { code } = req.query;

  if (!code) {
    return res.status(400).json({ error: "Steam Guard kod je obavezan." });
  }

  try {
    submitSteamGuardCode(code); // Pozivamo funkciju za prosleđivanje koda.
    res.status(200).json({ message: "Steam Guard kod poslat uspešno." });
  } catch (error) {
    console.error("Greška prilikom prosleđivanja koda:", error.message);
    res.status(500).json({ error: "Došlo je do greške." });
  }
});

module.exports = router;
