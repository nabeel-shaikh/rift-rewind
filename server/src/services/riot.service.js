// server/src/services/riot.service.js
const RIOT_API_KEY = (process.env.RIOT_API_KEY || "").trim();

const PLATFORM_TO_ROUTING = (platform) => {
  if (/^(na1|br1|la1|la2|oc1)$/i.test(platform)) return "americas";
  if (/^(euw1|eun1|tr1|ru)$/i.test(platform)) return "europe";
  if (/^(kr|jp1)$/i.test(platform)) return "asia";
  return "americas";
};

async function fetchJson(url) {
  const res = await fetch(url, {
    method: "GET",
    headers: {
      "X-Riot-Token": RIOT_API_KEY,
      "User-Agent": "Mozilla/5.0 (compatible; RiftRewind/1.0)",
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

async function getAccountByRiotId(region, summonerName, tagLine) {
  const routing = PLATFORM_TO_ROUTING(region);
  return fetchJson(
    `https://${routing}.api.riotgames.com/riot/account/v1/accounts/by-riot-id/${encodeURIComponent(summonerName)}/${encodeURIComponent(tagLine)}`
  );
}

async function getSummonerByPuuid(region, puuid) {
  const routing = PLATFORM_TO_ROUTING(region);
  return fetchJson(
    `https://${region}.api.riotgames.com/lol/summoner/v4/summoners/by-puuid/${encodeURIComponent(puuid)}`
  );
}

/**
 * region = platform region like 'na1', 'euw1'
 * summonerName = Riot gameName without tagline (but we’ll prefer Riot ID path)
 * tagLine = Riot tagline like 'NA1'
 */
// async function fetchRiotStats(region, summonerName, tagLine = "NA1", { rankedOnly = false, count = 15 } = {}) {
//   // 1) Get PUUID via Riot ID (gameName + tagLine) – handles accents
//   //    If the user typed without accents, the service still resolves the correct account.
//   const routing = PLATFORM_TO_ROUTING(region);
//   const account = await getAccountByRiotId(region, summonerName, tagLine);
//   const puuid = account.puuid;

//   // 2) (Optional but recommended) Verify PUUID on platform region
//   const summoner = await getSummonerByPuuid(region, puuid);

//   // 3) Pull recent match IDs (ranked filter optional)
//   // queue=420 => Ranked Solo/Duo; comment it out to include all queues
//   const queueParam = rankedOnly ? "&queue=420" : "";
//   const matchIds = await fetchJson(
//     `https://${routing}.api.riotgames.com/lol/match/v5/matches/by-puuid/${encodeURIComponent(puuid)}/ids?start=0&count=${count}${queueParam}`
//   );
//   console.log("Fetched match IDs:", matchIds);

//   if (!Array.isArray(matchIds) || matchIds.length === 0) {
//     return {
//       totalGames: 0,
//       matchesAnalyzed: 0,
//       kda: "0.00",
//       winRate: "0.0",
//       topChamps: [],
//     };
//   }

//   // 4) Fetch those matches and compute stats
//   const matches = await Promise.all(
//     matchIds.map((id) =>
//       fetchJson(`https://${routing}.api.riotgames.com/lol/match/v5/matches/${id}`)
//     )
//   );

//   const agg = { totalGames: matches.length, wins: 0, kills: 0, deaths: 0, assists: 0, champs: {} };

//   for (const match of matches) {
//     const p = match.info.participants.find((p) => p.puuid === puuid);
//     if (!p) continue;
//     agg.kills += p.kills;
//     agg.deaths += p.deaths;
//     agg.assists += p.assists;
//     agg.wins += p.win ? 1 : 0;
//     agg.champs[p.championName] = (agg.champs[p.championName] || 0) + 1;
//   }

//   const avgKDA = (agg.kills + agg.assists) / Math.max(agg.deaths, 1);
//   const winRate = ((agg.wins / agg.totalGames) * 100).toFixed(1);
//   const topChamps = Object.entries(agg.champs)
//     .sort((a, b) => b[1] - a[1])
//     .slice(0, 3)
//     .map(([name, games]) => ({ name, games }));

//     return {
//       totalGames: agg.totalGames,
//       matchesAnalyzed: agg.totalGames,
//       kda: avgKDA.toFixed(2),
//       winRate,
//       topChamps,
//       summoner: { 
//         name: account.gameName, 
//         tagLine: account.tagLine, 
//         level: summoner.summonerLevel 
//       },
//       matches: matches.map((m) => {
//         const p = m.info.participants.find((p) => p.puuid === puuid);
//         return {
//           champion: p.championName,
//           kills: p.kills,
//           deaths: p.deaths,
//           assists: p.assists,
//           win: p.win,
//           mode: m.info.gameMode,
//           queueId: m.info.queueId,
//           duration: m.info.gameDuration,
//           timestamp: m.info.gameStartTimestamp,
//         };
//       })
//     };
//   }

async function fetchRiotStats(
  region,
  summonerName,
  tagLine = "NA1",
  {
    rankedOnly = false,
    count = 15,
    fullHistory = false,
    maxMatches = 500,
  } = {}
) {
  // 1) Resolve routing + account + puuid
  const routing = PLATFORM_TO_ROUTING(region);
  const account = await getAccountByRiotId(region, summonerName, tagLine);
  const puuid = account.puuid;

  // 2) Verify summoner on the platform shard
  const summoner = await getSummonerByPuuid(region, puuid);

  // helper: fetch one page of match IDs
  async function fetchMatchIdPage(start, pageSize, rankedOnly) {
    const queueParam = rankedOnly ? "&queue=420" : "";
    const url = `https://${routing}.api.riotgames.com/lol/match/v5/matches/by-puuid/${encodeURIComponent(
      puuid
    )}/ids?start=${start}&count=${pageSize}${queueParam}`;
    return fetchJson(url);
  }

  // 3) Get match IDs (either just "count" or walk through history)
  let allMatchIds = [];
  if (fullHistory) {
    const pageSize = 100;
    let start = 0;
    while (allMatchIds.length < maxMatches) {
      const page = await fetchMatchIdPage(start, pageSize, rankedOnly);
      if (!Array.isArray(page) || page.length === 0) break;
      allMatchIds.push(...page);
      if (page.length < pageSize) break; // no more pages
      start += pageSize;
    }
  } else {
    // original behavior: just fetch `count` matches
    allMatchIds = await fetchMatchIdPage(0, count, rankedOnly);
  }

  // 4) If no matches, return empty shape
  if (!Array.isArray(allMatchIds) || allMatchIds.length === 0) {
    return {
      totalGames: 0,
      matchesAnalyzed: 0,
      kda: "0.00",
      winRate: "0.0",
      topChamps: [],
      totalMatches: 0,
      lifetimeKills: 0,
      lifetimeDeaths: 0,
      lifetimeAssists: 0,
      summoner: {
        name: account.gameName,
        tagLine: account.tagLine,
        level: summoner.summonerLevel,
      },
      matches: [],
    };
  }

  // 5) Fetch all match details we decided to analyze
  const matches = await Promise.all(
    allMatchIds.map((id) =>
      fetchJson(`https://${routing}.api.riotgames.com/lol/match/v5/matches/${id}`)
    )
  );

  // 6) Aggregate
  const agg = {
    totalGames: 0,
    wins: 0,
    kills: 0,
    deaths: 0,
    assists: 0,
    champs: {},
  };

  const matchSummaries = [];

  for (const match of matches) {
    if (!match?.info?.participants) continue;
    const p = match.info.participants.find((p) => p.puuid === puuid);
    if (!p) continue;

    agg.totalGames += 1;
    agg.kills += p.kills;
    agg.deaths += p.deaths;
    agg.assists += p.assists;
    if (p.win) agg.wins += 1;
    agg.champs[p.championName] = (agg.champs[p.championName] || 0) + 1;

    matchSummaries.push({
      champion: p.championName,
      kills: p.kills,
      deaths: p.deaths,
      assists: p.assists,
      win: p.win,
      mode: match.info.gameMode,
      queueId: match.info.queueId,
      duration: match.info.gameDuration,
      timestamp: match.info.gameStartTimestamp,
    });
  }

  // 7) Derived statsDDRAGONVERSION
  const avgKDA = (agg.kills + agg.assists) / Math.max(agg.deaths, 1);
  const winRate = agg.totalGames
    ? ((agg.wins / agg.totalGames) * 100).toFixed(1)
    : "0.0";

  const topChamps = Object.entries(agg.champs)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 3)
    .map(([name, games]) => ({ name, games }));

  const mostPlayed = topChamps[0]?.name;

   
    const ddragonVersion = process.env.DDRAGONVERSION;
    const heroImageUrl = mostPlayed
      ? `https://ddragon.leagueoflegends.com/cdn/${ddragonVersion}/img/champion/${mostPlayed}.png`
      : null;

  // 8) Return extended shape
  return {
    // original fields
    totalGames: agg.totalGames,
    matchesAnalyzed: agg.totalGames,
    kda: avgKDA.toFixed(2),
    winRate,
    topChamps,

    // NEW fields
    totalMatches: agg.totalGames,       // how many we actually walked through
    lifetimeKills: agg.kills,
    lifetimeDeaths: agg.deaths,
    lifetimeAssists: agg.assists,

    // identity
    summoner: {
      name: account.gameName,
      tagLine: account.tagLine,
      level: summoner.summonerLevel,
    },

    // match list
    matches: matchSummaries,
    heroImageUrl
  };
}

async function fetchProfile(region, summonerName, tagLine = "NA1") {
  const account = await getAccountByRiotId(region, summonerName, tagLine);
  const summoner = await getSummonerByPuuid(region, account.puuid);
  return {
    account,
    summoner,
  };
}


// just return match IDs + optional match bodies
async function fetchRecentMatches(region, summonerName, tagLine = "NA1", { rankedOnly = false, count = 10 } = {}) {
  const routing = PLATFORM_TO_ROUTING(region);
  const account = await getAccountByRiotId(region, summonerName, tagLine);
  const queueParam = rankedOnly ? "&queue=420" : "";
  const matchIds = await fetchJson(
    `https://${routing}.api.riotgames.com/lol/match/v5/matches/by-puuid/${encodeURIComponent(
      account.puuid
    )}/ids?start=0&count=${count}${queueParam}`
  );

  // if you want full matches, fetch them too
  const matches = await Promise.all(
    matchIds.map((id) => fetchJson(`https://${routing}.api.riotgames.com/lol/match/v5/matches/${id}`))
  );

  return {
    puuid: account.puuid,
    matchIds,
    matches,
  };
}

// champion-mastery-v4
async function fetchMastery(region, summonerName, tagLine = "NA1", top = 10) {
  // 1) get account to get the PUUID
  const account = await getAccountByRiotId(region, summonerName, tagLine);
  const puuid = account.puuid;

  // 2) call the endpoint your docs show:
  // /lol/champion-mastery/v4/champion-masteries/by-puuid/{encryptedPUUID}
  const mastery = await fetchJson(
    `https://${region}.api.riotgames.com/lol/champion-mastery/v4/champion-masteries/by-puuid/${encodeURIComponent(
      puuid
    )}`
  );

  return {
    summoner: {
      name: account.gameName,
      tagLine: account.tagLine,
      // optional: you can still fetch summoner to get level if you want
    },
    mastery: mastery.slice(0, top),
  };
}

async function fetchDerivedRankedStats(region, summonerName, tagLine = "NA1", rankedCount = 20) {
  const routing = PLATFORM_TO_ROUTING(region);

  // 1) resolve to PUUID
  const account = await getAccountByRiotId(region, summonerName, tagLine);
  const puuid = account.puuid;

  // 2) ask Riot DIRECTLY for ranked solo (420)
  const soloIds = await fetchJson(
    `https://${routing}.api.riotgames.com/lol/match/v5/matches/by-puuid/${encodeURIComponent(
      puuid
    )}/ids?start=0&count=${rankedCount}&queue=420`
  );

  // 3) also ask for ranked flex (440), same amount
  const flexIds = await fetchJson(
    `https://${routing}.api.riotgames.com/lol/match/v5/matches/by-puuid/${encodeURIComponent(
      puuid
    )}/ids?start=0&count=${rankedCount}&queue=440`
  );

  // 4) merge + dedupe
  const allIds = Array.from(new Set([...soloIds, ...flexIds]));

  if (allIds.length === 0) {
    return {
      rankedMatches: 0,
      winRate: "0.0",
      topChamps: [],
    };
  }

  // 5) fetch those matches
  const matches = await Promise.all(
    allIds.map((id) =>
      fetchJson(`https://${routing}.api.riotgames.com/lol/match/v5/matches/${id}`)
    )
  );

  // 6) compute from only those ranked matches
  let wins = 0;
  const champCounts = {};

  for (const match of matches) {
    const me = match.info.participants.find((p) => p.puuid === puuid);
    if (!me) continue;

    if (me.win) wins += 1;
    champCounts[me.championName] = (champCounts[me.championName] || 0) + 1;
  }

  const winRate = ((wins / matches.length) * 100).toFixed(1);
  const topChamps = Object.entries(champCounts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 3)
    .map(([name, games]) => ({ name, games }));

  return {
    rankedMatches: matches.length,
    winRate,
    topChamps,
  };
}



module.exports = {
  fetchRiotStats,
  fetchProfile,
  fetchRecentMatches,
  fetchMastery,
  fetchDerivedRankedStats
};

