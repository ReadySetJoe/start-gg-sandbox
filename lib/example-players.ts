// Example player slugs for demo purposes
// These are user IDs (slugs) that can be used to pre-populate the app
// Format: The part after "user/" in the start.gg profile URL

export interface ExamplePlayer {
  slug: string; // e.g., "abc12345" (will be prefixed with "user/" when querying)
  name: string; // Display name for the button/list
}

// Add player slugs here - these will be used to demo the app
// You can find these on start.gg player profiles (8-character codes like 'abc12345')
export const EXAMPLE_PLAYERS: ExamplePlayer[] = [
  // TODO: Replace these with real player slugs
  { slug: "2a371960", name: "Zain" },
  { slug: "da8b9c25", name: "Cody Schwab" },
  { slug: "076502c1", name: "Hungrybox" },
  { slug: "cfe7a825", name: "aMSa" },
  { slug: "cddea7f7", name: "Krudo" },
];

// Minimum players needed for the rankings demo
export const MIN_PLAYERS_FOR_RANKINGS = 2;
