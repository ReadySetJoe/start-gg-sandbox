import { useQuery } from "@apollo/client";
import { GET_PLAYER_DETAILS } from "@/lib/queries";
import { PlayerDetails, Set } from "@/types/startgg";
import Image from "next/image";

interface PlayerProfileProps {
  playerId: string;
  onBack: () => void;
}

export default function PlayerProfile({
  playerId,
  onBack,
}: PlayerProfileProps) {
  const { loading, error, data } = useQuery(GET_PLAYER_DETAILS, {
    variables: { playerId },
  });

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="text-lg text-gray-600 dark:text-gray-400 animate-pulse">
          Loading player data...
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-4 bg-red-100 dark:bg-red-900/20 text-red-700 dark:text-red-400 rounded-lg">
        Error loading player: {error.message}
      </div>
    );
  }

  const player: PlayerDetails | undefined = data?.player;
  if (!player) {
    return <div>Player not found</div>;
  }

  const profileImage = player.user?.images?.find(
    img => img.type === "profile"
  )?.url;
  const recentSets = player.sets?.nodes || [];

  const getSetResult = (set: Set) => {
    const isWinner = set.winnerId === playerId;
    const playerSlot = set.slots?.find(slot =>
      slot.entrant?.participants?.some(p => p.id === playerId)
    );
    const opponentSlot = set.slots?.find(slot =>
      slot.entrant?.participants?.some(p => p.id !== playerId)
    );

    return {
      isWinner,
      playerScore: playerSlot?.standing?.stats?.score?.value || 0,
      opponentScore: opponentSlot?.standing?.stats?.score?.value || 0,
      opponentName: opponentSlot?.entrant?.name || "Unknown",
    };
  };

  return (
    <div className="max-w-4xl mx-auto">
      <button
        onClick={onBack}
        className="mb-6 text-primary dark:text-primary-400 hover:underline flex items-center gap-2"
      >
        ← Back to search
      </button>

      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6 mb-6 card-hover">
        <div className="flex items-start gap-6">
          {profileImage ? (
            <div className="relative w-24 h-24">
              <Image
                src={profileImage}
                alt={player.gamerTag}
                fill
                className="rounded-full object-cover"
              />
            </div>
          ) : (
            <div className="w-24 h-24 rounded-full bg-gray-200 dark:bg-gray-700 flex items-center justify-center">
              <span className="text-gray-500 dark:text-gray-400 text-3xl font-semibold">
                {player.gamerTag[0].toUpperCase()}
              </span>
            </div>
          )}

          <div className="flex-1">
            <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">
              {player.prefix && (
                <span className="text-gray-600 dark:text-gray-400">
                  {player.prefix} |{" "}
                </span>
              )}
              {player.gamerTag}
            </h1>
            {player.user?.name && player.user.name !== player.gamerTag && (
              <p className="text-lg text-gray-600 dark:text-gray-400">
                {player.user.name}
              </p>
            )}
            {player.user?.location && (
              <p className="text-gray-500 dark:text-gray-500 mt-1">
                📍{" "}
                {[
                  player.user.location.city,
                  player.user.location.state,
                  player.user.location.country,
                ]
                  .filter(Boolean)
                  .join(", ")}
              </p>
            )}
            {player.user?.bio && (
              <p className="text-gray-700 dark:text-gray-300 mt-3">
                {player.user.bio}
              </p>
            )}
            {player.user?.authorizations && (
              <div className="flex gap-4 mt-3">
                {player.user.authorizations.map(auth => (
                  <span
                    key={auth.type}
                    className="text-sm text-gray-600 dark:text-gray-400"
                  >
                    {auth.type}: {auth.externalUsername}
                  </span>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6 card-hover">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-4">
            Recent Match Results
          </h2>
          {recentSets.length === 0 ? (
            <p className="text-gray-500 dark:text-gray-400">
              No recent matches found
            </p>
          ) : (
            <div className="space-y-3">
              {recentSets.slice(0, 10).map((set: Set) => {
                const result = getSetResult(set);
                return (
                  <div
                    key={set.id}
                    className="border-b border-gray-200 dark:border-gray-700 pb-3 last:border-0"
                  >
                    <div className="flex justify-between items-center">
                      <div className="flex-1">
                        <div
                          className={`font-semibold ${
                            result.isWinner
                              ? "result-win text-green-600 dark:text-green-400"
                              : "result-loss text-red-600 dark:text-red-400"
                          }`}
                        >
                          vs {result.opponentName}
                        </div>
                        <div className="text-sm text-gray-600 dark:text-gray-400">
                          {set.displayScore ||
                            `${result.playerScore} - ${result.opponentScore}`}{" "}
                          • {set.fullRoundText || set.round}
                        </div>
                        <div className="text-xs text-gray-500 dark:text-gray-500">
                          {set.event.tournament.name}
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
