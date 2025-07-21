import HeadToHeadMatrix from '@/components/HeadToHeadMatrix';

export default function HeadToHead() {
  return (
    <>
      <h1 className="text-4xl font-bold text-center text-gradient mb-6">
        Head-to-Head Analysis
      </h1>
      
      <div className="max-w-6xl mx-auto">
        <div className="mb-8 text-center">
          <p className="text-lg text-gray-600 dark:text-gray-400 mb-4">
            Create comprehensive head-to-head matchup matrices between players
          </p>
          <p className="text-sm text-gray-500 dark:text-gray-500">
            Essential tool for power rankings, tournament seeding, and understanding player matchups
          </p>
        </div>
        
        <HeadToHeadMatrix />
        
        <div className="mt-8 grid md:grid-cols-2 gap-6">
          <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-6">
            <h3 className="font-semibold text-green-900 dark:text-green-100 mb-3">
              ✅ Best For Power Rankings
            </h3>
            <ul className="text-sm text-green-800 dark:text-green-200 space-y-1">
              <li>• Identify dominant players with winning records</li>
              <li>• Spot upset potential (losing records vs higher seeds)</li>
              <li>• Balance overall performance with head-to-head</li>
              <li>• Make data-driven ranking decisions</li>
            </ul>
          </div>
          
          <div className="bg-purple-50 dark:bg-purple-900/20 border border-purple-200 dark:border-purple-800 rounded-lg p-6">
            <h3 className="font-semibold text-purple-900 dark:text-purple-100 mb-3">
              🎯 Tournament Insights
            </h3>
            <ul className="text-sm text-purple-800 dark:text-purple-200 space-y-1">
              <li>• Avoid problematic bracket placements</li>
              <li>• Seed based on actual matchup data</li>
              <li>• Predict potential bracket upsets</li>
              <li>• Create more competitive brackets</li>
            </ul>
          </div>
        </div>
        
        <div className="mt-6 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-6">
          <h3 className="font-semibold text-yellow-900 dark:text-yellow-100 mb-3">
            💡 How to Use the Matrix
          </h3>
          <div className="grid md:grid-cols-3 gap-4 text-sm text-yellow-800 dark:text-yellow-200">
            <div>
              <h4 className="font-medium mb-2">1️⃣ Add Players</h4>
              <p>Start by adding 2+ players you want to compare. You can add players from different regions or skill levels.</p>
            </div>
            <div>
              <h4 className="font-medium mb-2">2️⃣ Set Time Period</h4>
              <p>Choose your timeframe - use 6 months for current form or 1-2 years for more stable data.</p>
            </div>
            <div>
              <h4 className="font-medium mb-2">3️⃣ Analyze Results</h4>
              <p>Read the matrix: row player vs column player. Green = winning, Red = losing, Yellow = even.</p>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}