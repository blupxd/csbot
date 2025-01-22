const express = require("express");
const { submitSteamGuardCode } = require("../services/steamService");

const router = express.Router();

// GET ruta za unos Steam Guard koda
router.get("/", async (req, res) => {
  const { code } = req.query; // Dobijanje koda iz query parametara

  if (!code) {
    return res.status(400).json({ error: "Steam Guard kod je obavezan." });
  }

  try {
    await submitSteamGuardCode(code); // Prosleđivanje koda klijentu

    // Ako je kod uspešno poslat
    res.status(200).json({ message: "Steam Guard kod poslat uspešno." });
  } catch (error) {
    // Ako postoji greška
    if (!res.headersSent) {
      // Provera da li su zaglavlja već poslana
      console.error("Greška prilikom slanja koda:", error.message);
      return res.status(500).json({ error: "Došlo je do greške." });
    }
  }
});

module.exports = router;
