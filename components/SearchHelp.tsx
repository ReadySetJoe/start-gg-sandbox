import { useState } from "react";

export default function SearchHelp() {
  const [showHelp, setShowHelp] = useState(false);

  if (!showHelp) {
    return (
      <div className="text-center mb-6">
        <button
          onClick={() => setShowHelp(true)}
          className="text-blue-600 dark:text-blue-400 hover:underline text-sm"
        >
          Need help finding players? Click here
        </button>
      </div>
    );
  }

  return (
    <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4 mb-6">
      <div className="flex justify-between items-start mb-3">
        <h3 className="font-semibold text-blue-900 dark:text-blue-100">
          How to Find Players
        </h3>
        <button
          onClick={() => setShowHelp(false)}
          className="text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-200"
        >
          ×
        </button>
      </div>

      <div className="space-y-3 text-sm text-blue-800 dark:text-blue-200">
        <div>
          <strong>By User ID:</strong>
          <ul className="list-disc list-inside mt-1 ml-4 space-y-1">
            <li>
              Find a player&apos;s start.gg profile URL (like
              start.gg/user/abc12345)
            </li>
            <li>
              Copy the 8-character code after &quot;/user/&quot; (e.g.,
              &quot;abc12345&quot;)
            </li>
            <li>
              Try some examples:{" "}
              <code className="bg-blue-100 dark:bg-blue-800 px-1 rounded">
                user/abc12345
              </code>
            </li>
          </ul>
        </div>

        <div>
          <strong>In Tournaments:</strong>
          <ul className="list-disc list-inside mt-1 ml-4 space-y-1">
            <li>Search for players who participated in recent tournaments</li>
            <li>
              Try popular gamer tags like &quot;MkLeo&quot;, &quot;Tweek&quot;,
              &quot;Sparg0&quot;
            </li>
            <li>This searches across multiple recent tournaments</li>
          </ul>
        </div>

        <div className="text-xs text-blue-600 dark:text-blue-400 mt-3">
          <strong>Note:</strong> Start.gg doesn&apos;t allow searching all
          players by name. You need either their exact user ID or to find them
          through tournament participation.
        </div>
      </div>
    </div>
  );
}
