import { useState } from "react";
import { useQuery } from "@apollo/client";
import { GET_PLAYER_DETAILS } from "@/lib/queries";
import { Set } from "@/types/startgg";

interface PerformanceAnalysisProps {
  playerId: string;
}

interface PeriodStats {
  wins: number;
  losses: number;
  total: number;
  winRate: number;
  tournaments: Set[];
  period: string;
}

export default function PerformanceAnalysis({
  playerId,
}: PerformanceAnalysisProps) {
  const [selectedPeriod, setSelectedPeriod] = useState<
    "3months" | "6months" | "1year" | "2years"
  >("1year");

  // Get data for different time periods
  const now = new Date();
  const periods = [
    { key: "3months", label: "Last 3 Months", months: 3 },
    { key: "6months", label: "Last 6 Months", months: 6 },
    { key: "1year", label: "Last Year", months: 12 },
    { key: "2years", label: "Last 2 Years", months: 24 },
  ];

  const getDateFilter = (months: number) => {
    const date = new Date(now.getTime() - months * 30 * 24 * 60 * 60 * 1000);
    return Math.floor(date.getTime() / 1000);
  };

  const { loading, data, error } = useQuery(GET_PLAYER_DETAILS, {
    variables: {
      playerId,
      perPage: 30,
      filters: {
        updatedAfter: getDateFilter(24), // Get last 2 years of data
      },
    },
  });

  const calculatePeriodStats = (months: number): PeriodStats => {
    if (!data?.player?.sets?.nodes) {
      return {
        wins: 0,
        losses: 0,
        total: 0,
        winRate: 0,
        tournaments: [],
        period: `${months} months`,
      };
    }

    const cutoffDate = getDateFilter(months);
    const sets = data.player.sets.nodes.filter(
      (set: Set) => set.completedAt && set.completedAt >= cutoffDate
    );

    let wins = 0;
    let losses = 0;

    sets.forEach((set: Set) => {
      const playerEntrant = set.slots?.find(slot =>
        slot.entrant?.participants?.some(p => p.id === playerId)
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
      tournaments: sets,
      period: months === 12 ? "1 year" : `${months} months`,
    };
  };

  const getComparison = () => {
    const stats3m = calculatePeriodStats(3);
    const stats6m = calculatePeriodStats(6);
    const stats1y = calculatePeriodStats(12);
    const stats2y = calculatePeriodStats(24);

    return { stats3m, stats6m, stats1y, stats2y };
  };

  const getTrendIndicator = (current: number, previous: number) => {
    if (current > previous)
      return {
        icon: "↗️",
        color: "text-green-600 dark:text-green-400",
        text: "Improving",
      };
    if (current < previous)
      return {
        icon: "↘️",
        color: "text-red-600 dark:text-red-400",
        text: "Declining",
      };
    return {
      icon: "➡️",
      color: "text-gray-600 dark:text-gray-400",
      text: "Stable",
    };
  };

  if (loading) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6 card-hover">
        <div className="animate-pulse">
          <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/3 mb-4"></div>
          <div className="space-y-3">
            <div className="h-20 bg-gray-200 dark:bg-gray-700 rounded"></div>
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

  const comparison = getComparison();
  const periodKeyMap: Record<
    "3months" | "6months" | "1year" | "2years",
    keyof typeof comparison
  > = {
    "3months": "stats3m",
    "6months": "stats6m",
    "1year": "stats1y",
    "2years": "stats2y",
  };
  const currentStats = comparison[periodKeyMap[selectedPeriod]];

  // Calculate trends
  const winRateTrend = getTrendIndicator(
    comparison.stats3m.winRate,
    comparison.stats6m.winRate
  );

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6 card-hover">
      <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">
        Performance Analysis
      </h3>

      {/* Period Selector */}
      <div className="flex gap-2 mb-6 overflow-x-auto">
        {periods.map(period => (
          <button
            key={period.key}
            onClick={() =>
              setSelectedPeriod(
                period.key as "3months" | "6months" | "1year" | "2years"
              )
            }
            className={`px-3 py-2 rounded-lg text-sm whitespace-nowrap transition-colors ${
              selectedPeriod === period.key
                ? "gradient-primary text-white"
                : "bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600"
            }`}
          >
            {period.label}
          </button>
        ))}
      </div>

      {/* Current Period Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <div className="text-center p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
          <div className="text-xl font-bold text-green-600 dark:text-green-400">
            {currentStats.wins}
          </div>
          <div className="text-sm text-gray-600 dark:text-gray-400">Wins</div>
        </div>
        <div className="text-center p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
          <div className="text-xl font-bold text-red-600 dark:text-red-400">
            {currentStats.losses}
          </div>
          <div className="text-sm text-gray-600 dark:text-gray-400">Losses</div>
        </div>
        <div className="text-center p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
          <div className="text-xl font-bold text-gray-900 dark:text-gray-100">
            {currentStats.total}
          </div>
          <div className="text-sm text-gray-600 dark:text-gray-400">Sets</div>
        </div>
        <div className="text-center p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
          <div
            className={`text-xl font-bold ${
              currentStats.winRate >= 50
                ? "text-green-600 dark:text-green-400"
                : "text-red-600 dark:text-red-400"
            }`}
          >
            {currentStats.winRate.toFixed(1)}%
          </div>
          <div className="text-sm text-gray-600 dark:text-gray-400">
            Win Rate
          </div>
        </div>
      </div>

      {/* Performance Trend */}
      <div className="mb-6">
        <h4 className="font-medium text-gray-900 dark:text-gray-100 mb-3">
          Performance Trend
        </h4>
        <div className="p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
          <div className="flex items-center justify-between">
            <span className="text-sm text-gray-600 dark:text-gray-400">
              Win Rate Trend (3m vs 6m)
            </span>
            <div className={`flex items-center gap-2 ${winRateTrend.color}`}>
              <span>{winRateTrend.icon}</span>
              <span className="text-sm font-medium">{winRateTrend.text}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Period Comparison */}
      <div>
        <h4 className="font-medium text-gray-900 dark:text-gray-100 mb-3">
          Period Comparison
        </h4>
        <div className="space-y-2">
          {periods.map(period => {
            const periodKeyMap: Record<
              "3months" | "6months" | "1year" | "2years",
              keyof typeof comparison
            > = {
              "3months": "stats3m",
              "6months": "stats6m",
              "1year": "stats1y",
              "2years": "stats2y",
            };
            const stats =
              comparison[periodKeyMap[period.key as keyof typeof periodKeyMap]];
            return (
              <div
                key={period.key}
                className="flex justify-between items-center p-3 bg-gray-50 dark:bg-gray-700 rounded"
              >
                <span className="text-sm font-medium text-gray-900 dark:text-gray-100">
                  {period.label}
                </span>
                <div className="flex items-center gap-4">
                  <span className="text-sm text-gray-600 dark:text-gray-400">
                    {stats.wins}-{stats.losses}
                  </span>
                  <span
                    className={`text-sm font-medium ${
                      stats.winRate >= 50
                        ? "text-green-600 dark:text-green-400"
                        : "text-red-600 dark:text-red-400"
                    }`}
                  >
                    {stats.winRate.toFixed(1)}%
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {currentStats.total === 0 && (
        <div className="text-center py-4 text-gray-500 dark:text-gray-400">
          No match data available for this time period
        </div>
      )}
    </div>
  );
}
