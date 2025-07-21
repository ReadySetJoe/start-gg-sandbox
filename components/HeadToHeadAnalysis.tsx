import { useState } from "react";
import { useLazyQuery } from "@apollo/client";
import { GET_PLAYER_HEAD_TO_HEAD } from "@/lib/queries";
import { Set } from "@/types/startgg";
import PlayerSearch from "./PlayerSearch";
import { Player } from "@/types/startgg";

interface HeadToHeadAnalysisProps {
  currentPlayer: Player;
}

interface HeadToHeadRecord {
  wins: number;
  losses: number;
  total: number;
  winRate: number;
  recentSets: Set[];
}

export default function HeadToHeadAnalysis({
  currentPlayer,
}: HeadToHeadAnalysisProps) {
  const [opponentPlayer, setOpponentPlayer] = useState<Player | null>(null);
  const [showOpponentSearch, setShowOpponentSearch] = useState(false);
  const [timeFilter, setTimeFilter] = useState<
    "all" | "6months" | "1year" | "2years"
  >("1year");

  const [getHeadToHead, { loading, data, error }] = useLazyQuery(
    GET_PLAYER_HEAD_TO_HEAD
  );

  const handleOpponentSelect = (player: Player) => {
    setOpponentPlayer(player);
    setShowOpponentSearch(false);

    // Calculate date filter
    const now = new Date();
    let afterDate: Date | null = null;

    switch (timeFilter) {
      case "6months":
        afterDate = new Date(now.getTime() - 6 * 30 * 24 * 60 * 60 * 1000);
        break;
      case "1year":
        afterDate = new Date(now.getTime() - 365 * 24 * 60 * 60 * 1000);
        break;
      case "2years":
        afterDate = new Date(now.getTime() - 2 * 365 * 24 * 60 * 60 * 1000);
        break;
    }

    getHeadToHead({
      variables: {
        playerId: currentPlayer.id,
        perPage: 15,
        afterDate: afterDate ? Math.floor(afterDate.getTime() / 1000) : null,
      },
    });
  };

  const calculateRecord = (): HeadToHeadRecord | null => {
    if (!data?.player?.sets?.nodes) return null;

    const sets = data.player.sets.nodes;
    let wins = 0;
    let losses = 0;

    // Filter sets to only include matches against the specific opponent
    const headToHeadSets = sets.filter((set: Set) => {
      return set.slots?.some(slot =>
        slot.entrant?.participants?.some(p => p.id === opponentPlayer?.id)
      );
    });

    headToHeadSets.forEach((set: Set) => {
      const playerEntrant = set.slots?.find(slot =>
        slot.entrant?.participants?.some(p => p.id === currentPlayer.id)
      );

      if (playerEntrant?.entrant?.id === set.winnerId) {
        wins++;
      } else {
        losses++;
      }
    });

    const total = wins + losses;
    const winRate = total > 0 ? (wins / total) * 100 : 0;

    return {
      wins,
      losses,
      total,
      winRate,
      recentSets: sets,
    };
  };

  const record = calculateRecord();

  const getTimeFilterLabel = () => {
    switch (timeFilter) {
      case "all":
        return "All Time";
      case "6months":
        return "Last 6 Months";
      case "1year":
        return "Last Year";
      case "2years":
        return "Last 2 Years";
    }
  };

  if (showOpponentSearch) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6 card-hover">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
            Select Opponent for Head-to-Head
          </h3>
          <button
            onClick={() => setShowOpponentSearch(false)}
            className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
          >
            ×
          </button>
        </div>
        <PlayerSearch onPlayerSelect={handleOpponentSelect} />
      </div>
    );
  }

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6 card-hover">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
          Head-to-Head Analysis
        </h3>
        <div className="flex gap-2">
          <select
            value={timeFilter}
            onChange={e =>
              setTimeFilter(
                e.target.value as "all" | "6months" | "1year" | "2years"
              )
            }
            className="px-3 py-1 border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-sm"
          >
            <option value="6months">Last 6 Months</option>
            <option value="1year">Last Year</option>
            <option value="2years">Last 2 Years</option>
            <option value="all">All Time</option>
          </select>
        </div>
      </div>

      {!opponentPlayer ? (
        <div className="text-center py-8">
          <p className="text-gray-500 dark:text-gray-400 mb-4">
            Select an opponent to see head-to-head record
          </p>
          <button
            onClick={() => setShowOpponentSearch(true)}
            className="px-4 py-2 gradient-primary text-white rounded-lg hover:opacity-90 transition-all"
          >
            Find Opponent
          </button>
        </div>
      ) : (
        <div>
          <div className="flex items-center gap-4 mb-6">
            <div className="text-center">
              <div className="font-semibold text-gray-900 dark:text-gray-100">
                {currentPlayer.gamerTag}
              </div>
              <div className="text-sm text-gray-600 dark:text-gray-400">vs</div>
            </div>
            <div className="text-center">
              <div className="font-semibold text-gray-900 dark:text-gray-100">
                {opponentPlayer.gamerTag}
              </div>
              <div className="text-sm text-gray-600 dark:text-gray-400">
                {getTimeFilterLabel()}
              </div>
            </div>
            <button
              onClick={() => {
                setOpponentPlayer(null);
                setShowOpponentSearch(true);
              }}
              className="ml-auto px-3 py-1 text-sm bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded hover:bg-gray-200 dark:hover:bg-gray-600"
            >
              Change Opponent
            </button>
          </div>

          {loading && (
            <div className="text-center py-4">
              <div className="text-gray-600 dark:text-gray-400 animate-pulse">
                Loading head-to-head data...
              </div>
            </div>
          )}

          {error && (
            <div className="p-3 bg-red-100 dark:bg-red-900/20 text-red-700 dark:text-red-400 rounded text-sm">
              Error loading head-to-head data: {error.message}
            </div>
          )}

          {record && (
            <div>
              <div className="grid grid-cols-4 gap-4 mb-6">
                <div className="text-center p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
                  <div className="text-2xl font-bold text-green-600 dark:text-green-400">
                    {record.wins}
                  </div>
                  <div className="text-sm text-gray-600 dark:text-gray-400">
                    Wins
                  </div>
                </div>
                <div className="text-center p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
                  <div className="text-2xl font-bold text-red-600 dark:text-red-400">
                    {record.losses}
                  </div>
                  <div className="text-sm text-gray-600 dark:text-gray-400">
                    Losses
                  </div>
                </div>
                <div className="text-center p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
                  <div className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                    {record.total}
                  </div>
                  <div className="text-sm text-gray-600 dark:text-gray-400">
                    Total
                  </div>
                </div>
                <div className="text-center p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
                  <div
                    className={`text-2xl font-bold ${
                      record.winRate >= 50
                        ? "text-green-600 dark:text-green-400"
                        : "text-red-600 dark:text-red-400"
                    }`}
                  >
                    {record.winRate.toFixed(1)}%
                  </div>
                  <div className="text-sm text-gray-600 dark:text-gray-400">
                    Win Rate
                  </div>
                </div>
              </div>

              {record.recentSets.length > 0 && (
                <div>
                  <h4 className="font-semibold text-gray-900 dark:text-gray-100 mb-3">
                    Recent Matches ({getTimeFilterLabel()})
                  </h4>
                  <div className="space-y-2">
                    {record.recentSets.slice(0, 5).map((set: Set) => {
                      const isWin =
                        set.slots?.find(slot =>
                          slot.entrant?.participants?.some(
                            p => p.id === currentPlayer.id
                          )
                        )?.entrant?.id === set.winnerId;

                      return (
                        <div
                          key={set.id}
                          className="flex justify-between items-center p-3 bg-gray-50 dark:bg-gray-700 rounded"
                        >
                          <div className="flex items-center gap-3">
                            <div
                              className={`w-2 h-2 rounded-full ${
                                isWin ? "bg-green-500" : "bg-red-500"
                              }`}
                            ></div>
                            <div className="text-sm">
                              <div className="font-medium text-gray-900 dark:text-gray-100">
                                {set.event.tournament.name}
                              </div>
                              <div className="text-gray-600 dark:text-gray-400">
                                {set.displayScore} •{" "}
                                {set.fullRoundText || set.round}
                              </div>
                            </div>
                          </div>
                          <div className="text-xs text-gray-500 dark:text-gray-500">
                            {set.completedAt &&
                              new Date(
                                set.completedAt * 1000
                              ).toLocaleDateString()}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
