const express = require("express");
const router = express.Router();

router.get("/", (req, res) => {
  res.send("Steam API radi!");
});

module.exports = router;
