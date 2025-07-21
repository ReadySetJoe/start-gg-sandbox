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

interface PlayerRanking {
  player: Player;
  totalWins: number;
  totalLosses: number;
  totalSets: number;
  winRate: number;
}

const STORAGE_KEY = "powerRankingsPlayers";

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

  // Load players from localStorage on mount
  useEffect(() => {
    const savedPlayers = localStorage.getItem(STORAGE_KEY);
    if (savedPlayers) {
      try {
        const parsedPlayers = JSON.parse(savedPlayers);
        setPlayers(parsedPlayers);
      } catch (error) {
        console.error("Failed to load saved players:", error);
      }
    }
  }, []);

  // Save players to localStorage whenever players change
  useEffect(() => {
    if (players.length > 0) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(players));
    } else {
      localStorage.removeItem(STORAGE_KEY);
    }
  }, [players]);

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

  const calculateSymmetricHeadToHead = useCallback(async (player1: Player, player2: Player) => {
    const recordKey1 = getRecordKey(player1.id, player2.id);
    const recordKey2 = getRecordKey(player2.id, player1.id);
    
    // Set loading state for both directions
    setRecords(prev => ({
      ...prev,
      [recordKey1]: { wins: 0, losses: 0, total: 0, winRate: 0, loading: true },
      [recordKey2]: { wins: 0, losses: 0, total: 0, winRate: 0, loading: true }
    }));

    try {
      // Fetch sets from both players to get more comprehensive data
      const [data1, data2] = await Promise.all([
        getHeadToHead({
          variables: {
            playerId: player1.id,
            perPage: 100,
          },
        }),
        getHeadToHead({
          variables: {
            playerId: player2.id,
            perPage: 100,
          },
        })
      ]);

      // Combine sets from both players and deduplicate by set ID
      const allSets = new Map();
      
      if (data1?.data?.player?.sets?.nodes) {
        data1.data.player.sets.nodes.forEach((set: Set) => allSets.set(set.id, set));
      }
      
      if (data2?.data?.player?.sets?.nodes) {
        data2.data.player.sets.nodes.forEach((set: Set) => allSets.set(set.id, set));
      }

      const combinedSets = Array.from(allSets.values());
      
      console.log(`🔍 SYMMETRIC: Fetched ${combinedSets.length} combined unique sets for ${player1.gamerTag} vs ${player2.gamerTag}`);
      
      // Find head-to-head sets where both players participated
      const headToHeadSets = combinedSets.filter((set: Set) => {
        const hasPlayer1 = set.slots?.some(slot =>
          slot.entrant?.participants?.some(p => String(p.id) === String(player1.id) || p.gamerTag?.toLowerCase() === player1.gamerTag.toLowerCase())
        );
        const hasPlayer2 = set.slots?.some(slot =>
          slot.entrant?.participants?.some(p => String(p.id) === String(player2.id) || p.gamerTag?.toLowerCase() === player2.gamerTag.toLowerCase())
        );
        return hasPlayer1 && hasPlayer2;
      });

      console.log(`🔍 SYMMETRIC: Found ${headToHeadSets.length} true head-to-head sets`);

      // Determine how many recent head-to-head sets to use
      let maxSets;
      switch (timeFilter) {
        case "6months": maxSets = 10; break;
        case "1year": maxSets = 20; break;
        case "2years": maxSets = 30; break;
        case "all": default: maxSets = headToHeadSets.length; break;
      }

      const recentHeadToHeadSets = headToHeadSets.slice(0, maxSets);
      
      let player1Wins = 0;
      let player1Losses = 0;

      recentHeadToHeadSets.forEach((set: Set) => {
        const player1Entrant = set.slots?.find(slot =>
          slot.entrant?.participants?.some(p => String(p.id) === String(player1.id) || p.gamerTag?.toLowerCase() === player1.gamerTag.toLowerCase())
        );

        const player1EntrantId = player1Entrant?.entrant?.id;
        const winnerId = set.winnerId;
        
        if (player1EntrantId && winnerId) {
          const isPlayer1Winner = String(player1EntrantId) === String(winnerId);
          
          if (isPlayer1Winner) {
            player1Wins++;
          } else {
            player1Losses++;
          }
        }
      });

      const total = player1Wins + player1Losses;
      const player1WinRate = total > 0 ? (player1Wins / total) * 100 : 0;
      const player2WinRate = total > 0 ? (player1Losses / total) * 100 : 0; // Player2's wins are Player1's losses

      // Set symmetric records
      setRecords(prev => ({
        ...prev,
        [recordKey1]: {
          wins: player1Wins,
          losses: player1Losses,
          total,
          winRate: player1WinRate,
          loading: false
        },
        [recordKey2]: {
          wins: player1Losses, // Player2's wins = Player1's losses
          losses: player1Wins, // Player2's losses = Player1's wins
          total,
          winRate: player2WinRate,
          loading: false
        }
      }));

      console.log(`🔍 SYMMETRIC RESULT: ${player1.gamerTag} ${player1Wins}-${player1Losses} vs ${player2.gamerTag} ${player1Losses}-${player1Wins}`);

    } catch (error) {
      setRecords(prev => ({
        ...prev,
        [recordKey1]: {
          wins: 0, losses: 0, total: 0, winRate: 0, loading: false,
          error: error instanceof Error ? error.message : 'Unknown error'
        },
        [recordKey2]: {
          wins: 0, losses: 0, total: 0, winRate: 0, loading: false,
          error: error instanceof Error ? error.message : 'Unknown error'
        }
      }));
    }
  }, [getHeadToHead, timeFilter]);

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

          console.log(`🔍 DEBUG: Fetched ${allSets.length} total sets for ${player1.gamerTag}`);
          console.log(`🔍 Looking for opponent: ${player2.gamerTag} (ID: ${player2.id})`);
          
          // Debug: Show ALL participant IDs in first few sets
          console.log(`🔍 DEBUGGING: All participant data in first 5 sets:`);
          allSets.slice(0, 5).forEach((set: Set, index: number) => {
            const allParticipants = set.slots?.flatMap(slot => 
              slot.entrant?.participants?.map(p => ({
                id: p.id,
                idType: typeof p.id,
                gamerTag: p.gamerTag
              })) || []
            ) || [];
            console.log(`Set ${index + 1}:`, allParticipants);
            
            // Also log if any gamerTag contains part of the opponent's name
            allParticipants.forEach(p => {
              if (p.gamerTag?.toLowerCase().includes(player2.gamerTag.toLowerCase()) || 
                  player2.gamerTag.toLowerCase().includes(p.gamerTag?.toLowerCase() || '')) {
                console.log(`🔍 POTENTIAL MATCH by gamerTag: ${p.gamerTag} vs ${player2.gamerTag}`);
              }
            });
          });
          
          // First, find ALL head-to-head sets between these two players
          const allHeadToHeadSets = allSets.filter((set: Set) => {
            const hasOpponent = set.slots?.some(slot =>
              slot.entrant?.participants?.some(p => {
                // Try multiple comparison methods
                const idMatch = String(p.id) === String(player2.id);
                const gamerTagMatch = p.gamerTag?.toLowerCase() === player2.gamerTag.toLowerCase();
                
                const match = idMatch || gamerTagMatch;
                
                if (match) {
                  console.log(`🔍 MATCH FOUND! Participant ${p.gamerTag} (${p.id}) matches ${player2.gamerTag} (${player2.id})`);
                  console.log(`🔍 Match type: ${idMatch ? 'ID' : 'gamerTag'}`);
                }
                return match;
              })
            );
            return hasOpponent;
          });

          console.log(`🔍 Found ${allHeadToHeadSets.length} total head-to-head sets between ${player1.gamerTag} and ${player2.gamerTag}`);

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
          
          console.log(`🔍 Using ${headToHeadSets.length} recent head-to-head sets (limit: ${maxSets})`);

          if (headToHeadSets.length > 0) {
            console.log(`🔍 Recent matchups:`, headToHeadSets.map(set => ({
              id: set.id,
              completedAt: set.completedAt ? new Date(set.completedAt * 1000).toLocaleDateString() : 'Unknown date',
              winnerId: set.winnerId
            })));
          }

          console.log(`🔍 Found ${headToHeadSets.length} head-to-head sets`);

          headToHeadSets.forEach((set: Set) => {
            console.log(`🔍 Analyzing set ${set.id}:`);
            
            // Find both entrants
            const player1Entrant = set.slots?.find(slot =>
              slot.entrant?.participants?.some(p => String(p.id) === String(player1.id) || p.gamerTag?.toLowerCase() === player1.gamerTag.toLowerCase())
            );
            
            const player2Entrant = set.slots?.find(slot =>
              slot.entrant?.participants?.some(p => String(p.id) === String(player2.id) || p.gamerTag?.toLowerCase() === player2.gamerTag.toLowerCase())
            );

            console.log(`🔍 Player1 (${player1.gamerTag}) entrant:`, {
              entrantId: player1Entrant?.entrant?.id,
              participants: player1Entrant?.entrant?.participants?.map(p => ({ id: p.id, tag: p.gamerTag }))
            });
            
            console.log(`🔍 Player2 (${player2.gamerTag}) entrant:`, {
              entrantId: player2Entrant?.entrant?.id,
              participants: player2Entrant?.entrant?.participants?.map(p => ({ id: p.id, tag: p.gamerTag }))
            });
            
            console.log(`🔍 Set winnerId: ${set.winnerId} (type: ${typeof set.winnerId})`);

            // Check winner with better type handling
            const player1EntrantId = player1Entrant?.entrant?.id;
            const winnerId = set.winnerId;
            
            if (player1EntrantId && winnerId) {
              const isWinner = String(player1EntrantId) === String(winnerId);
              
              if (isWinner) {
                wins++;
                console.log(`🔍 ✅ WIN for ${player1.gamerTag} (entrant ${player1EntrantId} === winner ${winnerId})`);
              } else {
                losses++;
                console.log(`🔍 ❌ LOSS for ${player1.gamerTag} (entrant ${player1EntrantId} !== winner ${winnerId})`);
              }
            } else {
              console.log(`🔍 ⚠️ Missing data - entrantId: ${player1EntrantId}, winnerId: ${winnerId}`);
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
          requests.push(() => calculateSymmetricHeadToHead(players[i], players[j]));
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
      if (Math.abs(a.winRate - b.winRate) < 0.1) { // If win rates are very close (within 0.1%)
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

  const getTimeFilterLabel = () => {
    switch (timeFilter) {
      case "6months":
        return "Last 10 Matches";
      case "1year":
        return "Last 20 Matches";
      case "2years":
        return "Last 30 Matches";
      case "all":
        return "All Matches";
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
    <div className="space-y-6">
      {/* Controls */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6 card-hover">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
            Power Rankings Matrix
          </h3>
          <div className="flex gap-2">
            <select
              value={timeFilter}
              onChange={e => setTimeFilter(e.target.value as typeof timeFilter)}
              className="px-3 py-1 border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-sm"
            >
              <option value="6months">Last 10 Matches</option>
              <option value="1year">Last 20 Matches</option>
              <option value="2years">Last 30 Matches</option>
              <option value="all">All Matches</option>
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
            <button
              onClick={() => setShowSearch(true)}
              className="px-4 py-2 gradient-primary text-white rounded-lg hover:opacity-90 transition-all"
            >
              Add Players
            </button>
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
