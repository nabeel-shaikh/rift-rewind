"use client";
import { useState } from "react";
import { api } from "@/lib/axios";

type CombinedResponse = {
  stats: any;
  summary: string;
};

export default function Home() {
  const [region, setRegion] = useState("na1");
  const [name, setName] = useState("");
  const [data, setData] = useState<CombinedResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const fetchAll = async () => {
    if (!name.trim()) return;
    setLoading(true);
    setError("");
    setData(null);

    try {
      // ✅ FIX 1: Use backticks for template literals
      // ✅ FIX 2: Updated path to match backend route: /api/summary/:summonerName
      // Include region as query param, since backend can read it from req.query.region
      const response = await api.get<CombinedResponse>(
        `/api/summary/${encodeURIComponent(name)}?region=${region}`
      );

      setData(response.data);
    } catch (e: any) {
      console.error("Fetch failed:", e);
      setError("Failed to load data. Check the name or try again later.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="p-6 space-y-4">
      <h1 className="text-2xl font-bold">Rift Rewind (real-time)</h1>

      {/* Input Controls */}
      <div className="flex gap-2">
        <select
          className="border px-2 py-1 rounded"
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
          placeholder="Summoner name"
          className="border px-2 py-1 rounded"
        />

        <button
          onClick={fetchAll}
          disabled={loading}
          className="border px-3 py-1 rounded bg-gray-100 hover:bg-gray-200"
        >
          {loading ? "Loading…" : "Generate"}
        </button>
      </div>

      {/* Error Message */}
      {error && <div className="text-red-500">{error}</div>}

      {/* Display Results */}
      {data && (
        <div className="space-y-4">
          <section>
            <h2 className="font-semibold">AI Summary</h2>
            <pre className="whitespace-pre-wrap">{data.summary}</pre>
          </section>

          <section>
            <h2 className="font-semibold">Raw Stats</h2>
            <pre className="overflow-auto p-2 bg-gray-50 rounded text-sm">
              {JSON.stringify(data.stats, null, 2)}
            </pre>
          </section>
        </div>
      )}
    </main>
  );
}
