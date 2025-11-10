"use strict";

function toNumber(value, fallback = 0) {
  const n = Number(value);
  return Number.isFinite(n) ? n : fallback;
}

function buildStatsByCount(matches = [], counts = [5, 10, 15]) {
  const safeMatches = Array.isArray(matches) ? matches : [];
  const uniqueCounts = Array.from(
    new Set(
      counts
        .map((c) => toNumber(c))
        .filter((c) => Number.isFinite(c) && c > 0)
        .sort((a, b) => a - b)
    )
  );

  const result = {};

  uniqueCounts.forEach((count) => {
    const slice = safeMatches.slice(0, count);

    if (!slice.length) {
      result[count] = {
        games: 0,
        winRate: "0.0",
        kda: "0.00",
        topChamps: [],
      };
      return;
    }

    let wins = 0;
    let kills = 0;
    let deaths = 0;
    let assists = 0;
    const champCounts = {};

    slice.forEach((match) => {
      const championName = match?.champion || match?.championName || "Unknown";
      kills += toNumber(match?.kills);
      deaths += toNumber(match?.deaths);
      assists += toNumber(match?.assists);
      if (match?.win) wins += 1;
      champCounts[championName] = (champCounts[championName] || 0) + 1;
    });

    const winRate = ((wins / slice.length) * 100).toFixed(1);
    const kda = ((kills + assists) / Math.max(deaths, 1)).toFixed(2);

    const topChamps = Object.entries(champCounts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 3)
      .map(([name, games]) => ({ name, games }));

    result[count] = {
      games: slice.length,
      winRate,
      kda,
      topChamps,
    };
  });

  return result;
}

module.exports = { buildStatsByCount };

