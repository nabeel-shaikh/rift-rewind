const RIOT_API_KEY = process.env.RIOT_API_KEY;

// helper for GET requests with auth
async function fetchJson(url) {
  const res = await fetch(url, {
    headers: { "X-Riot-Token": RIOT_API_KEY },
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Riot API error ${res.status}: ${text}`);
  }
  return res.json();
}

async function fetchRiotStats(region, summonerName) {
  console.log("Fetching stats for:", summonerName, region);

  // 1️⃣ Summoner data
  const summoner = await fetchJson(
    `https://${region}.api.riotgames.com/lol/summoner/v4/summoners/by-name/${encodeURIComponent(summonerName)}`
  );
  const puuid = summoner.puuid;

  // 2️⃣ Get recent matches (use AMERICAS for NA, LATAM, BR; EUROPE for EUW/EUNE; ASIA for KR/JP)
  const routingRegion =
    region.startsWith("na") || region.startsWith("br") || region.startsWith("la")
      ? "americas"
      : region.startsWith("euw") || region.startsWith("eun")
      ? "europe"
      : "asia";

  const matchIds = await fetchJson(
    `https://${routingRegion}.api.riotgames.com/lol/match/v5/matches/by-puuid/${puuid}/ids?start=0&count=5`
  );

  // 3️⃣ Fetch matches
  const matches = await Promise.all(
    matchIds.map((id) =>
      fetchJson(`https://${routingRegion}.api.riotgames.com/lol/match/v5/matches/${id}`)
    )
  );

  // 4️⃣ Basic stats (calculate KDA, win rate, top champs)
  const stats = { totalGames: matches.length, wins: 0, kills: 0, deaths: 0, assists: 0, champs: {} };

  for (const match of matches) {
    const player = match.info.participants.find((p) => p.puuid === puuid);
    if (!player) continue;

    stats.kills += player.kills;
    stats.deaths += player.deaths;
    stats.assists += player.assists;
    stats.wins += player.win ? 1 : 0;

    const champ = player.championName;
    stats.champs[champ] = (stats.champs[champ] || 0) + 1;
  }

  const avgKDA = (stats.kills + stats.assists) / Math.max(stats.deaths, 1);
  const winRate = ((stats.wins / stats.totalGames) * 100).toFixed(1);
  const topChamps = Object.entries(stats.champs)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 3)
    .map(([name, games]) => ({ name, games }));

  return { totalGames: stats.totalGames, kda: avgKDA.toFixed(2), winRate, topChamps };
}

module.exports = { fetchRiotStats };
