import Link from "next/link";

export default function Home() {
  return (
    <div className="max-w-4xl mx-auto text-center">
      <h1 className="text-6xl font-bold text-gradient mb-6 p-1">
        Start.gg Player Profiles
      </h1>

      <p className="text-xl text-gray-600 dark:text-gray-400 mb-12 max-w-2xl mx-auto">
        Search and view detailed profiles of competitive gaming players from
        start.gg tournaments. Track match history, tournament placements, and
        player statistics.
      </p>

      <div className="grid md:grid-cols-3 gap-6 mb-8">
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6 card-hover">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-3">
            🔍 Player Profiles
          </h2>
          <p className="text-gray-600 dark:text-gray-400 mb-4 text-sm">
            Search and analyze individual player performance, match history, and
            tournament results.
          </p>
          <Link
            href="/search"
            className="inline-block px-4 py-2 gradient-primary text-white rounded-lg hover:opacity-90 transition-all font-medium text-sm"
          >
            Search Players
          </Link>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6 card-hover">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-3">
            ⚔️ Head-to-Head Matrix
          </h2>
          <p className="text-gray-600 dark:text-gray-400 mb-4 text-sm">
            Create comprehensive matchup matrices to compare multiple players
            against each other.
          </p>
          <Link
            href="/head-to-head"
            className="inline-block px-4 py-2 gradient-primary text-white rounded-lg hover:opacity-90 transition-all font-medium text-sm"
          >
            Analyze Matchups
          </Link>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6 card-hover">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-3">
            🏆 Power Rankings
          </h2>
          <p className="text-gray-600 dark:text-gray-400 mb-4 text-sm">
            Compare multiple players and generate data-driven power rankings for
            tournaments.
          </p>
          <Link
            href="/rankings"
            className="inline-block px-4 py-2 gradient-primary text-white rounded-lg hover:opacity-90 transition-all font-medium text-sm"
          >
            Create Rankings
          </Link>
        </div>
      </div>

      <div className="grid md:grid-cols-3 gap-6">
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6 card-hover">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-3">
            🎯 Player Analysis
          </h3>
          <ul className="text-left text-gray-600 dark:text-gray-400 space-y-2 text-sm">
            <li>• Individual match history and results</li>
            <li>• Performance trends over time</li>
            <li>• Tournament participation tracking</li>
            <li>• Bookmarkable player profiles</li>
          </ul>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6 card-hover">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-3">
            📊 Matchup Matrix
          </h3>
          <ul className="text-left text-gray-600 dark:text-gray-400 space-y-2 text-sm">
            <li>• Multi-player head-to-head grids</li>
            <li>• Time-filtered matchup records</li>
            <li>• Visual win/loss indicators</li>
            <li>• Perfect for tournament seeding</li>
          </ul>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6 card-hover">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-3">
            🏅 Ranking Tools
          </h3>
          <ul className="text-left text-gray-600 dark:text-gray-400 space-y-2 text-sm">
            <li>• Automated player comparisons</li>
            <li>• Win rate and activity weighting</li>
            <li>• Seasonal performance analysis</li>
            <li>• Data-driven power rankings</li>
          </ul>
        </div>
      </div>
    </div>
  );
}
