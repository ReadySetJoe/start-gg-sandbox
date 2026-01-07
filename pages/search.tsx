import { useState } from "react";
import { useRouter } from "next/router";
import { useLazyQuery } from "@apollo/client";
import PlayerSearch from "@/components/PlayerSearch";
import SearchHelp from "@/components/SearchHelp";
import { Player } from "@/types/startgg";
import { GET_USER_BY_SLUG } from "@/lib/queries";
import { EXAMPLE_PLAYERS } from "@/lib/example-players";

export default function Search() {
  const router = useRouter();
  const [loadingExample, setLoadingExample] = useState<string | null>(null);
  const [getUserBySlug] = useLazyQuery(GET_USER_BY_SLUG);

  const handlePlayerSelect = (player: Player) => {
    // Navigate to the player profile page with the player ID
    router.push(`/player/${player.id}`);
  };

  const loadExamplePlayer = async (slug: string) => {
    setLoadingExample(slug);
    try {
      const fullSlug = slug.startsWith("user/") ? slug : `user/${slug}`;
      const { data } = await getUserBySlug({ variables: { slug: fullSlug } });

      if (data?.user) {
        const playerId = data.user.player?.id || data.user.id;
        router.push(`/player/${playerId}`);
      }
    } catch (error) {
      console.error("Failed to load example player:", error);
    } finally {
      setLoadingExample(null);
    }
  };

  const hasExamplePlayers = EXAMPLE_PLAYERS.length > 0;

  return (
    <>
      <h1 className="text-4xl font-bold text-center text-gradient mb-8">
        Search Players
      </h1>

      <SearchHelp />
      <PlayerSearch onPlayerSelect={handlePlayerSelect} />

      {hasExamplePlayers && (
        <div className="w-full max-w-3xl mx-auto mt-8">
          <div className="bg-accent-50 dark:bg-accent-900/20 border border-accent-200 dark:border-accent-800 rounded-lg p-6">
            <h3 className="font-semibold text-accent-900 dark:text-accent-100 mb-3">
              Try an Example Player
            </h3>
            <p className="text-sm text-accent-800 dark:text-accent-200 mb-4">
              New to the app? Click on one of these players to see how it works:
            </p>
            <div className="flex flex-wrap gap-2">
              {EXAMPLE_PLAYERS.map(example => (
                <button
                  key={example.slug}
                  onClick={() => loadExamplePlayer(example.slug)}
                  disabled={loadingExample !== null}
                  className="px-4 py-2 bg-accent hover:bg-accent-600 text-white rounded-lg disabled:bg-gray-400 disabled:cursor-not-allowed transition-all text-sm"
                >
                  {loadingExample === example.slug
                    ? "Loading..."
                    : example.name}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
