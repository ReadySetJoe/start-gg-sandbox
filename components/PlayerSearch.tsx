import { useState } from "react";
import { useLazyQuery } from "@apollo/client";
import {
  GET_USER_BY_SLUG,
  GET_TOURNAMENT_ENTRANTS,
  SEARCH_RECENT_TOURNAMENTS,
} from "@/lib/queries";
import { Player, User } from "@/types/startgg";
import Image from "next/image";

interface PlayerSearchProps {
  onPlayerSelect: (player: Player) => void;
}

export default function PlayerSearch({ onPlayerSelect }: PlayerSearchProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<Player[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [searchType, setSearchType] = useState<"slug" | "tournament">("slug");

  const [getUserBySlug] = useLazyQuery(GET_USER_BY_SLUG);
  const [getTournamentEntrants] = useLazyQuery(GET_TOURNAMENT_ENTRANTS);
  const [getRecentTournaments] = useLazyQuery(SEARCH_RECENT_TOURNAMENTS);

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchQuery.trim()) return;

    setLoading(true);
    setError(null);
    setSearchResults([]);

    try {
      if (searchType === "slug") {
        await searchBySlug();
      } else {
        await searchByTournament();
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Search failed");
    } finally {
      setLoading(false);
    }
  };

  const searchBySlug = async () => {
    // Try searching by user slug (format: user/abc123)
    let slug = searchQuery.trim();
    if (!slug.startsWith("user/")) {
      slug = `user/${slug}`;
    }

    const { data } = await getUserBySlug({ variables: { slug } });

    if (data?.user) {
      const player: Player = {
        id: data.user.player?.id || data.user.id,
        gamerTag: data.user.player?.gamerTag || data.user.name || "Unknown",
        prefix: data.user.player?.prefix,
        user: data.user,
      };
      setSearchResults([player]);
    } else {
      setError(
        "Player not found. Try searching in recent tournaments instead."
      );
    }
  };

  const searchByTournament = async () => {
    // First get recent tournaments
    const { data: tournamentsData } = await getRecentTournaments({
      variables: { perPage: 10 },
    });

    if (!tournamentsData?.tournaments?.nodes?.length) {
      setError("No recent tournaments found");
      return;
    }

    const results: Player[] = [];

    // Search through recent tournaments for players matching the query
    for (const tournament of tournamentsData.tournaments.nodes.slice(0, 3)) {
      try {
        const { data: participantsData } = await getTournamentEntrants({
          variables: {
            slug: tournament.slug,
            perPage: 20,
            filter: searchQuery.trim(),
          },
        });

        if (participantsData?.tournament?.participants?.nodes) {
          const tournamentPlayers =
            participantsData.tournament.participants.nodes.map(
              (participant: {
                id: string;
                gamerTag: string;
                prefix?: string;
                user?: User;
              }) => ({
                id: participant.id,
                gamerTag: participant.gamerTag,
                prefix: participant.prefix,
                user: participant.user,
              })
            );

          results.push(...tournamentPlayers);
        }
      } catch (err) {
        // Failed to search tournament, continuing with next one
      }
    }

    if (results.length === 0) {
      setError(
        "No players found in recent tournaments. Try a different search term."
      );
    } else {
      // Remove duplicates based on gamerTag
      const uniquePlayers = results.filter(
        (player, index, self) =>
          index === self.findIndex(p => p.gamerTag === player.gamerTag)
      );
      setSearchResults(uniquePlayers.slice(0, 10));
    }
  };

  const profileImage = (player: Player) => {
    return player.user?.images?.find(img => img.type === "profile")?.url;
  };

  return (
    <div className="w-full max-w-2xl mx-auto">
      <form onSubmit={handleSearch} className="mb-6">
        <div className="mb-4">
          <div className="flex gap-4 justify-center">
            <label className="flex items-center gap-2">
              <input
                type="radio"
                name="searchType"
                value="slug"
                checked={searchType === "slug"}
                onChange={e => setSearchType(e.target.value as "slug")}
                className="text-blue-600"
              />
              <span className="text-sm text-gray-700 dark:text-gray-300">
                By User ID
              </span>
            </label>
            <label className="flex items-center gap-2">
              <input
                type="radio"
                name="searchType"
                value="tournament"
                checked={searchType === "tournament"}
                onChange={e => setSearchType(e.target.value as "tournament")}
                className="text-blue-600"
              />
              <span className="text-sm text-gray-700 dark:text-gray-300">
                In Tournaments
              </span>
            </label>
          </div>
        </div>

        <div className="flex gap-2">
          <input
            type="text"
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            placeholder={
              searchType === "slug"
                ? "Enter user ID (e.g. abc123 or user/abc123)"
                : "Search gamer tag in tournaments"
            }
            className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <button
            type="submit"
            disabled={loading}
            className="px-6 py-2 gradient-primary text-white rounded-lg hover:opacity-90 disabled:bg-gray-400 disabled:cursor-not-allowed transition-all"
          >
            {loading ? "Searching..." : "Search"}
          </button>
        </div>

        <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
          {searchType === "slug"
            ? "Search by exact user ID. Look for 8-character codes like 'abc12345' on player profiles."
            : "Search for players who participated in recent tournaments."}
        </p>
      </form>

      {error && (
        <div className="p-4 bg-red-100 dark:bg-red-900/20 text-red-700 dark:text-red-400 rounded-lg mb-4">
          {error}
        </div>
      )}

      {searchResults.length > 0 && (
        <div className="space-y-2">
          {searchResults.map((player: Player) => (
            <button
              key={`${player.id}-${player.gamerTag}`}
              onClick={() => onPlayerSelect(player)}
              className="w-full p-4 border border-gray-200 dark:border-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors flex items-center gap-4 text-left card-hover"
            >
              {profileImage(player) ? (
                <div className="relative w-12 h-12">
                  <Image
                    src={profileImage(player)!}
                    alt={player.gamerTag}
                    fill
                    className="rounded-full object-cover"
                  />
                </div>
              ) : (
                <div className="w-12 h-12 rounded-full bg-gray-200 dark:bg-gray-700 flex items-center justify-center">
                  <span className="text-gray-500 dark:text-gray-400 text-lg font-semibold">
                    {player.gamerTag[0].toUpperCase()}
                  </span>
                </div>
              )}
              <div className="flex-1">
                <div className="font-semibold text-gray-900 dark:text-gray-100">
                  {player.prefix && (
                    <span className="text-gray-600 dark:text-gray-400">
                      {player.prefix} |{" "}
                    </span>
                  )}
                  {player.gamerTag}
                </div>
                {player.user?.name && player.user.name !== player.gamerTag && (
                  <div className="text-sm text-gray-600 dark:text-gray-400">
                    {player.user.name}
                  </div>
                )}
                {player.user?.location && (
                  <div className="text-sm text-gray-500 dark:text-gray-500">
                    {[
                      player.user.location.city,
                      player.user.location.state,
                      player.user.location.country,
                    ]
                      .filter(Boolean)
                      .join(", ")}
                  </div>
                )}
                {player.user?.slug && (
                  <div className="text-xs text-gray-400 dark:text-gray-600">
                    ID: {player.user.slug.replace("user/", "")}
                  </div>
                )}
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
