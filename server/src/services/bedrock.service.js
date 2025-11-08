const { BedrockRuntimeClient, InvokeModelCommand } = require("@aws-sdk/client-bedrock-runtime");

const client = new BedrockRuntimeClient({
  region: process.env.AWS_REGION || "us-east-1",
  credentials: process.env.AWS_ACCESS_KEY_ID ? {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY
  } : undefined
});

// Turn your numeric stats into a friendly recap
async function generateSummary({ summonerName, stats }) {
  // If Bedrock isn’t configured yet, return a demo string (helps dev UX)
  if (!process.env.AWS_ACCESS_KEY_ID) {
    return `Demo summary for ${summonerName}: ${stats.winRate}% win rate, KDA ${stats.kda}. Top champs: ${stats.topChamps.map(c=>c.name).join(", ")}.`;
  }

  const prompt = `
You are an enthusiastic League of Legends coach.
Create a short, upbeat recap for the player below.
Keep it to 120-160 words. Use second person ("you").

Player: ${summonerName}
Stats (last ${stats.totalGames} games):
- Win rate: ${stats.winRate}%
- KDA: ${stats.kda}
- Top champions: ${stats.topChamps.map(c => `${c.name} (${c.games})`).join(", ")}
`;

  const body = JSON.stringify({
    anthropic_version: "bedrock-2023-05-31",
    max_tokens: 350,
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
  const content = parsed?.content?.[0]?.text || "Summary unavailable.";
  return content;
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

module.exports = { generateSummary, generateComparison };
