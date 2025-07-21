import RankingsMatrix from '@/components/RankingsMatrix';

export default function Rankings() {
  return (
    <>
      <h1 className="text-4xl font-bold text-center text-gradient mb-8">
        Power Rankings
      </h1>
      
      <div className="max-w-6xl mx-auto">
        <div className="mb-8 text-center">
          <p className="text-lg text-gray-600 dark:text-gray-400 mb-4">
            Head-to-head power rankings with comprehensive matchup matrix
          </p>
          <p className="text-sm text-gray-500 dark:text-gray-500">
            Players ranked by overall wins, with detailed head-to-head breakdown
          </p>
        </div>
        
        <RankingsMatrix />
        
        <div className="mt-8 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-6">
          <h3 className="font-semibold text-blue-900 dark:text-blue-100 mb-3">
            💡 Power Ranking Methodology
          </h3>
          <div className="grid md:grid-cols-2 gap-4 text-sm text-blue-800 dark:text-blue-200">
            <div>
              <h4 className="font-medium mb-2">📊 Ranking System</h4>
              <ul className="space-y-1">
                <li>• Players ranked by total head-to-head wins</li>
                <li>• Matrix shows win-loss record for each matchup</li>
                <li>• Time filtering applies to all data</li>
              </ul>
            </div>
            <div>
              <h4 className="font-medium mb-2">🎯 Usage Tips</h4>
              <ul className="space-y-1">
                <li>• Green cells indicate winning records</li>
                <li>• Use 6-month periods for current form</li>
                <li>• Perfect for tournament seeding decisions</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}