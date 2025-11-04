// client/src/app/page.tsx
import { redirect } from "next/navigation";

<<<<<<< HEAD
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
  try {
    // encode whole Riot ID including #
    const { data } = await api.get(`/api/riot/${region}/${encodeURIComponent(name)}`);
    setData(data);
  } catch (e) {
    console.error(e);
    setData(null);
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
=======
export default function RootRedirect() {
  redirect("/home");
}
>>>>>>> main
