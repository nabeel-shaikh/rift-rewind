"use client";
import { useEffect, useState } from "react";

export default function StatsPage() {
  const [data, setData] = useState<any>(null);
  const [name, setName] = useState("");
  const [region, setRegion] = useState("");
  const [filterCount, setFilterCount] = useState(5);

  useEffect(() => {
    const storedData = sessionStorage.getItem("summonerData");
    const storedName = sessionStorage.getItem("summonerName");
    const storedRegion = sessionStorage.getItem("region");

    if (storedData) {
      setData(JSON.parse(storedData));
      setName(storedName || "");
      setRegion(storedRegion || "");
    }
  }, []);

  if (!data) {
    return (
      <div className="flex flex-col min-h-screen items-center justify-center text-white bg-[#101822]">
        <p>No data found. Please generate results from the Home page.</p>
      </div>
    );
  }

const matchesToShow = data.stats?.matches?.slice(0, filterCount) || [];


  return (
    <div className="min-h-screen bg-[#101822] text-white font-display flex flex-col">
      {/* Header */}
      <header className="flex items-center justify-between border-b border-white/10 px-6 py-4 md:px-10">
        <div className="flex items-center gap-2">
          <svg
            fill="currentColor"
            viewBox="0 0 48 48"
            xmlns="http://www.w3.org/2000/svg"
            className="w-6 h-6 text-white"
          >
            <path d="M42.17 20.17L27.83 5.83c1.31 1.31.57 4.36-1.63 7.94-1.35 2.19-3.24 4.58-5.53 6.88-2.3 2.3-4.68 4.18-6.88 5.53-3.58 2.2-6.63 2.94-7.94 1.63l14.35 14.35c1.31 1.31 4.36.57 7.94-1.63 2.19-1.35 4.58-3.24 6.88-5.53 2.3-2.3 4.18-4.68 5.53-6.88 2.2-3.58 2.94-6.63 1.63-7.94Z"></path>
          </svg>
          <h2 className="text-lg font-bold">Replay.gg</h2>
        </div>
        <div className="flex items-center gap-6 text-sm font-medium">
          <a className="text-gray-300 hover:text-[#00f6ff]" href="#">
            Dashboard
          </a>
          <a className="text-gray-300 hover:text-[#00f6ff]" href="#">
            Leaderboards
          </a>
          <button className="rounded-md bg-[#00f6ff]/10 px-4 py-2 text-[#00f6ff] hover:bg-[#00f6ff]/20">
            Rift ReWrapped
          </button>
        </div>
      </header>

      {/* Main */}
      <main className="flex flex-1 flex-col py-10 px-6 md:px-12 gap-10">
        {/* Top Section */}
        <section className="grid grid-cols-1 lg:grid-cols-3 gap-10">
          {/* Left: 3D Model Placeholder */}
          <div className="flex items-center justify-center rounded-xl border border-white/10 bg-white/5 p-6">
            <div className="h-64 w-64 flex items-center justify-center bg-gradient-to-br from-[#136dec33] to-transparent rounded-xl">
              {/* Placeholder for 3D Model */}
              <p className="text-gray-400 text-sm">3D Model Coming Soon</p>
            </div>
          </div>

          {/* Right: Summoner Info */}
          <div className="flex flex-col justify-between lg:col-span-2 gap-6">
            <div>
              <h1 className="text-3xl font-bold">
                {data.summoner?.name}
                <span className="text-gray-400">#{data.summoner?.tagLine}</span>
              </h1>
              <p className="text-gray-400">
                Level {data.summoner?.level} - Region {region.toUpperCase()}
              </p>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              <div className="bg-gray-800/50 border border-white/10 p-4 rounded-lg text-center">
                <p className="text-sm text-gray-400">Win Rate</p>
                <p className="text-2xl font-bold text-green-400">{data.winRate}%</p>
              </div>
              <div className="bg-gray-800/50 border border-white/10 p-4 rounded-lg text-center">
                <p className="text-sm text-gray-400">Avg. KDA</p>
                <p className="text-2xl font-bold">{data.kda}</p>
              </div>
              <div className="bg-gray-800/50 border border-white/10 p-4 rounded-lg text-center">
                <p className="text-sm text-gray-400">Matches</p>
                <p className="text-2xl font-bold">{data.totalGames}</p>
              </div>
              <div className="bg-gray-800/50 border border-white/10 p-4 rounded-lg text-center">
                <p className="text-sm text-gray-400">Top Role</p>
                <p className="text-md font-bold">
                  {data.topChamps?.map((c: any) => c.name).join(", ")}
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Match Filter Buttons */}
        <div className="flex gap-2 bg-gray-800/80 p-1 rounded-lg w-fit">
          {[5, 10, 15].map((count) => (
            <button
              key={count}
              onClick={() => setFilterCount(count)}
              className={`px-4 py-2 rounded-md text-sm font-semibold transition-colors ${
                filterCount === count
                  ? "bg-[#136dec] text-white"
                  : "text-gray-300 hover:bg-gray-700/50"
              }`}
            >
              {count} Games
            </button>
          ))}
        </div>

        {/* AI Coaching Summary */}
        <div className="rounded-lg border border-white/10 bg-gray-800/50 p-4">
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-[#00f6ff]">auto_awesome</span>
            <h3 className="font-semibold text-[#00f6ff]">AI Coaching</h3>
          </div>
          <p className="mt-2 text-sm text-gray-300">{data.summary}</p>
        </div>

        {/* Match Table */}
        <div className="flex flex-col border border-white/10 rounded-lg overflow-hidden bg-gray-800/50">
          <div className="hidden md:grid grid-cols-10 gap-4 px-4 py-2 text-sm font-semibold text-gray-400">
            <div className="col-span-4">Champion</div>
            <div className="col-span-3 text-center">K/D/A</div>
            <div className="col-span-1 text-center">Mode</div>
            <div className="col-span-2 text-center">Result</div>
          </div>

          {matchesToShow.map((match: any, i: number) => (
            <div
              key={i}
              className="grid grid-cols-2 md:grid-cols-10 items-center gap-4 p-4 border-t border-white/10"
            >
              <div className="flex items-center gap-3 md:col-span-4">
                <div className="h-10 w-10 rounded-md bg-gray-700 flex items-center justify-center">
                  <span className="text-sm font-bold">{match.champion}</span>
                </div>
                <div>
                  <p className="font-bold">{match.champion}</p>
                  <p className="text-xs text-gray-400">{match.mode}</p>
                </div>
              </div>
              <div className="md:col-span-3 text-center">
                <p className="text-lg font-semibold">
                  <span className="text-gray-200">{match.kills}</span> /{" "}
                  <span className="text-red-500">{match.deaths}</span> /{" "}
                  <span className="text-gray-200">{match.assists}</span>
                </p>
              </div>
              <div className="md:col-span-1 text-center text-sm text-gray-300">
                {match.mode || "—"}
              </div>
              <div className="md:col-span-2 flex justify-center">
                <span
                  className={`px-3 py-1 rounded-md text-sm font-semibold ${
                    match.win
                      ? "bg-green-500/10 text-green-400"
                      : "bg-red-500/10 text-red-400"
                  }`}
                >
                  {match.win ? "Victory" : "Defeat"}
                </span>
              </div>
            </div>
          ))}
        </div>
      </main>

      {/* Footer */}
      <footer className="text-center text-gray-500 text-sm py-10">
        © 2025 Replay.gg
      </footer>
    </div>
  );
}
