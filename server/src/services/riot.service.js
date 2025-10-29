// server/src/services/riot.service.js
const RIOT_API_KEY = (process.env.RIOT_API_KEY || "").trim();

const PLATFORM_TO_ROUTING = (platform) => {
  if (/^(na|br|la1|la2|oc1)$/i.test(platform)) return "americas";
  if (/^(euw1|eun1|tr1|ru)$/i.test(platform)) return "europe";
  if (/^(kr|jp1)$/i.test(platform)) return "asia";
  return "americas";
};

async function fetchJson(url) {
  const res = await fetch(url, {
    method: "GET",
    headers: {
      "X-Riot-Token": RIOT_API_KEY,
      "User-Agent": "RiftRewind/1.0 (contact: shayanmohammed0@gmail.com)",
      "Accept-Language": "en-US,en;q=0.9",
      "Accept-Charset": "application/x-www-form-urlencoded; charset=UTF-8",
    },
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Riot API error ${res.status}: ${text}`);
  }
  return res.json();
}

/**
 * region = platform region like 'na1', 'euw1'
 * summonerName = Riot gameName without tagline (but we’ll prefer Riot ID path)
 * tagLine = Riot tagline like 'NA1'
 */
async function fetchRiotStats(region, summonerName, tagLine = "NA1", { rankedOnly = false, count = 10 } = {}) {
  // 1) Get PUUID via Riot ID (gameName + tagLine) – handles accents
  //    If the user typed without accents, the service still resolves the correct account.
  const routing = PLATFORM_TO_ROUTING(region);
  const account = await fetchJson(
    `https://${routing}.api.riotgames.com/riot/account/v1/accounts/by-riot-id/${encodeURIComponent(summonerName)}/${encodeURIComponent(tagLine)}`
  );
  const puuid = account.puuid;

  // 2) (Optional but recommended) Verify PUUID on platform region
  const summoner = await fetchJson(
    `https://${region}.api.riotgames.com/lol/summoner/v4/summoners/by-puuid/${encodeURIComponent(puuid)}`
  );

  // 3) Pull recent match IDs (ranked filter optional)
  // queue=420 => Ranked Solo/Duo; comment it out to include all queues
  const queueParam = rankedOnly ? "&queue=420" : "";
  const matchIds = await fetchJson(
    `https://${routing}.api.riotgames.com/lol/match/v5/matches/by-puuid/${encodeURIComponent(puuid)}/ids?start=0&count=${count}${queueParam}`
  );

  if (!Array.isArray(matchIds) || matchIds.length === 0) {
    return {
      totalGames: 0,
      matchesAnalyzed: 0,
      kda: "0.00",
      winRate: "0.0",
      topChamps: [],
    };
  }

  // 4) Fetch those matches and compute stats
  const matches = await Promise.all(
    matchIds.map((id) =>
      fetchJson(`https://${routing}.api.riotgames.com/lol/match/v5/matches/${id}`)
    )
  );

  const agg = { totalGames: matches.length, wins: 0, kills: 0, deaths: 0, assists: 0, champs: {} };

  for (const match of matches) {
    const p = match.info.participants.find((p) => p.puuid === puuid);
    if (!p) continue;
    agg.kills += p.kills;
    agg.deaths += p.deaths;
    agg.assists += p.assists;
    agg.wins += p.win ? 1 : 0;
    agg.champs[p.championName] = (agg.champs[p.championName] || 0) + 1;
  }

  const avgKDA = (agg.kills + agg.assists) / Math.max(agg.deaths, 1);
  const winRate = ((agg.wins / agg.totalGames) * 100).toFixed(1);
  const topChamps = Object.entries(agg.champs)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 3)
    .map(([name, games]) => ({ name, games }));

  return {
    totalGames: agg.totalGames,
    matchesAnalyzed: agg.totalGames,
    kda: avgKDA.toFixed(2),
    winRate,
    topChamps,
    summoner: { name: account.gameName, tagLine: account.tagLine, level: summoner.summonerLevel },
  };
}

module.exports = { fetchRiotStats };
