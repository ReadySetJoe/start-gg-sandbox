import { useState } from "react";
import { useLazyQuery } from "@apollo/client";
import { GET_USER_BY_SLUG } from "@/lib/queries";
import { Player } from "@/types/startgg";
import Image from "next/image";

interface PlayerSearchProps {
  onPlayerSelect: (player: Player) => void;
  handleCancel?: () => void;
}

export default function PlayerSearch({
  onPlayerSelect,
  handleCancel,
}: PlayerSearchProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<Player[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [getUserBySlug] = useLazyQuery(GET_USER_BY_SLUG);

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchQuery.trim()) return;

    setLoading(true);
    setError(null);
    setSearchResults([]);

    try {
      await searchBySlug();
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

  const profileImage = (player: Player) => {
    return player.user?.images?.find(img => img.type === "profile")?.url;
  };

  return (
    <div className="w-full max-w-3xl mx-auto">
      <form onSubmit={handleSearch} className="mb-6">
        <div className="flex gap-2">
          <input
            type="text"
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            placeholder="Enter user ID (e.g. abc123 or user/abc123)"
            className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-primary"
          />
          <button
            type="submit"
            disabled={loading}
            className="px-6 py-2 gradient-primary text-white rounded-lg hover:opacity-90 disabled:bg-gray-400 disabled:cursor-not-allowed transition-all"
          >
            {loading ? "Searching..." : "Search"}
          </button>
          {handleCancel && (
            <button
              type="button"
              onClick={handleCancel}
              className="text-gray-500 hover:text-red-500 dark:text-gray-400 dark:hover:text-red-400 ml-1 rounded-lg px-3 py-2 bg-gray-100 dark:bg-gray-700 transition-colors"
            >
              Cancel
            </button>
          )}
        </div>

        <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
          Search by exact user ID. Look for 8-character codes like
          &apos;abc12345&apos; on player profiles.
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
