import { useState } from "react";
import { useLazyQuery } from "@apollo/client";
import { GET_PLAYER_DETAILS } from "@/lib/queries";
import { Player } from "@/types/startgg";
import type { Set } from "@/types/startgg";
import PlayerSearch from "./PlayerSearch";

interface PlayerStats {
  player: Player;
  wins: number;
  losses: number;
  winRate: number;
  totalSets: number;
  tournaments: number;
  averageOpponentRank?: number;
}

interface PowerRankingToolsProps {
  basePlayer?: Player;
}

export default function PowerRankingTools({
  basePlayer,
}: PowerRankingToolsProps) {
  const [players, setPlayers] = useState<Player[]>(
    basePlayer ? [basePlayer] : []
  );
  const [showSearch, setShowSearch] = useState(false);
  const [timeFrame, setTimeFrame] = useState<"3months" | "6months" | "1year">(
    "6months"
  );
  const [playersStats, setPlayersStats] = useState<PlayerStats[]>([]);
  const [loading, setLoading] = useState(false);

  const [getPlayerData] = useLazyQuery(GET_PLAYER_DETAILS);

  const timeFrameOptions = [
    { key: "3months", label: "3 Months", months: 3 },
    { key: "6months", label: "6 Months", months: 6 },
    { key: "1year", label: "1 Year", months: 12 },
  ];

  const getDateFilter = (months: number) => {
    const now = new Date();
    const date = new Date(now.getTime() - months * 30 * 24 * 60 * 60 * 1000);
    return Math.floor(date.getTime() / 1000);
  };

  const addPlayer = (player: Player) => {
    if (!players.find(p => p.id === player.id)) {
      setPlayers([...players, player]);
    }
    setShowSearch(false);
  };

  const removePlayer = (playerId: string) => {
    setPlayers(players.filter(p => p.id !== playerId));
    setPlayersStats(playersStats.filter(s => s.player.id !== playerId));
  };

  const calculatePlayerStats = async () => {
    if (players.length === 0) return;

    setLoading(true);
    const newStats: PlayerStats[] = [];

    const months = timeFrameOptions.find(t => t.key === timeFrame)?.months || 6;
    const cutoffDate = getDateFilter(months);

    // Process players sequentially to avoid rate limiting
    for (const player of players) {
      try {
        const { data } = await getPlayerData({
          variables: {
            playerId: player.id,
            perPage: 20,
            filters: {
              updatedAfter: cutoffDate,
            },
          },
        });

        if (data?.player?.sets?.nodes) {
          const sets = data.player.sets.nodes;
          let wins = 0;
          let losses = 0;
          const tournamentIds = new Set();

          sets.forEach((set: Set) => {
            const playerEntrant = set.slots?.find(slot =>
              slot.entrant?.participants?.some(p => p.id === player.id)
            );

            if (playerEntrant?.entrant?.id === set.winnerId) {
              wins++;
            } else {
              losses++;
            }

            if (set.event?.tournament?.id) {
              tournamentIds.add(set.event.tournament.id);
            }
          });

          const total = wins + losses;
          const winRate = total > 0 ? (wins / total) * 100 : 0;

          newStats.push({
            player,
            wins,
            losses,
            winRate,
            totalSets: total,
            tournaments: tournamentIds.size,
          });
        }

        // Add delay between requests to be respectful to the API
        if (players.indexOf(player) < players.length - 1) {
          await new Promise(resolve => setTimeout(resolve, 300));
        }
      } catch (error) {
        // Error fetching player data, skipping
      }
    }

    // Sort by win rate, then by total sets
    newStats.sort((a, b) => {
      if (Math.abs(a.winRate - b.winRate) < 5) {
        return b.totalSets - a.totalSets;
      }
      return b.winRate - a.winRate;
    });

    setPlayersStats(newStats);
    setLoading(false);
  };

  const getRankColor = (index: number) => {
    switch (index) {
      case 0:
        return "text-yellow-600 dark:text-yellow-400"; // Gold
      case 1:
        return "text-gray-500 dark:text-gray-400"; // Silver
      case 2:
        return "text-orange-600 dark:text-orange-400"; // Bronze
      default:
        return "text-gray-700 dark:text-gray-300";
    }
  };

  const getRankEmoji = (index: number) => {
    switch (index) {
      case 0:
        return "🥇";
      case 1:
        return "🥈";
      case 2:
        return "🥉";
      default:
        return `#${index + 1}`;
    }
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6 card-hover">
      <div className="flex justify-between items-center mb-6">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
          Power Ranking Tools
        </h3>
        <div className="flex gap-2">
          <select
            value={timeFrame}
            onChange={e =>
              setTimeFrame(e.target.value as "3months" | "6months" | "1year")
            }
            className="px-3 py-1 border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-sm"
          >
            {timeFrameOptions.map(option => (
              <option key={option.key} value={option.key}>
                {option.label}
              </option>
            ))}
          </select>
          {!showSearch && (
            <button
              onClick={() => setShowSearch(true)}
              className="px-3 py-1 bg-primary text-white rounded text-sm hover:bg-primary-600 transition-colors"
            >
              + Add Player
            </button>
          )}
        </div>
      </div>

      {showSearch && (
        <div className="mb-6 p-4 border border-gray-200 dark:border-gray-600 rounded-lg">
          <div className="flex justify-between items-center mb-4">
            <h4 className="font-medium text-gray-900 dark:text-gray-100">
              Add Player to Comparison
            </h4>
            <button
              onClick={() => setShowSearch(false)}
              className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
            >
              ×
            </button>
          </div>
          <PlayerSearch onPlayerSelect={addPlayer} />
        </div>
      )}

      {players.length > 0 && (
        <div className="mb-6">
          <div className="flex flex-wrap gap-2 mb-4">
            {players.map(player => (
              <div
                key={player.id}
                className="flex items-center gap-2 px-3 py-1 bg-gray-100 dark:bg-gray-700 rounded-full"
              >
                <span className="text-sm font-medium text-gray-900 dark:text-gray-100">
                  {player.gamerTag}
                </span>
                <button
                  onClick={() => removePlayer(player.id)}
                  className="text-gray-500 hover:text-red-500 dark:text-gray-400 dark:hover:text-red-400"
                >
                  ×
                </button>
              </div>
            ))}
          </div>
          <button
            onClick={calculatePlayerStats}
            disabled={loading}
            className="px-4 py-2 gradient-primary text-white rounded-lg hover:opacity-90 transition-all disabled:opacity-50"
          >
            {loading
              ? "Analyzing..."
              : `Analyze Performance (${
                  timeFrameOptions.find(t => t.key === timeFrame)?.label
                })`}
          </button>
        </div>
      )}

      {playersStats.length > 0 && (
        <div>
          <h4 className="font-medium text-gray-900 dark:text-gray-100 mb-4">
            Power Ranking (
            {timeFrameOptions.find(t => t.key === timeFrame)?.label})
          </h4>
          <div className="space-y-3">
            {playersStats.map((stats, index) => (
              <div
                key={stats.player.id}
                className={`flex items-center justify-between p-4 rounded-lg ${
                  index === 0
                    ? "bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800"
                    : index === 1
                    ? "bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600"
                    : index === 2
                    ? "bg-orange-50 dark:bg-orange-900/20 border border-orange-200 dark:border-orange-800"
                    : "bg-gray-50 dark:bg-gray-700"
                }`}
              >
                <div className="flex items-center gap-4">
                  <div className={`text-2xl font-bold ${getRankColor(index)}`}>
                    {getRankEmoji(index)}
                  </div>
                  <div>
                    <div className="font-semibold text-gray-900 dark:text-gray-100">
                      {stats.player.prefix && `${stats.player.prefix} | `}
                      {stats.player.gamerTag}
                    </div>
                    <div className="text-sm text-gray-600 dark:text-gray-400">
                      {stats.tournaments} tournament
                      {stats.tournaments !== 1 ? "s" : ""} • {stats.totalSets}{" "}
                      sets
                    </div>
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-lg font-bold text-gray-900 dark:text-gray-100">
                    {stats.wins}-{stats.losses}
                  </div>
                  <div
                    className={`text-sm font-medium ${
                      stats.winRate >= 65
                        ? "text-green-600 dark:text-green-400"
                        : stats.winRate >= 50
                        ? "text-yellow-600 dark:text-yellow-400"
                        : "text-red-600 dark:text-red-400"
                    }`}
                  >
                    {stats.winRate.toFixed(1)}% WR
                  </div>
                </div>
              </div>
            ))}
          </div>

          <div className="mt-6 p-4 bg-primary-50 dark:bg-primary-900/20 rounded-lg">
            <h5 className="font-medium text-primary-900 dark:text-primary-100 mb-2">
              📊 Power Ranking Insights
            </h5>
            <ul className="text-sm text-primary-800 dark:text-primary-200 space-y-1">
              <li>• Rankings prioritize win rate over total matches</li>
              <li>
                • Players with similar win rates are ranked by tournament
                activity
              </li>
              <li>
                • Time frame:{" "}
                {timeFrameOptions
                  .find(t => t.key === timeFrame)
                  ?.label.toLowerCase()}
              </li>
              <li>• Consider head-to-head records for final rankings</li>
            </ul>
          </div>
        </div>
      )}

      {players.length === 0 && !showSearch && (
        <div className="text-center py-8">
          <p className="text-gray-500 dark:text-gray-400 mb-4">
            Add players to create power rankings and compare performance
          </p>
          <button
            onClick={() => setShowSearch(true)}
            className="px-4 py-2 gradient-primary text-white rounded-lg hover:opacity-90 transition-all"
          >
            Add Players
          </button>
        </div>
      )}
    </div>
  );
}
