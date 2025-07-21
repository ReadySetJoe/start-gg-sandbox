import { useState, useEffect, useCallback } from "react";
import { useLazyQuery } from "@apollo/client";
import { GET_PLAYER_HEAD_TO_HEAD } from "@/lib/queries";
import { Player, Set } from "@/types/startgg";
import PlayerSearch from "./PlayerSearch";

interface HeadToHeadRecord {
  wins: number;
  losses: number;
  total: number;
  winRate: number;
  loading: boolean;
  error?: string;
}

interface HeadToHeadMatrixProps {
  initialPlayers?: Player[];
}

export default function HeadToHeadMatrix({
  initialPlayers = [],
}: HeadToHeadMatrixProps) {
  const [players, setPlayers] = useState<Player[]>(initialPlayers);
  const [showSearch, setShowSearch] = useState(false);
  const [timeFilter, setTimeFilter] = useState<
    "6months" | "1year" | "2years" | "all"
  >("1year");
  const [records, setRecords] = useState<{ [key: string]: HeadToHeadRecord }>(
    {}
  );
  const [loading, setLoading] = useState(false);

  const [getHeadToHead] = useLazyQuery(GET_PLAYER_HEAD_TO_HEAD);

  const addPlayer = (player: Player) => {
    if (!players.find(p => p.id === player.id)) {
      setPlayers([...players, player]);
    }
    setShowSearch(false);
  };

  const removePlayer = (playerId: string) => {
    setPlayers(players.filter(p => p.id !== playerId));
    // Clean up records for removed player
    const newRecords = { ...records };
    Object.keys(newRecords).forEach(key => {
      if (key.includes(playerId)) {
        delete newRecords[key];
      }
    });
    setRecords(newRecords);
  };

  const getRecordKey = (player1Id: string, player2Id: string) => {
    return `${player1Id}-vs-${player2Id}`;
  };

  const calculateHeadToHead = useCallback(
    async (player1: Player, player2: Player) => {
      const recordKey = getRecordKey(player1.id, player2.id);

      // Set loading state
      setRecords(prev => ({
        ...prev,
        [recordKey]: {
          wins: 0,
          losses: 0,
          total: 0,
          winRate: 0,
          loading: true,
        },
      }));

      try {
        // Calculate date filter
        const now = new Date();
        let afterDate: number | null = null;

        switch (timeFilter) {
          case "6months":
            afterDate = Math.floor(
              (now.getTime() - 6 * 30 * 24 * 60 * 60 * 1000) / 1000
            );
            break;
          case "1year":
            afterDate = Math.floor(
              (now.getTime() - 365 * 24 * 60 * 60 * 1000) / 1000
            );
            break;
          case "2years":
            afterDate = Math.floor(
              (now.getTime() - 2 * 365 * 24 * 60 * 60 * 1000) / 1000
            );
            break;
        }

        const { data } = await getHeadToHead({
          variables: {
            playerId: player1.id,
            perPage: 20,
            afterDate,
          },
        });

        if (data?.player?.sets?.nodes) {
          const sets = data.player.sets.nodes;
          let wins = 0;
          let losses = 0;

          // Filter sets to only include matches against the specific opponent
          const headToHeadSets = sets.filter((set: Set) => {
            return set.slots?.some(slot =>
              slot.entrant?.participants?.some(p => p.id === player2.id)
            );
          });

          headToHeadSets.forEach((set: Set) => {
            const player1Entrant = set.slots?.find(slot =>
              slot.entrant?.participants?.some(p => p.id === player1.id)
            );

            if (player1Entrant?.entrant?.id === set.winnerId) {
              wins++;
            } else {
              losses++;
            }
          });

          const total = wins + losses;
          const winRate = total > 0 ? (wins / total) * 100 : 0;

          setRecords(prev => ({
            ...prev,
            [recordKey]: {
              wins,
              losses,
              total,
              winRate,
              loading: false,
            },
          }));
        } else {
          setRecords(prev => ({
            ...prev,
            [recordKey]: {
              wins: 0,
              losses: 0,
              total: 0,
              winRate: 0,
              loading: false,
            },
          }));
        }
      } catch (error) {
        setRecords(prev => ({
          ...prev,
          [recordKey]: {
            wins: 0,
            losses: 0,
            total: 0,
            winRate: 0,
            loading: false,
            error: error instanceof Error ? error.message : "Unknown error",
          },
        }));
      }
    },
    [getHeadToHead, timeFilter]
  );

  // Auto-generate matrix when players or time filter changes
  useEffect(() => {
    const generateMatrix = async () => {
      if (players.length < 2) return;

      setLoading(true);

      // Process requests in batches to avoid rate limiting
      const batchSize = 3;
      const requests: Array<() => Promise<void>> = [];

      // Generate all matchup combinations
      for (let i = 0; i < players.length; i++) {
        for (let j = 0; j < players.length; j++) {
          if (i !== j) {
            requests.push(() => calculateHeadToHead(players[i], players[j]));
          }
        }
      }

      // Process requests in batches
      for (let i = 0; i < requests.length; i += batchSize) {
        const batch = requests.slice(i, i + batchSize);
        await Promise.all(batch.map(request => request()));

        // Add small delay between batches to be respectful to the API
        if (i + batchSize < requests.length) {
          await new Promise(resolve => setTimeout(resolve, 500));
        }
      }

      setLoading(false);
    };

    if (players.length >= 2) {
      generateMatrix();
    }
  }, [players, timeFilter, calculateHeadToHead]);

  const getRecordDisplay = (player1: Player, player2: Player) => {
    if (player1.id === player2.id) {
      return (
        <div className="text-center text-gray-400 dark:text-gray-600">—</div>
      );
    }

    const recordKey = getRecordKey(player1.id, player2.id);
    const record = records[recordKey];

    if (!record) {
      return (
        <div className="text-center text-gray-400 dark:text-gray-600 text-xs">
          No data
        </div>
      );
    }

    if (record.loading) {
      return (
        <div className="text-center text-gray-400 dark:text-gray-600 text-xs animate-pulse">
          Loading...
        </div>
      );
    }

    if (record.error) {
      return (
        <div className="text-center text-red-500 dark:text-red-400 text-xs">
          Error
        </div>
      );
    }

    if (record.total === 0) {
      return (
        <div className="text-center text-gray-400 dark:text-gray-600 text-xs">
          0-0
        </div>
      );
    }

    const isWinning = record.wins > record.losses;
    const isEven = record.wins === record.losses;

    return (
      <div
        className={`text-center text-xs ${
          isEven
            ? "text-yellow-600 dark:text-yellow-400"
            : isWinning
            ? "text-green-600 dark:text-green-400"
            : "text-red-600 dark:text-red-400"
        }`}
      >
        <div className="font-bold">
          {record.wins}-{record.losses}
        </div>
        {record.total > 0 && (
          <div className="text-xs opacity-75">{record.winRate.toFixed(0)}%</div>
        )}
      </div>
    );
  };

  const getTimeFilterLabel = () => {
    switch (timeFilter) {
      case "6months":
        return "Last 6 Months";
      case "1year":
        return "Last Year";
      case "2years":
        return "Last 2 Years";
      case "all":
        return "All Time";
    }
  };

  return (
    <div className="space-y-6">
      {/* Controls */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6 card-hover">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
            Head-to-Head Matrix
          </h3>
          <div className="flex gap-2">
            <select
              value={timeFilter}
              onChange={e => setTimeFilter(e.target.value as typeof timeFilter)}
              className="px-3 py-1 border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-sm"
            >
              <option value="6months">Last 6 Months</option>
              <option value="1year">Last Year</option>
              <option value="2years">Last 2 Years</option>
              <option value="all">All Time</option>
            </select>
            {!showSearch && (
              <button
                onClick={() => setShowSearch(true)}
                className="px-3 py-1 bg-blue-600 text-white rounded text-sm hover:bg-blue-700 transition-colors"
              >
                + Add Player
              </button>
            )}
          </div>
        </div>

        {/* Player Management */}
        {players.length > 0 && (
          <div className="mb-4">
            <div className="flex flex-wrap gap-2">
              {players.map(player => (
                <div
                  key={player.id}
                  className="flex items-center gap-2 px-3 py-1 bg-gray-100 dark:bg-gray-700 rounded-full"
                >
                  <span className="text-sm font-medium text-gray-900 dark:text-gray-100">
                    {player.prefix && `${player.prefix} | `}
                    {player.gamerTag}
                  </span>
                  <button
                    onClick={() => removePlayer(player.id)}
                    className="text-gray-500 hover:text-red-500 dark:text-gray-400 dark:hover:text-red-400 ml-1"
                  >
                    ×
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {showSearch && (
          <div className="p-4 border border-gray-200 dark:border-gray-600 rounded-lg">
            <div className="flex justify-between items-center mb-4">
              <h4 className="font-medium text-gray-900 dark:text-gray-100">
                Add Player
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
      </div>

      {/* Matrix Display */}
      {players.length >= 2 ? (
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6 card-hover overflow-x-auto">
          <div className="flex justify-between items-center mb-4">
            <h4 className="font-medium text-gray-900 dark:text-gray-100">
              Matchup Matrix ({getTimeFilterLabel()})
            </h4>
            {loading && (
              <div className="text-sm text-gray-600 dark:text-gray-400 animate-pulse">
                Updating records...
              </div>
            )}
          </div>

          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr>
                  <th className="p-2"></th>
                  {players.map(player => (
                    <th
                      key={player.id}
                      className="p-2 text-center min-w-[80px]"
                    >
                      <div className="text-xs font-medium text-gray-900 dark:text-gray-100 transform origin-left">
                        {player.prefix && `${player.prefix}|`}
                        {player.gamerTag}
                      </div>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {players.map(rowPlayer => (
                  <tr key={rowPlayer.id}>
                    <td className="p-2 font-medium text-sm text-gray-900 dark:text-gray-100 min-w-[120px]">
                      {rowPlayer.prefix && `${rowPlayer.prefix} | `}
                      {rowPlayer.gamerTag}
                    </td>
                    {players.map(colPlayer => (
                      <td
                        key={colPlayer.id}
                        className="p-2 border-l border-gray-200 dark:border-gray-700"
                      >
                        {getRecordDisplay(rowPlayer, colPlayer)}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="mt-4 text-xs text-gray-500 dark:text-gray-400">
            <div className="flex flex-wrap gap-4">
              <div>📊 Matrix shows row player vs column player records</div>
              <div>🟢 Green: Winning record</div>
              <div>🔴 Red: Losing record</div>
              <div>🟡 Yellow: Even record</div>
            </div>
          </div>
        </div>
      ) : (
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6 card-hover">
          <div className="text-center py-8">
            <p className="text-gray-500 dark:text-gray-400 mb-4">
              Add at least 2 players to generate a head-to-head matrix
            </p>
            <button
              onClick={() => setShowSearch(true)}
              className="px-4 py-2 gradient-primary text-white rounded-lg hover:opacity-90 transition-all"
            >
              Add Players
            </button>
          </div>
        </div>
      )}

      {players.length >= 2 && (
        <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
          <h5 className="font-medium text-blue-900 dark:text-blue-100 mb-2">
            📊 Matrix Insights
          </h5>
          <ul className="text-sm text-blue-800 dark:text-blue-200 space-y-1">
            <li>
              • Each cell shows row player&apos;s record against column player
            </li>
            <li>• Perfect for identifying dominant matchups and rivalries</li>
            <li>• Essential data for power rankings and tournament seeding</li>
            <li>• Time filter applies to all matchups simultaneously</li>
          </ul>
        </div>
      )}
    </div>
  );
}
