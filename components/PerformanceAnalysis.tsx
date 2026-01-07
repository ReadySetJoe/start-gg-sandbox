import { useQuery } from "@apollo/client";
import { GET_PLAYER_DETAILS } from "@/lib/queries";
import { Set } from "@/types/startgg";

interface PerformanceAnalysisProps {
  playerId: string;
}

interface PerformanceStats {
  wins: number;
  losses: number;
  total: number;
  winRate: number;
  oldestMatch: Date | null;
  newestMatch: Date | null;
}

export default function PerformanceAnalysis({
  playerId,
}: PerformanceAnalysisProps) {
  const { loading, data, error } = useQuery(GET_PLAYER_DETAILS, {
    variables: {
      playerId,
      perPage: 40, // Limited by start.gg API complexity (1000 objects max)
    },
  });

  const calculateStats = (): PerformanceStats => {
    if (!data?.player?.sets?.nodes) {
      return {
        wins: 0,
        losses: 0,
        total: 0,
        winRate: 0,
        oldestMatch: null,
        newestMatch: null,
      };
    }

    const player = data.player;
    const sets = data.player.sets.nodes;

    let wins = 0;
    let losses = 0;
    let oldestTimestamp: number | null = null;
    let newestTimestamp: number | null = null;

    sets.forEach((set: Set) => {
      // Track date range
      if (set.completedAt) {
        if (oldestTimestamp === null || set.completedAt < oldestTimestamp) {
          oldestTimestamp = set.completedAt;
        }
        if (newestTimestamp === null || set.completedAt > newestTimestamp) {
          newestTimestamp = set.completedAt;
        }
      }

      // Try to find player's slot by participant ID first
      let playerSlot = set.slots?.find(slot =>
        slot.entrant?.participants?.some(
          p => String(p.id) === String(playerId)
        )
      );

      // Fallback: try matching by gamerTag
      if (!playerSlot && player.gamerTag) {
        playerSlot = set.slots?.find(slot =>
          slot.entrant?.participants?.some(
            p => p.gamerTag?.toLowerCase() === player.gamerTag.toLowerCase()
          )
        );
      }

      // Fallback: try matching by user slug
      if (!playerSlot && player.user?.slug) {
        playerSlot = set.slots?.find(slot =>
          slot.entrant?.participants?.some(
            p => p.user?.slug === player.user?.slug
          )
        );
      }

      // Determine win/loss
      const playerEntrantId = playerSlot?.entrant?.id;
      const winnerId = set.winnerId;

      if (
        playerEntrantId &&
        winnerId &&
        String(playerEntrantId) === String(winnerId)
      ) {
        wins++;
      } else if (playerSlot) {
        // Only count as loss if we found the player in this set
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
      oldestMatch: oldestTimestamp ? new Date(oldestTimestamp * 1000) : null,
      newestMatch: newestTimestamp ? new Date(newestTimestamp * 1000) : null,
    };
  };

  const formatDateRange = (oldest: Date | null, newest: Date | null): string => {
    if (!oldest || !newest) return "";

    const formatDate = (date: Date) => {
      return date.toLocaleDateString("en-US", {
        month: "short",
        year: "numeric",
      });
    };

    const oldestStr = formatDate(oldest);
    const newestStr = formatDate(newest);

    if (oldestStr === newestStr) {
      return oldestStr;
    }

    return `${oldestStr} - ${newestStr}`;
  };

  if (loading) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6 card-hover">
        <div className="animate-pulse">
          <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/3 mb-4"></div>
          <div className="space-y-3">
            <div className="h-20 bg-gray-200 dark:bg-gray-700 rounded"></div>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6 card-hover">
        <div className="p-3 bg-red-100 dark:bg-red-900/20 text-red-700 dark:text-red-400 rounded text-sm">
          Error loading performance data: {error.message}
        </div>
      </div>
    );
  }

  const stats = calculateStats();
  const dateRange = formatDateRange(stats.oldestMatch, stats.newestMatch);

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6 card-hover">
      <div className="flex justify-between items-start mb-4">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
          Recent Performance
        </h3>
        {dateRange && (
          <span className="text-sm text-gray-500 dark:text-gray-400">
            {dateRange}
          </span>
        )}
      </div>

      {stats.total === 0 ? (
        <div className="text-center py-4 text-gray-500 dark:text-gray-400">
          No match data available
        </div>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="text-center p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
            <div className="text-xl font-bold text-green-600 dark:text-green-400">
              {stats.wins}
            </div>
            <div className="text-sm text-gray-600 dark:text-gray-400">Wins</div>
          </div>
          <div className="text-center p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
            <div className="text-xl font-bold text-red-600 dark:text-red-400">
              {stats.losses}
            </div>
            <div className="text-sm text-gray-600 dark:text-gray-400">
              Losses
            </div>
          </div>
          <div className="text-center p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
            <div className="text-xl font-bold text-gray-900 dark:text-gray-100">
              {stats.total}
            </div>
            <div className="text-sm text-gray-600 dark:text-gray-400">Sets</div>
          </div>
          <div className="text-center p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
            <div
              className={`text-xl font-bold ${
                stats.winRate >= 50
                  ? "text-green-600 dark:text-green-400"
                  : "text-red-600 dark:text-red-400"
              }`}
            >
              {stats.winRate.toFixed(1)}%
            </div>
            <div className="text-sm text-gray-600 dark:text-gray-400">
              Win Rate
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
