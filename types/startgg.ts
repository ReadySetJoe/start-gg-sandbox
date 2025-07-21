export interface User {
  id: string;
  slug: string;
  name?: string;
  bio?: string;
  birthday?: string;
  genderPronoun?: string;
  location?: {
    country?: string;
    state?: string;
    city?: string;
  };
  images?: Array<{
    type: string;
    url: string;
  }>;
  authorizations?: Array<{
    type: string;
    externalUsername: string;
  }>;
}

export interface Player {
  id: string;
  gamerTag: string;
  prefix?: string;
  user?: User;
}

export interface Participant {
  id: string;
  gamerTag: string;
  prefix?: string;
  user?: {
    id: string;
    slug: string;
  };
}

export interface Entrant {
  id: string;
  name: string;
  participants?: Participant[];
}

export interface Tournament {
  id: string;
  name: string;
  slug: string;
  startAt?: number;
  endAt?: number;
  city?: string;
  countryCode?: string;
}

export interface Event {
  id: string;
  name: string;
  slug: string;
  numEntrants?: number;
  tournament: Tournament;
}

export interface Standing {
  id: string;
  placement: number;
  event: Event;
}

export interface Slot {
  id: string;
  standing?: {
    placement: number;
    stats?: {
      score?: {
        value: number;
      };
    };
  };
  entrant?: Entrant;
}

export interface GameSelection {
  entrant?: Entrant;
  selectionType: string;
  selectionValue: number;
}

export interface Game {
  id: string;
  winnerId?: string;
  selections?: GameSelection[];
}

export interface Set {
  id: string;
  completedAt?: number;
  displayScore?: string;
  round?: number;
  fullRoundText?: string;
  winnerId?: string;
  event: Event;
  slots?: Slot[];
  games?: Game[];
}

export interface PlayerDetails extends Player {
  sets?: {
    nodes: Set[];
    pageInfo?: {
      totalPages: number;
      total: number;
    };
  };
}
