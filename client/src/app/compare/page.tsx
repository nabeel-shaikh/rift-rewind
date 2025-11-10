"use client";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { api } from "@/lib/axios";

type ComparisonResult = {
  region: string;
  players: Array<{
    name: string;
    tagLine: string;
    winRate: string;
    kda: string;
    totalGames: number;
    topChamps: Array<{ name: string; games: number }>;
  }>;
  winnerByWinRate: string;
  aiAnalysis: {
    recommendation: string;
    analysis: string;
  };
};

export default function Compare() {
  const router = useRouter();
  const [region1, setRegion1] = useState("na1");
  const [name1, setName1] = useState("");
  const [region2, setRegion2] = useState("na1");
  const [name2, setName2] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [result, setResult] = useState<ComparisonResult | null>(null);

  const handleCompare = async () => {
    if (!name1.trim() || !name2.trim()) {
      setError("Please enter both Riot IDs");
      return;
    }

    setLoading(true);
    setError("");
    setResult(null);

    try {
      const [gameName1, tag1 = region1.toUpperCase()] = name1.split("#");
      const [gameName2, tag2 = region2.toUpperCase()] = name2.split("#");

      const response = await api.get("/api/riot/compareStats", {
        params: {
          region: region1,
          a: gameName1,
          atag: tag1,
          b: gameName2,
          btag: tag2,
        }
      });

      setResult(response.data);
    } catch (err: any) {
      setError(err.response?.data?.error || "Failed to compare players");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className="min-h-screen flex flex-col bg-[#101822] text-white font-display"
      style={{
        backgroundImage: "url('assets/images/compare_page.png')",
        backgroundSize: "cover",
        backgroundPosition: "center",
      }}
    >
      <header className="flex items-center justify-between border-b border-white/10 px-6 py-4 md:px-10">
        <button
          onClick={() => router.back()}
          className="text-sm text-gray-300 hover:text-white transition-colors"
        >
          ← Back
        </button>
        <Link href="/" className="flex items-center gap-3 hover:opacity-80 transition">
          <svg
            fill="currentColor"
            viewBox="0 0 48 48"
            xmlns="http://www.w3.org/2000/svg"
            className="w-6 h-6 text-white"
          >
            <path d="M42.17 20.17L27.83 5.83c1.31 1.31.57 4.36-1.63 7.94-1.35 2.19-3.24 4.58-5.53 6.88-2.3 2.3-4.68 4.18-6.88 5.53-3.58 2.2-6.63 2.94-7.94 1.63l14.35 14.35c1.31 1.31 4.36.57 7.94-1.63 2.19-1.35 4.58-3.24 6.88-5.53 2.3-2.3 4.18-4.68 5.53-6.88 2.2-3.58 2.94-6.63 1.63-7.94Z"></path>
          </svg>
          <h2 className="text-lg font-bold">Replay.gg</h2>
        </Link>
        <div className="w-16" />
      </header>

      <main className="flex flex-1 flex-col items-center justify-center text-center p-6 space-y-8">
        <div>
          <h2 className="text-3xl font-bold">LOL Player Comparator</h2>
          <p className="text-gray-300 text-lg mt-2">
            Want to know who's better? Compare their stats and see who's got the edge!
          </p>
        </div>

        {/* Player 1 Input */}
        <div className="w-full max-w-2xl space-y-4">
          <div className="text-left">
            <label className="block text-sm font-medium text-gray-400 mb-2">
              Player 1
            </label>
            <div className="flex gap-2 flex-wrap">
              <select
                className="border border-gray-500 bg-gray-800 text-white px-3 py-2 rounded"
                value={region1}
                onChange={(e) => setRegion1(e.target.value)}
              >
                <option value="na1">NA</option>
                <option value="euw1">EUW</option>
                <option value="eun1">EUNE</option>
                <option value="kr">KR</option>
              </select>

              <input
                value={name1}
                onChange={(e) => setName1(e.target.value)}
                placeholder="Enter Riot ID (e.g., Player#NA1)"
                className="flex-1 border border-gray-500 bg-gray-800 text-white px-3 py-2 rounded min-w-[200px]"
              />
            </div>
          </div>

          {/* VS Divider */}
          <div className="flex items-center justify-center">
            <div className="flex-1 border-t border-gray-600"></div>
            <span className="px-4 text-gray-400 font-bold">VS</span>
            <div className="flex-1 border-t border-gray-600"></div>
          </div>

          {/* Player 2 Input */}
          <div className="text-left">
            <label className="block text-sm font-medium text-gray-400 mb-2">
              Player 2
            </label>
            <div className="flex gap-2 flex-wrap">
              <select
                className="border border-gray-500 bg-gray-800 text-white px-3 py-2 rounded"
                value={region2}
                onChange={(e) => setRegion2(e.target.value)}
              >
                <option value="na1">NA</option>
                <option value="euw1">EUW</option>
                <option value="eun1">EUNE</option>
                <option value="kr">KR</option>
              </select>

              <input
                value={name2}
                onChange={(e) => setName2(e.target.value)}
                placeholder="Enter Riot ID (e.g., Player#NA1)"
                className="flex-1 border border-gray-500 bg-gray-800 text-white px-3 py-2 rounded min-w-[200px]"
              />
            </div>
          </div>

          {/* Compare Button */}
          <div className="flex justify-center pt-4">
            <button
              onClick={handleCompare}
              disabled={loading}
              className="border border-gray-500 px-8 py-3 rounded bg-blue-600 hover:bg-blue-500 disabled:opacity-50 transition-colors text-lg font-semibold"
            >
              {loading ? "Loading…" : "Compare Players"}
            </button>
          </div>
        </div>

        {/* Error Message */}
        {error && (
          <div className="text-red-500 bg-red-500/10 border border-red-500/20 px-4 py-2 rounded">
            {error}
          </div>
        )}

        {/* Results Display */}
        {result && (
          <div className="w-full max-w-4xl space-y-6 mt-8">
            {/* Player Stats Comparison */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {result.players.map((player, idx) => (
                <div
                  key={idx}
                  className="bg-gray-800/50 border border-gray-700 rounded-lg p-6"
                >
                  <h3 className="text-xl font-bold mb-4">
                    {player.name}#{player.tagLine}
                  </h3>
                  <div className="space-y-2 text-left">
                    <div className="flex justify-between">
                      <span className="text-gray-400">Win Rate:</span>
                      <span className="font-semibold">{player.winRate}%</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-400">KDA:</span>
                      <span className="font-semibold">{player.kda}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-400">Games Played:</span>
                      <span className="font-semibold">{player.totalGames}</span>
                    </div>
                    <div className="mt-4">
                      <span className="text-gray-400 block mb-2">Top Champions:</span>
                      <div className="space-y-1">
                        {player.topChamps.map((champ, i) => (
                          <div key={i} className="text-sm">
                            {champ.name} ({champ.games} games)
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* AI Analysis */}
            <div className="bg-gradient-to-br from-blue-900/30 to-purple-900/30 border border-blue-500/30 rounded-lg p-6">
              <div className="flex items-center gap-3 mb-4">
                <svg
                  className="w-6 h-6 text-blue-400"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z"
                  />
                </svg>
                <h3 className="text-2xl font-bold text-blue-300">AI Analysis</h3>
              </div>
              
              {result.aiAnalysis.recommendation && (
                <div className="mb-4 p-4 bg-blue-500/10 border border-blue-500/30 rounded">
                  <p className="text-lg font-semibold text-blue-300">
                    🏆 Recommended Pick: {result.aiAnalysis.recommendation}
                  </p>
                </div>
              )}
              
              <div className="text-gray-300 whitespace-pre-wrap leading-relaxed">
                {result.aiAnalysis.analysis}
              </div>
            </div>
          </div>
        )}
      </main>

      <footer className="flex flex-col items-center gap-4 py-10 text-gray-400 text-sm">
        <div className="flex flex-wrap justify-center gap-x-8 gap-y-4">
          <a
            href="/home"
            className="hover:text-white transition-colors"
          >
            Back to Home
          </a>
          <a
            href="https://github.com/nabeel-shaikh/rift-rewind"
            target="_blank"
            rel="noopener noreferrer"
            className="hover:text-white transition-colors"
          >
            GitHub
          </a>
          <p>© 2025 Replay.gg. Not affiliated with Riot Games, Inc. or League of Legends.</p>
        </div>
      </footer>
    </div>
  );
}
