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

module.exports = { generateSummary };
