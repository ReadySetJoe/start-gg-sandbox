import { gql } from '@apollo/client';

export const GET_USER_BY_SLUG = gql`
  query GetUserBySlug($slug: String!) {
    user(slug: $slug) {
      id
      slug
      name
      bio
      birthday
      genderPronoun
      location {
        country
        state
        city
      }
      images {
        type
        url
      }
      authorizations {
        type
        externalUsername
      }
      player {
        id
        gamerTag
        prefix
      }
    }
  }
`;

export const GET_TOURNAMENT_ENTRANTS = gql`
  query GetTournamentEntrants($slug: String!, $page: Int = 1, $perPage: Int = 20, $filter: String) {
    tournament(slug: $slug) {
      id
      name
      participants(query: {
        page: $page
        perPage: $perPage
        filter: {
          gamerTag: $filter
        }
      }) {
        nodes {
          id
          gamerTag
          prefix
          user {
            id
            slug
            name
            location {
              country
              state
              city
            }
            images {
              type
              url
            }
          }
        }
        pageInfo {
          total
          totalPages
        }
      }
    }
  }
`;

export const SEARCH_RECENT_TOURNAMENTS = gql`
  query SearchRecentTournaments($perPage: Int = 5) {
    tournaments(query: {
      perPage: $perPage
      sortBy: "startAt desc"
      filter: {
        past: false
      }
    }) {
      nodes {
        id
        name
        slug
        startAt
        city
        countryCode
        numAttendees
        events {
          id
          name
          numEntrants
        }
      }
    }
  }
`;

export const GET_PLAYER_DETAILS = gql`
  query GetPlayerDetails($playerId: ID!, $perPage: Int = 20, $filters: SetFilters) {
    player(id: $playerId) {
      id
      gamerTag
      prefix
      user {
        id
        slug
        name
        bio
        birthday
        genderPronoun
        location {
          country
          state
          city
        }
        images {
          type
          url
        }
        authorizations {
          type
          externalUsername
        }
      }
      sets(perPage: $perPage, filters: $filters) {
        nodes {
          id
          completedAt
          displayScore
          round
          fullRoundText
          winnerId
          event {
            id
            name
            slug
            tournament {
              id
              name
              slug
              startAt
              endAt
              city
              countryCode
            }
          }
          slots {
            id
            standing {
              placement
              stats {
                score {
                  value
                }
              }
            }
            entrant {
              id
              name
              participants {
                id
                gamerTag
                prefix
                user {
                  id
                  slug
                }
              }
            }
          }
        }
        pageInfo {
          total
          totalPages
        }
      }
    }
  }
`;

export const GET_PLAYER_TOURNAMENTS = gql`
  query GetPlayerTournaments($playerId: ID!, $perPage: Int = 10) {
    player(id: $playerId) {
      id
      gamerTag
      user {
        tournaments(query: {
          perPage: $perPage
        }) {
          nodes {
            id
            name
            slug
            startAt
            endAt
            city
            countryCode
            events {
              id
              name
              numEntrants
              standings(query: {
                perPage: 1
                filter: {
                  participantIds: [$playerId]
                }
              }) {
                nodes {
                  id
                  placement
                }
              }
            }
          }
        }
      }
    }
  }
`;

export const GET_PLAYER_HEAD_TO_HEAD = gql`
  query GetPlayerHeadToHead($playerId: ID!, $perPage: Int = 100) {
    player(id: $playerId) {
      id
      gamerTag
      sets(perPage: $perPage) {
        nodes {
          id
          winnerId
          completedAt
          slots {
            entrant {
              id
              participants {
                id
                gamerTag
              }
            }
          }
        }
      }
    }
  }
`;

export const GET_PLAYER_CHARACTERS = gql`
  query GetPlayerCharacters($playerId: ID!) {
    player(id: $playerId) {
      id
      gamerTag
      recentSets(perPage: 50) {
        nodes {
          id
          games {
            id
            winnerId
            selections {
              entrant {
                id
                participants {
                  id
                  gamerTag
                }
              }
              selectionType
              selectionValue
            }
          }
        }
      }
    }
  }
`;