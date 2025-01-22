const express = require("express");
const { client } = require("../services/steamService");
const { csgo } = require("../services/csgoService");
const router = express.Router();

const APP_ID = 730; // CS:GO App ID

router.get("/", async (req, res) => {
  const { steamid } = req.query;

  if (!steamid) {
    return res.status(400).json({ error: "Nedostaje steamid parametar" });
  }

  console.log(steamid);

  try {
    // Provera Steam Web API statistika
    const response = await fetch(
      `https://api.steampowered.com/ISteamUserStats/GetUserStatsForGame/v0002/?appid=${APP_ID}&key=${process.env.STEAM_API_KEY}&steamid=${steamid}`
    );

    if (!response.ok) {
      throw new Error("Failed to fetch data from Steam API");
    }

    const { playerstats } = await response.json();
    const data = playerstats.stats;

    // Provera prijateljstva preko Steam Client biblioteke
    const friendsList = client.myFriends || {};
    const isFriend = friendsList[steamid] === 3; // 3 je EFriendRelationship.Friend
    console.log(friendsList);
    let profile = null;

    if (isFriend) {
      // Ako je prijatelj, povuci profil koristeći GlobalOffensive biblioteku
      profile = await new Promise((resolve) => {
        csgo.requestPlayersProfile(steamid, (fetchedProfile) => {
          console.log(fetchedProfile);
          resolve(fetchedProfile || null);
        });
      });
    }

    // Računanje statistike iz Steam Web API podataka
    const totalKills = data.find((stat) => stat.name === "total_kills").value;
    const totalDeaths = data.find((stat) => stat.name === "total_deaths").value;
    const kdRatio = (totalKills / totalDeaths).toFixed(2);

    const totalHeadshots = data.find(
      (stat) => stat.name === "total_kills_headshot"
    ).value;
    const hsPercentage = ((totalHeadshots / totalKills) * 100).toFixed(2);

    const totalWins = data.find((stat) => stat.name === "total_wins").value;
    const totalRounds = data.find(
      (stat) => stat.name === "total_rounds_played"
    ).value;
    const winPercentage = ((totalWins / totalRounds) * 100).toFixed(2);

    const totalLosses = totalRounds - totalWins;
    const totalDamage = data.find(
      (stat) => stat.name === "total_damage_done"
    ).value;
    const averageDamagePerRound = (totalDamage / totalRounds).toFixed(2);

    const mapStats = data.filter((stat) =>
      stat.name.startsWith("total_wins_map")
    );
    const mapWinPercentages = mapStats.map((stat) => {
      const mapName = stat.name.replace("total_wins_map_", "");
      const wins = stat.value;
      const totalRoundsMapStat = `total_rounds_map_${mapName}`;
      const totalRoundsMap =
        data.find((s) => s.name === totalRoundsMapStat)?.value || 1;

      return {
        map: mapName,
        winPercentage: ((wins / totalRoundsMap) * 100).toFixed(2),
        totalRounds: totalRoundsMap,
        totalWins: wins,
        totalLosses: totalRoundsMap - wins,
      };
    });

    const weaponStats = data.filter(
      (stat) =>
        stat.name.startsWith("total_kills_") &&
        !stat.name.startsWith("total_kills_map") &&
        stat.name !== "total_kills_headshot"
    );

    const favoriteWeapon = weaponStats.reduce(
      (max, weapon) => {
        return weapon.value > max.value ? weapon : max;
      },
      { name: "", value: 0 }
    );

    const mapRounds = data.filter((stat) =>
      stat.name.startsWith("total_rounds_map")
    );
    const favoriteMap = mapRounds.reduce(
      (max, map) => {
        return map.value > max.value ? map : max;
      },
      { name: "", value: 0 }
    );

    res.json({
      profile: {
        ranks:
          profile?.rankings.map((rank) => ({
            rank_id: rank.rank_id,
            rank_type_id: rank.rank_type_id,
          })) || [],
      },
      message: isFriend
        ? "Profil podaci povučeni uspešno."
        : "Korisnik nije na listi prijatelja bota. Dodajte bota da biste videli kompletan profil.",
      kdRatio,
      hsPercentage,
      winPercentage,
      totalWins,
      totalLosses,
      averageDamagePerRound,
      mapWinPercentages,
      favoriteWeapon: favoriteWeapon.name.replace("total_kills_", ""),
      favoriteMap: favoriteMap.name.replace("total_rounds_map_", ""),
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: error.message || "Failed to fetch data." });
  }
});

module.exports = router;
