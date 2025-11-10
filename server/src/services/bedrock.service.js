const { BedrockRuntimeClient, InvokeModelCommand } = require("@aws-sdk/client-bedrock-runtime");
const { buildStatsByCount } = require("../utils/statsByCount");

const client = new BedrockRuntimeClient({
  region: process.env.AWS_REGION || "us-east-1",
  credentials: process.env.AWS_ACCESS_KEY_ID
    ? {
        accessKeyId: process.env.AWS_ACCESS_KEY_ID,
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
      }
    : undefined,
});

function formatSegmentLine(count, segment = {}) {
  const gamesPlayed = segment.games ?? count;
  const winRate = segment.winRate ?? "0.0";
  const kda = segment.kda ?? "0.00";
  const champs =
    (segment.topChamps || [])
      .map((c) => c?.name)
      .filter(Boolean)
      .join(", ") || "None";
  return `Last ${count} games (${gamesPlayed} recorded) — Win Rate: ${winRate}%, KDA: ${kda}, Top Champs: ${champs}`;
}

function buildFallbackSummaries(summonerName, statsByCount) {
  return {
    "5": `Demo coaching summary for ${summonerName} (5 games): win rate ${
      statsByCount?.[5]?.winRate ?? "0.0"
    }%, KDA ${statsByCount?.[5]?.kda ?? "0.00"}. Keep refining your ${(
      statsByCount?.[5]?.topChamps || []
    )
      .map((c) => c.name)
      .join(", ") || "favorite champions"} picks.`,
    "10": `Demo coaching summary for ${summonerName} (10 games): win rate ${
      statsByCount?.[10]?.winRate ?? "0.0"
    }%, KDA ${statsByCount?.[10]?.kda ?? "0.00"}. Focus on consistency and objective control.`,
    "15": `Demo coaching summary for ${summonerName} (15 games): win rate ${
      statsByCount?.[15]?.winRate ?? "0.0"
    }%, KDA ${statsByCount?.[15]?.kda ?? "0.00"}. Keep building around ${
      (statsByCount?.[15]?.topChamps || [])
        .map((c) => c.name)
        .join(", ") || "your comfort picks"
    }.`,
  };
}

async function generateSummaries({ summonerName, statsByCount }) {
  const fallback = buildFallbackSummaries(summonerName, statsByCount);

  if (!process.env.AWS_ACCESS_KEY_ID) {
    return fallback;
  }

  const prompt = `
You are an enthusiastic League of Legends coach.
Using the player's stats, create three short motivational summaries:
- Last 5 games (Segment A)
- Last 10 games (Segment B)
- Last 15 games (Segment C)

Player: ${summonerName}

Stats:
${formatSegmentLine(5, statsByCount?.[5])}
${formatSegmentLine(10, statsByCount?.[10])}
${formatSegmentLine(15, statsByCount?.[15])}

Respond ONLY with valid JSON in this format:
{
  "5": "string (summary for 5 games)",
  "10": "string (summary for 10 games)",
  "15": "string (summary for 15 games)"
}
`;

  const body = JSON.stringify({
    anthropic_version: "bedrock-2023-05-31",
    max_tokens: 400,
    temperature: 0.7,
    messages: [{ role: "user", content: [{ type: "text", text: prompt }]}],
  });

  try {
    const res = await client.send(
      new InvokeModelCommand({
        modelId: process.env.BEDROCK_MODEL_ID || "anthropic.claude-3-sonnet-20240229-v1:0",
        contentType: "application/json",
        accept: "application/json",
        body,
      })
    );

    const txt = await res.body.transformToString();
    const parsed = JSON.parse(txt);
    const content = parsed?.content?.[0]?.text || "";

    let summaries;
    try {
      summaries = JSON.parse(content);
    } catch {
      const match = content.match(/\{[\s\S]*\}/);
      summaries = match ? JSON.parse(match[0]) : undefined;
    }

    if (
      !summaries ||
      typeof summaries !== "object" ||
      !summaries["5"] ||
      !summaries["10"] ||
      !summaries["15"]
    ) {
      return fallback;
    }

    return {
      "5": String(summaries["5"]).trim(),
      "10": String(summaries["10"]).trim(),
      "15": String(summaries["15"]).trim(),
    };
  } catch (err) {
    console.error("Bedrock generateSummaries failed:", err);
    return fallback;
  }
}

// Backwards-compatible helper for endpoints that still expect a single string
async function generateSummary({ summonerName, stats }) {
  const statsByCount = buildStatsByCount(stats?.matches || [], [5, 10, 15]);
  // fallback to provided stats for 15 games if matches list is empty
  if (!statsByCount[15]) {
    statsByCount[15] = {
      games: stats?.matches?.length || stats?.totalGames || 0,
      winRate: stats?.winRate ?? "0.0",
      kda: stats?.kda ?? "0.00",
      topChamps: stats?.topChamps ?? [],
    };
  }

  const summaries = await generateSummaries({ summonerName, statsByCount });
  return summaries["15"];
}

