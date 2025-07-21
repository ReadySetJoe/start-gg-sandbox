# Start.gg GraphQL API Guide

## API Endpoint
The start.gg GraphQL API has a single endpoint:
```
https://api.start.gg/gql/alpha
```

## Authentication
You need an API token for authentication. Include it in the Authorization header:
```
Authorization: Bearer YOUR_API_KEY
```

## Key Findings About Player/User Search

### ⚠️ Important: No Direct Player Search
The start.gg API **does NOT have a direct search query** for finding players by name or gamerTag. Common misconceptions include:
- ❌ `searchPlayers` - This query does not exist
- ❌ `searchUsers` - This query does not exist
- ❌ General text search for players

### ✅ Available User/Player Queries

#### 1. Get User by Slug
```graphql
query GetUserBySlug($slug: String!) {
  user(slug: $slug) {
    id
    discriminator
    name
    slug
    email
    genderPronoun
    bio
    birthday
    location {
      country
      state
      city
    }
    player {
      id
      gamerTag
      prefix
    }
    authorizations {
      type
      externalUsername
    }
    images {
      type
      url
    }
  }
}
```

**Usage**: Requires exact user slug in format `"user/abc123"`

#### 2. Get Current Authenticated User
```graphql
query GetCurrentUser {
  currentUser {
    id
    discriminator
    name
    slug
    email
    genderPronoun
    player {
      id
      gamerTag
      prefix
    }
    images {
      type
      url
    }
  }
}
```

**Usage**: Returns the user associated with the API token

#### 3. Get Player by ID
```graphql
query GetPlayerById($playerId: ID!) {
  player(id: $playerId) {
    id
    gamerTag
    prefix
    user {
      id
      slug
      name
      discriminator
    }
  }
}
```

**Usage**: Requires exact player ID

#### 4. Find Players Through Tournament Entrants
```graphql
query GetTournamentEntrants($slug: String!, $perPage: Int = 100) {
  tournament(slug: $slug) {
    id
    name
    events {
      id
      name
      entrants(query: { perPage: $perPage }) {
        nodes {
          id
          name
          participants {
            id
            gamerTag
            prefix
            user {
              id
              slug
              name
              discriminator
              images {
                type
                url
              }
            }
          }
        }
      }
    }
  }
}
```

**Usage**: Search for players by looking at tournament participants

## How to "Search" for Players

Since there's no direct search, you have these options:

### Option 1: User Slug Lookup
If you know a user's slug (format: `user/abc123`), you can get their information directly.

### Option 2: Tournament-based Discovery
Search through recent tournaments to find players:
1. Get a list of recent tournaments
2. Query tournament entrants
3. Filter/search through the participant list

### Option 3: Use Discriminators
Users have unique discriminators (8-character codes) that can be used to find profiles:
- URL format: `https://start.gg/user/[discriminator]`
- Users can share their discriminator for easy lookup

## Request Format

```javascript
const response = await fetch('https://api.start.gg/gql/alpha', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
    'Authorization': 'Bearer YOUR_API_KEY'
  },
  body: JSON.stringify({
    query: `your GraphQL query here`,
    variables: {
      // your variables here
    }
  })
});
```

## Key Entity Relationships

- **User**: Global profile with personal info
- **Player**: Gaming-specific profile linked to a User
- **Participant**: Player's participation in a specific tournament
- **Entrant**: Tournament entry (can have multiple participants for teams)

## Common Use Cases

1. **Get user profile**: Use `user(slug: "user/abc123")`
2. **Get current user**: Use `currentUser`
3. **Find players in tournament**: Use tournament entrants query
4. **Get player's match history**: Use `player(id: "playerId")` with sets/standings

## Limitations

- No fuzzy text search for players
- No search by gamerTag across all players
- Must know specific identifiers (slug, ID, discriminator)
- Player discovery primarily through tournament participation