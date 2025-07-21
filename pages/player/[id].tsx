import { useRouter } from "next/router";
import Link from "next/link";
import { useQuery } from "@apollo/client";
import { GET_PLAYER_DETAILS } from "@/lib/queries";
import { PlayerDetails, Set } from "@/types/startgg";
import Image from "next/image";
import PerformanceAnalysis from "@/components/PerformanceAnalysis";
import PowerRankingTools from "@/components/PowerRankingTools";

export default function PlayerProfilePage() {
  const router = useRouter();
  const { id: playerId } = router.query;

  const { loading, error, data } = useQuery(GET_PLAYER_DETAILS, {
    variables: { playerId },
    skip: !playerId,
  });

  if (!playerId) {
    return <div>Loading...</div>;
  }

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
      <>
        <div className="mb-6">
          <Link
            href="/search"
            className="text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-2"
          >
            ← Back to Search
          </Link>
        </div>
        <div className="p-4 bg-red-100 dark:bg-red-900/20 text-red-700 dark:text-red-400 rounded-lg">
          Error loading player: {error.message}
        </div>
      </>
    );
  }

  const player: PlayerDetails | undefined = data?.player;
  if (!player) {
    return (
      <>
        <div className="mb-6">
          <Link
            href="/search"
            className="text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-2"
          >
            ← Back to Search
          </Link>
        </div>
        <div>Player not found</div>
      </>
    );
  }

  const profileImage = player.user?.images?.find(
    img => img.type === "profile"
  )?.url;
  const recentSets = player.sets?.nodes || [];

  const getSetResult = (set: Set) => {
    // Log set structure for debugging
    console.log("Set structure:", {
      winnerId: set.winnerId,
      slots: set.slots?.map(slot => ({
        entrantId: slot.entrant?.id,
        entrantName: slot.entrant?.name,
        participants: slot.entrant?.participants?.map(p => ({
          id: p.id,
          gamerTag: p.gamerTag,
        })),
      })),
    });

    // Try different approaches to find the player's slot
    let playerSlot = set.slots?.find(slot =>
      slot.entrant?.participants?.some(p => String(p.id) === String(playerId))
    );

    // If not found by participant ID, try by gamerTag match
    if (!playerSlot && player.gamerTag) {
      playerSlot = set.slots?.find(slot =>
        slot.entrant?.participants?.some(p => p.gamerTag === player.gamerTag)
      );
    }

    // If still not found, try by user slug match
    if (!playerSlot && player.user?.slug) {
      playerSlot = set.slots?.find(slot =>
        slot.entrant?.participants?.some(
          p => p.user?.slug === player.user?.slug
        )
      );
    }

    const opponentSlot = set.slots?.find(slot => slot !== playerSlot);

    // Check if the player's entrant won
    const playerEntrantId = playerSlot?.entrant?.id;
    const winnerId = set.winnerId;
    const isWinner =
      winnerId !== null &&
      playerEntrantId !== null &&
      String(playerEntrantId) === String(winnerId);

    // Get scores
    const playerScore = playerSlot?.standing?.stats?.score?.value || 0;
    const opponentScore = opponentSlot?.standing?.stats?.score?.value || 0;

    // If winnerId is null but we have scores, determine winner by score
    let finalIsWinner = isWinner;
    if (winnerId === null && (playerScore > 0 || opponentScore > 0)) {
      finalIsWinner = playerScore > opponentScore;
    }

    return {
      isWinner: finalIsWinner,
      playerScore,
      opponentScore,
      opponentName: opponentSlot?.entrant?.name || "Unknown",
    };
  };

  return (
    <div className="max-w-4xl mx-auto">
      <div className="mb-6 flex justify-between items-center">
        <Link
          href="/search"
          className="text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-2"
        >
          ← Back to Search
        </Link>
      </div>

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

      {/* Performance Analysis */}
      <div className="mt-6">
        <PerformanceAnalysis playerId={playerId as string} />
      </div>

      {/* Power Ranking Tools */}
      <div className="mt-6">
        <PowerRankingTools basePlayer={player} />
      </div>
    </div>
  );
}
