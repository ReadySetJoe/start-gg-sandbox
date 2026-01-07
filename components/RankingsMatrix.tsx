import { useState, useEffect, useCallback } from "react";
import { useLazyQuery } from "@apollo/client";
import { GET_PLAYER_HEAD_TO_HEAD, GET_USER_BY_SLUG } from "@/lib/queries";
import { Player, Set } from "@/types/startgg";
import PlayerSearch from "./PlayerSearch";
import {
  EXAMPLE_PLAYERS,
  MIN_PLAYERS_FOR_RANKINGS,
} from "@/lib/example-players";

interface HeadToHeadRecord {
  wins: number;
  losses: number;
  total: number;
  winRate: number;
  loading: boolean;
  error?: string;
}

interface PlayerRanking {
  player: Player;
  totalWins: number;
  totalLosses: number;
  totalSets: number;
  winRate: number;
}

const STORAGE_KEY = "powerRankingsPlayers";
const BATCH_SIZE = 3;
const SETS_PER_PLAYER = 100;

// Time filter to match count mapping
const TIME_FILTER_LIMITS = {
  "6months": 10,
  "1year": 20,
  "2years": 30,
  all: Infinity,
} as const;

export default function RankingsMatrix() {
  const [players, setPlayers] = useState<Player[]>([]);
  const [showSearch, setShowSearch] = useState(false);
  const [timeFilter, setTimeFilter] = useState<
    "6months" | "1year" | "2years" | "all"
  >("1year");
  const [records, setRecords] = useState<{ [key: string]: HeadToHeadRecord }>(
    {}
  );
  const [loading, setLoading] = useState(false);
  const [rankings, setRankings] = useState<PlayerRanking[]>([]);

  const [getHeadToHead] = useLazyQuery(GET_PLAYER_HEAD_TO_HEAD);
  const [getUserBySlug] = useLazyQuery(GET_USER_BY_SLUG);
  const [loadingExamples, setLoadingExamples] = useState(false);

  // Load and save players to localStorage
  useEffect(() => {
    const savedPlayers = localStorage.getItem(STORAGE_KEY);
    if (savedPlayers) {
      try {
        const parsedPlayers = JSON.parse(savedPlayers);
        setPlayers(parsedPlayers);
      } catch (error) {
        // Failed to load saved players, using empty array
      }
    }
  }, []);

  useEffect(() => {
    if (players.length > 0) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(players));
    } else {
      localStorage.removeItem(STORAGE_KEY);
    }
  }, [players]);

  // Player management functions
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

  const loadExamplePlayers = async () => {
    if (EXAMPLE_PLAYERS.length < MIN_PLAYERS_FOR_RANKINGS) {
      return;
    }

    setLoadingExamples(true);
    const loadedPlayers: Player[] = [];

    for (const example of EXAMPLE_PLAYERS) {
      try {
        const slug = example.slug.startsWith("user/")
          ? example.slug
          : `user/${example.slug}`;
        const { data } = await getUserBySlug({ variables: { slug } });

        if (data?.user) {
          const player: Player = {
            id: data.user.player?.id || data.user.id,
            gamerTag: data.user.player?.gamerTag || data.user.name || "Unknown",
            prefix: data.user.player?.prefix,
            user: data.user,
          };
          // Only add if not already in list
          if (!players.find(p => p.id === player.id)) {
            loadedPlayers.push(player);
          }
        }
      } catch (error) {
        console.error(`Failed to load example player: ${example.slug}`, error);
      }
    }

    if (loadedPlayers.length > 0) {
      setPlayers(prev => [...prev, ...loadedPlayers]);
    }
    setLoadingExamples(false);
  };

  const hasExamplePlayers = EXAMPLE_PLAYERS.length >= MIN_PLAYERS_FOR_RANKINGS;

  // Helper functions
  const getRecordKey = (player1Id: string, player2Id: string) => {
    return `${player1Id}-vs-${player2Id}`;
  };

  const playerMatches = (
    participant: { id: string; gamerTag?: string },
    targetPlayer: Player
  ) => {
    return (
      String(participant.id) === String(targetPlayer.id) ||
      participant.gamerTag?.toLowerCase() ===
        targetPlayer.gamerTag.toLowerCase()
    );
  };

  // Main head-to-head calculation - calculates both directions simultaneously for consistency
  const calculateSymmetricHeadToHead = useCallback(
    async (player1: Player, player2: Player) => {
      const recordKey1 = getRecordKey(player1.id, player2.id);
      const recordKey2 = getRecordKey(player2.id, player1.id);

      // Set loading state for both directions
      setRecords(prev => ({
        ...prev,
        [recordKey1]: {
          wins: 0,
          losses: 0,
          total: 0,
          winRate: 0,
          loading: true,
        },
        [recordKey2]: {
          wins: 0,
          losses: 0,
          total: 0,
          winRate: 0,
          loading: true,
        },
      }));

      try {
        // Fetch sets from both players to get comprehensive head-to-head history
        const [data1, data2] = await Promise.all([
          getHeadToHead({
            variables: {
              playerId: player1.id,
              perPage: SETS_PER_PLAYER,
            },
          }),
          getHeadToHead({
            variables: {
              playerId: player2.id,
              perPage: SETS_PER_PLAYER,
            },
          }),
        ]);

        // Combine and deduplicate sets by ID
        const allSets = new Map();

        if (data1?.data?.player?.sets?.nodes) {
          data1.data.player.sets.nodes.forEach((set: Set) =>
            allSets.set(set.id, set)
          );
        }

        if (data2?.data?.player?.sets?.nodes) {
          data2.data.player.sets.nodes.forEach((set: Set) =>
            allSets.set(set.id, set)
          );
        }

        const combinedSets = Array.from(allSets.values());

        // Find sets where both players participated
        const headToHeadSets = combinedSets.filter((set: Set) => {
          const hasPlayer1 = set.slots?.some(slot =>
            slot.entrant?.participants?.some(p => playerMatches(p, player1))
          );
          const hasPlayer2 = set.slots?.some(slot =>
            slot.entrant?.participants?.some(p => playerMatches(p, player2))
          );
          return hasPlayer1 && hasPlayer2;
        });

        // Apply time filter by limiting number of recent matches
        const maxSets = TIME_FILTER_LIMITS[timeFilter] || headToHeadSets.length;
        const recentHeadToHeadSets = headToHeadSets.slice(0, maxSets);

        // Calculate wins/losses from player1's perspective
        let player1Wins = 0;
        let player1Losses = 0;

        recentHeadToHeadSets.forEach((set: Set) => {
          const player1Entrant = set.slots?.find(slot =>
            slot.entrant?.participants?.some(p => playerMatches(p, player1))
          );

          const player1EntrantId = player1Entrant?.entrant?.id;
          const winnerId = set.winnerId;

          if (player1EntrantId && winnerId) {
            const isPlayer1Winner =
              String(player1EntrantId) === String(winnerId);

            if (isPlayer1Winner) {
              player1Wins++;
            } else {
              player1Losses++;
            }
          }
        });

        // Calculate stats
        const total = player1Wins + player1Losses;
        const player1WinRate = total > 0 ? (player1Wins / total) * 100 : 0;
        const player2WinRate = total > 0 ? (player1Losses / total) * 100 : 0;

        // Set symmetric records (player2's wins are player1's losses and vice versa)
        setRecords(prev => ({
          ...prev,
          [recordKey1]: {
            wins: player1Wins,
            losses: player1Losses,
            total,
            winRate: player1WinRate,
            loading: false,
          },
          [recordKey2]: {
            wins: player1Losses,
            losses: player1Wins,
            total,
            winRate: player2WinRate,
            loading: false,
          },
        }));
      } catch (error) {
        const errorRecord = {
          wins: 0,
          losses: 0,
          total: 0,
          winRate: 0,
          loading: false,
          error: error instanceof Error ? error.message : "Unknown error",
        };

        setRecords(prev => ({
          ...prev,
          [recordKey1]: errorRecord,
          [recordKey2]: errorRecord,
        }));
      }
    },
    [getHeadToHead, timeFilter]
  );

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
        const { data } = await getHeadToHead({
          variables: {
            playerId: player1.id,
            perPage: 100,
          },
        });

        if (data?.player?.sets?.nodes) {
          const allSets = data.player.sets.nodes;
          let wins = 0;
          let losses = 0;

          // First, find ALL head-to-head sets between these two players
          const allHeadToHeadSets = allSets.filter((set: Set) => {
            const hasOpponent = set.slots?.some(slot =>
              slot.entrant?.participants?.some(p => {
                // Try multiple comparison methods
                const idMatch = String(p.id) === String(player2.id);
                const gamerTagMatch =
                  p.gamerTag?.toLowerCase() === player2.gamerTag.toLowerCase();

                const match = idMatch || gamerTagMatch;

                return match;
              })
            );
            return hasOpponent;
          });

          // Determine how many recent head-to-head sets to use based on time filter
          let maxSets;
          switch (timeFilter) {
            case "6months":
              maxSets = 10; // Last 10 head-to-head matches
              break;
            case "1year":
              maxSets = 20; // Last 20 head-to-head matches
              break;
            case "2years":
              maxSets = 30; // Last 30 head-to-head matches
              break;
            case "all":
            default:
              maxSets = allHeadToHeadSets.length; // All available matches
              break;
          }

          // Take the most recent X head-to-head sets (they should already be in chronological order)
          const headToHeadSets = allHeadToHeadSets.slice(0, maxSets);

          headToHeadSets.forEach((set: Set) => {
            // Find both entrants
            const player1Entrant = set.slots?.find(slot =>
              slot.entrant?.participants?.some(
                p =>
                  String(p.id) === String(player1.id) ||
                  p.gamerTag?.toLowerCase() === player1.gamerTag.toLowerCase()
              )
            );

            // Check winner with proper type handling
            const player1EntrantId = player1Entrant?.entrant?.id;
            const winnerId = set.winnerId;

            if (player1EntrantId && winnerId) {
              const isWinner = String(player1EntrantId) === String(winnerId);

              if (isWinner) {
                wins++;
              } else {
                losses++;
              }
            } else {
              // If we can't determine winner, count as loss for safety
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

  // Auto-generate matrix and calculate rankings when players or time filter changes
  useEffect(() => {
    const generateMatrix = async () => {
      if (players.length < 2) return;

      setLoading(true);

      // Process requests in batches to avoid rate limiting
      const batchSize = 3;
      const requests: Array<() => Promise<void>> = [];

      // Generate unique matchup combinations (only calculate each pair once)
      for (let i = 0; i < players.length; i++) {
        for (let j = i + 1; j < players.length; j++) {
          requests.push(() =>
            calculateSymmetricHeadToHead(players[i], players[j])
          );
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
  }, [players, timeFilter, calculateSymmetricHeadToHead]);

  // Calculate player rankings based on head-to-head records
  useEffect(() => {
    if (players.length < 2) {
      setRankings([]);
      return;
    }

    const newRankings: PlayerRanking[] = players.map(player => {
      let totalWins = 0;
      let totalLosses = 0;

      // Sum up all head-to-head records for this player
      players.forEach(opponent => {
        if (player.id !== opponent.id) {
          const recordKey = getRecordKey(player.id, opponent.id);
          const record = records[recordKey];
          if (record && !record.loading) {
            totalWins += record.wins;
            totalLosses += record.losses;
          }
        }
      });

      const totalSets = totalWins + totalLosses;
      const winRate = totalSets > 0 ? (totalWins / totalSets) * 100 : 0;

      return {
        player,
        totalWins,
        totalLosses,
        totalSets,
        winRate,
      };
    });

    // Sort by win rate, then by total wins as tiebreaker
    newRankings.sort((a, b) => {
      if (Math.abs(a.winRate - b.winRate) < 0.1) {
        // If win rates are very close (within 0.1%)
        return b.totalWins - a.totalWins; // Use total wins as tiebreaker
      }
      return b.winRate - a.winRate; // Primary sort by win rate
    });

    setRankings(newRankings);
  }, [players, records]);

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

  // Display helper functions
  const getTimeFilterLabel = () => {
    const labels = {
      "6months": "Last 10 Matches",
      "1year": "Last 20 Matches",
      "2years": "Last 30 Matches",
      all: "All Matches",
    };
    return labels[timeFilter];
  };

  const getRankEmoji = (index: number) => {
    const medals = ["🥇", "🥈", "🥉"];
    return medals[index] || `#${index + 1}`;
  };

  return (
    <div className="space-y-6">
      {/* Controls */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6 card-hover">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
            Power Rankings Matrix
          </h3>
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

        <div className="flex gap-2 flex-wrap">
          {showSearch ? (
            <div className="flex items-center gap-2">
              <PlayerSearch
                onPlayerSelect={addPlayer}
                handleCancel={() => setShowSearch(false)}
              />
            </div>
          ) : (
            <>
              <button
                onClick={() => setShowSearch(true)}
                className="px-6 py-2 gradient-primary text-white rounded-lg hover:opacity-90 disabled:bg-gray-400 disabled:cursor-not-allowed transition-all"
              >
                + Add Player
              </button>
              {hasExamplePlayers && (
                <button
                  onClick={loadExamplePlayers}
                  disabled={loadingExamples}
                  className="px-6 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg disabled:bg-gray-400 disabled:cursor-not-allowed transition-all"
                >
                  {loadingExamples ? "Loading..." : "Load Example Players"}
                </button>
              )}
            </>
          )}
        </div>
      </div>

      {/* Rankings & Matrix Display */}
      {rankings.length >= 2 ? (
        <div className="grid lg:grid-cols-3 gap-6">
          {/* Rankings Column */}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6 card-hover">
            <h4 className="font-medium text-gray-900 dark:text-gray-100 mb-4">
              🏆 Power Rankings ({getTimeFilterLabel()})
            </h4>
            <div className="space-y-3">
              {rankings.map((ranking, index) => (
                <div
                  key={ranking.player.id}
                  className={`flex items-center justify-between p-3 rounded-lg ${
                    index === 0
                      ? "bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800"
                      : index === 1
                      ? "bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600"
                      : index === 2
                      ? "bg-orange-50 dark:bg-orange-900/20 border border-orange-200 dark:border-orange-800"
                      : "bg-gray-50 dark:bg-gray-700"
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div className="text-lg font-bold text-gray-700 dark:text-gray-300">
                      {getRankEmoji(index)}
                    </div>
                    <div>
                      <div className="font-medium text-gray-900 dark:text-gray-100 text-sm">
                        {ranking.player.prefix && `${ranking.player.prefix} | `}
                        {ranking.player.gamerTag}
                      </div>
                      <div className="text-xs text-gray-600 dark:text-gray-400">
                        {ranking.totalSets} total sets
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-sm font-bold text-gray-900 dark:text-gray-100">
                      {ranking.totalWins}-{ranking.totalLosses}
                    </div>
                    <div className="text-xs text-gray-600 dark:text-gray-400">
                      {ranking.winRate.toFixed(1)}%
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Matrix Column */}
          <div className="lg:col-span-2 bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6 card-hover overflow-x-auto">
            <div className="flex justify-between items-center mb-4">
              <h4 className="font-medium text-gray-900 dark:text-gray-100">
                📊 Head-to-Head Matrix
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
                    {rankings.map(ranking => (
                      <th
                        key={ranking.player.id}
                        className="p-2 text-center min-w-[80px]"
                      >
                        <div className="text-xs font-medium text-gray-900 dark:text-gray-100 transform origin-left">
                          {ranking.player.prefix && `${ranking.player.prefix}|`}
                          {ranking.player.gamerTag}
                        </div>
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {rankings.map(rowRanking => (
                    <tr key={rowRanking.player.id}>
                      <td className="p-2 font-medium text-sm text-gray-900 dark:text-gray-100 min-w-[120px]">
                        {rowRanking.player.prefix &&
                          `${rowRanking.player.prefix} | `}
                        {rowRanking.player.gamerTag}
                      </td>
                      {rankings.map(colRanking => (
                        <td
                          key={colRanking.player.id}
                          className="p-2 border-l border-gray-200 dark:border-gray-700"
                        >
                          {getRecordDisplay(
                            rowRanking.player,
                            colRanking.player
                          )}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      ) : (
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6 card-hover">
          <div className="text-center py-8">
            <p className="text-gray-500 dark:text-gray-400 mb-4">
              Add at least 2 players to generate power rankings
            </p>
            <div className="flex justify-center gap-3 flex-wrap">
              <button
                onClick={() => setShowSearch(true)}
                className="px-4 py-2 gradient-primary text-white rounded-lg hover:opacity-90 transition-all"
              >
                Add Players
              </button>
              {hasExamplePlayers && (
                <button
                  onClick={loadExamplePlayers}
                  disabled={loadingExamples}
                  className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg disabled:bg-gray-400 disabled:cursor-not-allowed transition-all"
                >
                  {loadingExamples ? "Loading..." : "Try Example Players"}
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {rankings.length >= 2 && (
        <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-4">
          <h5 className="font-medium text-green-900 dark:text-green-100 mb-2">
            🎯 Rankings Insights
          </h5>
          <ul className="text-sm text-green-800 dark:text-green-200 space-y-1">
            <li>
              • Rankings based on total head-to-head wins across all opponents
            </li>
            <li>• Matrix shows individual matchup records (row vs column)</li>
            <li>
              • Players are ordered by most wins, with win rate as tiebreaker
            </li>
            <li>
              • Perfect data for tournament seeding and power ranking decisions
            </li>
          </ul>
        </div>
      )}
    </div>
  );
}
