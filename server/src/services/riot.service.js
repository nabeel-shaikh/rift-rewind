// server/src/services/riot.service.js
const RIOT_API_KEY = process.env.RIOT_API_KEY;
console.log("Loaded RIOT_API_KEY:", RIOT_API_KEY ? "✅ exists" : "❌ missing");

function getCluster(region) {
  region = region.toLowerCase();
  if (["na", "na1", "br1", "la1", "la2"].includes(region)) return "americas";
  if (["euw", "euw1", "eun1", "tr1", "ru"].includes(region)) return "europe";
  if (["kr", "jp1"].includes(region)) return "asia";
  return "americas"; // fallback
}

async function fetchJson(url) {
  console.log("Fetching:", url);
  const res = await fetch(url, { headers: { "X-Riot-Token": RIOT_API_KEY } });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Riot API error ${res.status}: ${text}`);
  }
  return res.json();
}

async function fetchRiotStats(region, summonerName) {
  const cluster = getCluster(region);
  const [gameName, tagLine = "NA1"] = summonerName.split("#");

  console.log(`Fetching stats for ${gameName}#${tagLine} (${region}) via ${cluster}`);

  // ✅ Step 1: Get Riot account
  const account = await fetchJson(
    `https://${cluster}.api.riotgames.com/riot/account/v1/accounts/by-riot-id/${encodeURIComponent(gameName)}/${encodeURIComponent(tagLine)}`
  );

  console.log("Account found:", account);
  const puuid = account.puuid;

  // ✅ Step 2: Get last few matches
  const matchIds = await fetchJson(
    `https://${cluster}.api.riotgames.com/lol/match/v5/matches/by-puuid/${puuid}/ids?start=0&count=1`
  );
  console.log("Fetched match IDs:", matchIds);

  // ✅ Step 3: Pull match details
  const matches = await Promise.all(
    matchIds.map(id =>
      fetchJson(`https://${cluster}.api.riotgames.com/lol/match/v5/matches/${id}`)
    )
  );

  console.log("Sample matches:", matches.slice(0, 1));

  return { puuid, matchCount: matchIds.length, sample: matches.slice(0, 2) };
}

module.exports = { fetchRiotStats };
