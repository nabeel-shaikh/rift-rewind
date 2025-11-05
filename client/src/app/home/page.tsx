"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { api } from "@/lib/axios";

type CombinedResponse = {
  stats: any;
  summary: string;
};

export default function Home() {
  const [region, setRegion] = useState("na1");
  const [name, setName] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const router = useRouter();

  const fetchAll = async () => {
    if (!name.trim()) return;
    setLoading(true);
    setError("");

    try {
      const [gameName, tag = region.toUpperCase()] = name.split("#"); // default tag from region
      const response = await api.get<CombinedResponse>(
        `/api/summary/${encodeURIComponent(gameName)}?tagLine=${encodeURIComponent(tag)}`
      );

      // ✅ Save the data to sessionStorage
      sessionStorage.setItem("summonerData", JSON.stringify(response.data));
      sessionStorage.setItem("summonerName", gameName);
      sessionStorage.setItem("region", region);

      // ✅ Redirect to /stats
      router.push("/stats");
    } catch (e: any) {
      console.error("Fetch failed:", e);
      setError("Failed to load data. Check the Riot ID (name#tag) and try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-[#101822] text-white font-display">
      <header className="flex items-center justify-center border-b border-white/10 px-6 py-4 md:px-10">
        <div className="flex items-center gap-3">
          <svg
            fill="currentColor"
            viewBox="0 0 48 48"
            xmlns="http://www.w3.org/2000/svg"
            className="w-6 h-6 text-white"
          >
            <path d="M42.17 20.17L27.83 5.83c1.31 1.31.57 4.36-1.63 7.94-1.35 2.19-3.24 4.58-5.53 6.88-2.3 2.3-4.68 4.18-6.88 5.53-3.58 2.2-6.63 2.94-7.94 1.63l14.35 14.35c1.31 1.31 4.36.57 7.94-1.63 2.19-1.35 4.58-3.24 6.88-5.53 2.3-2.3 4.18-4.68 5.53-6.88 2.2-3.58 2.94-6.63 1.63-7.94Z"></path>
          </svg>
        </div>
      </header>

      <main className="flex flex-1 flex-col items-center justify-center text-center p-6 space-y-4">
        <h2 className="text-3xl font-bold">Replay.gg</h2>
        <p className="text-gray-300 text-lg mb-6">
          AI-powered League of Legends performance analysis — try our Wrapped Feature!
        </p>

        {/* Input Controls */}
        <div className="flex gap-2 flex-wrap justify-center">
          <select
            className="border border-gray-500 bg-gray-800 text-white px-3 py-2 rounded"
            value={region}
            onChange={(e) => setRegion(e.target.value)}
          >
            <option value="na1">NA</option>
            <option value="euw1">EUW</option>
            <option value="eun1">EUNE</option>
            <option value="kr">KR</option>
          </select>

          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Enter Your Riot ID"
            className="border border-gray-500 bg-gray-800 text-white px-3 py-2 rounded"
          />

          <button
            onClick={fetchAll}
            disabled={loading}
            className="border border-gray-500 px-4 py-2 rounded bg-blue-600 hover:bg-blue-500 disabled:opacity-50"
          >
            {loading ? "Loading…" : "Generate"}
          </button>
        </div>

        {/* Error Message */}
        {error && <div className="text-red-500">{error}</div>}
      </main>

      <footer className="flex flex-col items-center gap-4 py-10 text-gray-400 text-sm">
        <div className="flex flex-wrap justify-center gap-x-8 gap-y-4">
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