// Compare two players and determine who you'd rather have on your team
async function generateComparison({ player1, player2, stats1, stats2 }) {
  // If Bedrock isn't configured yet, return a demo string
  if (!process.env.AWS_ACCESS_KEY_ID) {
    const winner = parseFloat(stats1.winRate) > parseFloat(stats2.winRate) ? player1 : player2;
    return {
      recommendation: winner,
      analysis: `Demo comparison: ${player1} has ${stats1.winRate}% win rate vs ${player2} with ${stats2.winRate}% win rate. I'd pick ${winner} for their better performance.`
    };
  }

  const prompt = `
You are an expert League of Legends analyst and coach. Compare these two players and decide who you'd rather have on your team.

Player 1: ${player1}
- Win rate: ${stats1.winRate}%
- KDA: ${stats1.kda}
- Total games: ${stats1.totalGames}
- Top champions: ${stats1.topChamps.map(c => `${c.name} (${c.games} games)`).join(", ")}
- Lifetime stats: ${stats1.lifetimeKills || 0} kills, ${stats1.lifetimeDeaths || 0} deaths, ${stats1.lifetimeAssists || 0} assists

Player 2: ${player2}
- Win rate: ${stats2.winRate}%
- KDA: ${stats2.kda}
- Total games: ${stats2.totalGames}
- Top champions: ${stats2.topChamps.map(c => `${c.name} (${c.games} games)`).join(", ")}
- Lifetime stats: ${stats2.lifetimeKills || 0} kills, ${stats2.lifetimeDeaths || 0} deaths, ${stats2.lifetimeAssists || 0} assists

Analyze both players' stats comprehensively and make your pick. Start your response with either "Player 1: ${player1}" or "Player 2: ${player2}" on the first line to indicate your choice, then explain why in 150-200 words. Be direct, analytical, and consider all aspects: consistency, champion pool, KDA, win rate, and overall impact.
`;

  const body = JSON.stringify({
    anthropic_version: "bedrock-2023-05-31",
    max_tokens: 400,
    messages: [{ role: "user", content: [{ type: "text", text: prompt }]}]
  });

  const res = await client.send(new InvokeModelCommand({
    modelId: process.env.BEDROCK_MODEL_ID || "anthropic.claude-3-sonnet-20240229-v1:0",
    contentType: "application/json",
    accept: "application/json",
    body
  }));

  const txt = await res.body.transformToString();
  const parsed = JSON.parse(txt);
  const content = parsed?.content?.[0]?.text || "Comparison unavailable.";
  
  // Extract which player was recommended from the first line
  const lines = content.split('\n');
  const firstLine = lines[0];
  let recommendation = '';
  
  if (firstLine.includes(`Player 1: ${player1}`)) {
    recommendation = player1;
  } else if (firstLine.includes(`Player 2: ${player2}`)) {
    recommendation = player2;
  } else if (firstLine.toLowerCase().includes('player 1')) {
    recommendation = player1;
  } else if (firstLine.toLowerCase().includes('player 2')) {
    recommendation = player2;
  }
  
  return {
    recommendation,
    analysis: content
  };
}

async function suggestChampions({ topChamps = [], matches = [] }) {
  const fallbackPool = topChamps.length
    ? topChamps.slice(0, 3).map((champ, idx) => ({
        name: champ.name || `Champion ${idx + 1}`,
        reason: `Demo suggestion based on your success with ${champ.name || "this champion"}.`,
      }))
    : [
        { name: "Karma", reason: "A reliable enchanter that pairs well with your current roster." },
        { name: "Ezreal", reason: "Mobile marksman to diversify your damage profile." },
        { name: "Sejuani", reason: "Frontline engage to complement your existing champions." },
      ];

  if (!process.env.AWS_ACCESS_KEY_ID) {
    return fallbackPool;
  }

  const topChampLines =
    topChamps && topChamps.length
      ? topChamps
          .map((c, index) => `${index + 1}. ${c.name || "Unknown"} - ${c.games || c.gamesPlayed || 0} games`)
          .join("\n")
      : "No top champion data";

  const matchLines =
    matches && matches.length
      ? matches
          .slice(0, 10)
          .map(
            (m, idx) =>
              `${idx + 1}. ${m.champion || "Unknown"} - ${m.kills ?? 0}/${m.deaths ?? 0}/${m.assists ?? 0} ${
                m.mode ? `(${m.mode})` : ""
              } ${m.win ? "Win" : "Loss"}`
          )
          .join("\n")
      : "No recent matches.";

  const prompt = `
You are an elite League of Legends coach. Recommend three new champions this player should try next.

Respond ONLY with a valid JSON array of exactly three objects. Each object must have:
- "name": Champion name
- "reason": A concise 1-2 sentence reason

Data to analyze:
Top Champions:
${topChampLines}

Recent Matches:
${matchLines}
`;

  const body = JSON.stringify({
    anthropic_version: "bedrock-2023-05-31",
    max_tokens: 400,
    temperature: 0.7,
    messages: [{ role: "user", content: [{ type: "text", text: prompt }]}],
  });

  try {
    const res = await client.send(
      new InvokeModelCommand({
        modelId: process.env.BEDROCK_MODEL_ID || "anthropic.claude-3-sonnet-20240229-v1:0",
        contentType: "application/json",
        accept: "application/json",
        body,
      })
    );

    const txt = await res.body.transformToString();
    const parsed = JSON.parse(txt);
    const content = parsed?.content?.[0]?.text?.trim() || "[]";

    let suggestions = [];
    try {
      suggestions = JSON.parse(content);
    } catch {
      // Sometimes the model might include extra prose; try to extract JSON via regex
      const match = content.match(/\[[\s\S]*\]/);
      if (match) {
        suggestions = JSON.parse(match[0]);
      }
    }

    if (!Array.isArray(suggestions) || !suggestions.length) {
      return fallbackPool;
    }

    return suggestions.slice(0, 3).map((item, index) => ({
      name: item.name || fallbackPool[index]?.name || `Champion ${index + 1}`,
      reason: item.reason || fallbackPool[index]?.reason || "A strong complementary champion.",
    }));
  } catch (err) {
    console.error("Bedrock suggestChampions failed:", err);
    return fallbackPool;
  }
}

module.exports = { generateSummaries, generateSummary, generateComparison, suggestChampions };
