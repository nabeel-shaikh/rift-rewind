"use client";

import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { api } from "@/lib/axios";

type Suggestion = {
  name: string;
  reason: string;
};

const CARD_ASSETS = [
  "/assets/images/card1.png",
  "/assets/images/card2.png",
  "/assets/images/card3.png",
  "/assets/images/card4.png",
  "/assets/images/card5.png",
];

export default function RiftWrappedPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const region = searchParams.get("region") || "na1";
  const rawName = searchParams.get("name") || "";
  const rawTag = searchParams.get("tag") || region.toUpperCase();

  const [summaryData, setSummaryData] = useState<any>(null);
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const carouselRef = useRef<HTMLDivElement>(null);

  const fetchData = async () => {
    if (!rawName.trim()) {
      setError("Missing Riot ID. Please start from the home page.");
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError("");

      const summaryRes = await api.get(
        `/api/summary/${encodeURIComponent(rawName)}?tagLine=${encodeURIComponent(
          rawTag
        )}&region=${region}`
      );
      setSummaryData(summaryRes.data);

      try {
        const suggestionsRes = await api.post("/api/ai/suggestChampions", {
          topChamps: summaryRes.data?.stats?.topChamps ?? [],
          matches: summaryRes.data?.stats?.matches ?? [],
        });
        setSuggestions(Array.isArray(suggestionsRes.data) ? suggestionsRes.data : suggestionsRes.data?.suggestions ?? []);
      } catch (aiErr) {
        console.error("Bedrock suggestion failed:", aiErr);
        setSuggestions([]);
      }
    } catch (err: any) {
      console.error(err);
      setError(
        err?.response?.data?.error ||
          "We couldn’t generate your Rift Wrapped right now. Please try again."
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [rawName, rawTag, region]);

  const displayName = useMemo(() => {
    return (
      summaryData?.summoner?.name ||
      summaryData?.stats?.summoner?.name ||
      summaryData?.stats?.summoner?.gameName ||
      rawName ||
      "Summoner"
    );
  }, [summaryData, rawName]);

  const tagLine = useMemo(() => {
    return (
      summaryData?.stats?.summoner?.tagLine ||
      summaryData?.summoner?.tagLine ||
      rawTag
    );
  }, [summaryData, rawTag]);

  const topChampion = useMemo(() => {
    return summaryData?.stats?.topChamps?.[0] ?? null;
  }, [summaryData]);

  const matches = summaryData?.stats?.matches ?? [];
  const topChampionStats = useMemo(() => {
    if (!topChampion) return null;
    const champMatches = matches.filter(
      (match: any) => match?.champion?.toLowerCase() === topChampion.name?.toLowerCase()
    );
    if (!champMatches.length) {
      return {
        games: topChampion.games ?? topChampion.gamesPlayed ?? 0,
        avgKda: null,
        avgKills: null,
        avgDeaths: null,
        avgAssists: null,
      };
    }

    const totals = champMatches.reduce(
      (acc: any, match: any) => {
        return {
          games: acc.games + 1,
          kills: acc.kills + (match?.kills ?? 0),
          deaths: acc.deaths + (match?.deaths ?? 0),
          assists: acc.assists + (match?.assists ?? 0),
        };
      },
      { games: 0, kills: 0, deaths: 0, assists: 0 }
    );

    const avgKills = totals.games ? totals.kills / totals.games : null;
    const avgDeaths = totals.games ? totals.deaths / totals.games : null;
    const avgAssists = totals.games ? totals.assists / totals.games : null;
    const avgKda =
      totals.deaths > 0
        ? (totals.kills + totals.assists) / Math.max(totals.deaths, 1)
        : totals.kills + totals.assists;

    return {
      games: topChampion.games ?? topChampion.gamesPlayed ?? totals.games,
      avgKills,
      avgDeaths,
      avgAssists,
      avgKda,
    };
  }, [matches, topChampion]);
  const totalGamesPlayed = matches.length;

  const highestKillsEntry = useMemo(() => {
    return matches.reduce(
      (best: { champion: string; kills: number } | null, match: any) => {
        if (!best || (match?.kills ?? 0) > best.kills) {
          return { champion: match?.champion ?? "Unknown", kills: match?.kills ?? 0 };
        }
        return best;
      },
      null
    );
  }, [matches]);

  const cards = useMemo(() => {
    const formattedSuggestions =
      suggestions.length > 0
        ? suggestions
        : [
            {
              name: "Karma",
              reason: "A reliable enchanter that pairs well with your current roster.",
            },
          ];

    return [
      {
        id: 1,
        title: `Welcome back, ${displayName}!`,
        subtitle: "A look back at your year on the Rift.",
        image: CARD_ASSETS[0],
        content: (
          <p className="text-gray-200 text-sm sm:text-base max-w-sm">
            Ready to relive your greatest plays? Scroll through to see the highlights that made 2025 unforgettable.
          </p>
        ),
      },
      {
        id: 2,
        title: "Your Top Champion",
        subtitle: topChampion
          ? `${topChampion.name} • ${
              topChampionStats?.games ?? topChampion.gamesPlayed ?? topChampion.games ?? "—"
            } games`
          : "No champion data available",
        image: CARD_ASSETS[1],
        content: topChampion ? (
          <div className="flex items-center gap-4">
            <img
              src={`https://ddragon.leagueoflegends.com/cdn/14.20.1/img/champion/${topChampion.name}.png`}
              alt={topChampion.name}
              className="h-16 w-16 rounded-lg border border-white/20 object-cover"
              onError={(e) => {
                e.currentTarget.src =
                  "https://ddragon.leagueoflegends.com/cdn/14.20.1/img/champion/Aatrox.png";
              }}
            />
            <div className="text-left space-y-1">
              <p className="text-gray-200 text-sm sm:text-base">
                Average KDA:{" "}
                <span className="font-semibold">
                  {typeof topChampionStats?.avgKda === "number"
                    ? topChampionStats.avgKda.toFixed(2)
                    : "—"}
                </span>
              </p>
              <p className="text-gray-200 text-sm sm:text-base">
                Avg K / D / A:{" "}
                <span className="font-semibold">
                  {typeof topChampionStats?.avgKills === "number"
                    ? topChampionStats.avgKills.toFixed(1)
                    : "—"}{" "}
                  /{" "}
                  {typeof topChampionStats?.avgDeaths === "number"
                    ? topChampionStats.avgDeaths.toFixed(1)
                    : "—"}{" "}
                  /{" "}
                  {typeof topChampionStats?.avgAssists === "number"
                    ? topChampionStats.avgAssists.toFixed(1)
                    : "—"}
                </span>
              </p>
            </div>
          </div>
        ) : (
          <p className="text-gray-200 text-sm sm:text-base">
            Play a few matches to unlock your top champion insights.
          </p>
        ),
      },
      {
        id: 3,
        title: "Total Games Played",
        subtitle: `${totalGamesPlayed} matches logged`,
        image: CARD_ASSETS[2],
        content: (
          <div className="text-5xl font-black text-white drop-shadow-[0_0_12px_rgba(76,201,240,0.6)]">
            {totalGamesPlayed}
          </div>
        ),
      },
      {
        id: 4,
        title: "Highest Kills",
        subtitle: highestKillsEntry
          ? `${highestKillsEntry.kills} kills with ${highestKillsEntry.champion}`
          : "We’re still gathering your kill record.",
        image: CARD_ASSETS[3],
        content: (
          <p className="text-gray-200 text-sm sm:text-base">
            That pop-off game is worth remembering—plan your next win streak to beat it!
          </p>
        ),
      },
      {
        id: 5,
        title: "AI Suggests You Try",
        subtitle: "Three champions tailored to your playstyle",
        image: CARD_ASSETS[4],
        content: (
          <ul className="space-y-2 text-left text-sm sm:text-base text-gray-200">
            {formattedSuggestions.slice(0, 3).map((suggestion, index) => (
              <li key={`${suggestion.name}-${index}`} className="flex gap-3">
                <span className="text-[#00f6ff] font-semibold min-w-[1.5rem]">
                  {index + 1}.
                </span>
                <div>
                  <p className="font-semibold text-white">{suggestion.name}</p>
                  <p className="text-gray-300 text-xs sm:text-sm leading-relaxed">
                    {suggestion.reason}
                  </p>
                </div>
              </li>
            ))}
          </ul>
        ),
      },
    ];
  }, [displayName, topChampion, totalGamesPlayed, highestKillsEntry, suggestions]);

  const scrollCarousel = (direction: "left" | "right") => {
    const container = carouselRef.current;
    if (!container) return;

    const cardWidth =
      container.querySelector<HTMLElement>("[data-card-item]")?.offsetWidth || 320;
    const scrollAmount = cardWidth + 24; // include gap
    container.scrollBy({
      left: direction === "left" ? -scrollAmount : scrollAmount,
      behavior: "smooth",
    });
  };

  const statsHref = useMemo(() => {
    if (!rawName.trim()) return "/stats";
    return `/stats?region=${region}&name=${encodeURIComponent(rawName)}&tag=${encodeURIComponent(
      rawTag
    )}`;
  }, [region, rawName, rawTag]);

  if (loading) {
    return (
      <div className="flex flex-col min-h-screen items-center justify-center bg-[#101822] text-white gap-4">
        <div className="h-12 w-12 border-4 border-[#00f6ff] border-t-transparent rounded-full animate-spin" />
        <p className="text-gray-300 text-sm">Generating your Rift Wrapped…</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col min-h-screen items-center justify-center bg-[#101822] text-white gap-6 px-6 text-center">
        <h2 className="text-2xl font-bold text-red-400">Something went wrong</h2>
        <p className="text-gray-300 max-w-md">{error}</p>
        <div className="flex gap-4">
          <button
            onClick={fetchData}
            className="rounded-md bg-[#136dec] px-4 py-2 text-white hover:bg-[#0f57b6] transition-colors"
          >
            Retry
          </button>
          <button
            onClick={() => router.push("/home")}
            className="rounded-md border border-white/30 px-4 py-2 text-white hover:bg-white/10 transition-colors"
          >
            Back to Home
          </button>
        </div>
      </div>
    );
  }

  return (
    <div
      className="min-h-screen text-white font-display flex flex-col"
      style={{
        backgroundColor: "#0a1220",
        backgroundImage:
          "linear-gradient(135deg, rgba(19,109,236,0.35), rgba(10,18,32,0.95)), url('/assets/images/wrapped_page.png')",
        backgroundRepeat: "no-repeat, repeat",
        backgroundSize: "cover",
        backgroundAttachment: "fixed",
      }}
    >
      <header className="flex items-center justify-between border-b border-white/10 px-6 py-4 md:px-10">
        <Link href={statsHref} className="text-sm text-gray-300 hover:text-white transition-colors">
          ← Back to Stats
        </Link>
        <div className="text-center">
          <h1 className="text-3xl sm:text-4xl font-bold bg-gradient-to-r from-[#4cc9f0] via-[#a855f7] to-[#f72585] bg-clip-text text-transparent drop-shadow-[0_0_12px_rgba(79,209,197,0.6)]">
            Your 2025 Rift Wrapped
          </h1>
          <p className="text-gray-300 text-sm sm:text-base mt-1">
            Spotify Wrapped made for League of Legends
          </p>
        </div>
        <div className="w-24" />
      </header>

      <main className="flex-1 flex flex-col gap-10 px-6 md:px-12 py-10">
        <section className="relative">
          <div className="hidden md:flex items-center justify-between mb-4">
            <button
              onClick={() => scrollCarousel("left")}
              className="h-10 w-10 rounded-full bg-white/10 hover:bg-white/20 transition-colors flex items-center justify-center text-lg"
              aria-label="Scroll left"
            >
              ←
            </button>
            <button
              onClick={() => scrollCarousel("right")}
              className="h-10 w-10 rounded-full bg-white/10 hover:bg-white/20 transition-colors flex items-center justify-center text-lg"
              aria-label="Scroll right"
            >
              →
            </button>
          </div>

          <div
            ref={carouselRef}
            className="flex gap-6 overflow-x-auto snap-x snap-mandatory pb-4 md:pb-6 scrollbar-thin scrollbar-thumb-white/20 scrollbar-track-transparent"
          >
            {cards.map((card, index) => (
              <article
                key={card.id}
                data-card-item
                className="relative min-w-[280px] sm:min-w-[320px] md:min-w-[360px] lg:min-w-[380px] snap-center rounded-3xl overflow-hidden border border-white/10 bg-white/5 backdrop-blur-md shadow-[0_25px_45px_rgba(15,15,45,0.45)] transition-transform duration-300 hover:scale-[1.03] group"
              >
                <div
                  className="absolute inset-0 opacity-30 group-hover:opacity-40 transition-opacity duration-300"
                  style={{
                    backgroundImage: `url(${CARD_ASSETS[index] || CARD_ASSETS[0]})`,
                    backgroundSize: "cover",
                    backgroundPosition: "center",
                  }}
                />
                <div className="relative z-10 flex flex-col gap-4 p-6">
                  <div>
                    <h2 className="text-xl font-semibold text-white drop-shadow">
                      {card.title}
                    </h2>
                    <p className="text-gray-200 text-sm mt-1">{card.subtitle}</p>
                  </div>
                  <div>{card.content}</div>
                </div>
              </article>
            ))}
          </div>
        </section>

        <div className="flex justify-center">
          <Link
            href={statsHref}
            className="inline-flex items-center gap-2 rounded-md bg-[#00f6ff]/15 border border-[#00f6ff]/40 px-5 py-2 text-[#00f6ff] hover:bg-[#00f6ff]/25 transition-colors"
          >
            ← Back to Stats
          </Link>
        </div>
      </main>

      <footer className="px-6 md:px-12 py-8 text-center text-gray-400 text-sm">
        © 2025 Replay.gg • Your year on the Rift, remixed.
      </footer>
    </div>
  );
}

/**
 * To tweak the Bedrock prompt, adjust the payload in `/api/ai/suggestChampions`.
 * You can include more context (e.g., win rate, preferred roles) and return more
 * than three champions—just update the `formattedSuggestions` slice and the cards array.
 */

