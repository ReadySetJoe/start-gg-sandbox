# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is a Next.js 15.4.2 application using the Pages Router, TypeScript, and Tailwind CSS v4. It integrates with the start.gg GraphQL API to display player profiles and tournament data.

## Common Development Commands

```bash
# Start development server with Turbopack
npm run dev

# Build for production
npm run build

# Start production server
npm start

# Run ESLint
npm run lint
```

## Architecture

### Routing Structure
- **Pages Router**: This project uses Next.js Pages Router (not App Router)
- Pages are located in `pages/` directory
- API routes are in `pages/api/` and automatically mapped to `/api/*` endpoints

### Application Routes
- `/` - Landing page with app overview and navigation
- `/search` - Player search page with multiple search methods  
- `/player/[id]` - Dynamic player profile page (bookmarkable)
- `/head-to-head` - Head-to-head matchup matrix tool
- `/rankings` - Power ranking comparison tool

### API Integration
- **Apollo Client** for GraphQL queries to start.gg API
- API configuration in `lib/apollo-client.ts`
- GraphQL queries defined in `lib/queries.ts`
- TypeScript types for API responses in `types/startgg.ts`

### Styling
- Tailwind CSS v4 with PostCSS
- Global styles in `styles/globals.css` with custom utilities
- Custom fonts: Geist Sans and Geist Mono from Google Fonts
- Dark mode support with CSS variables

### TypeScript Configuration
- Strict mode enabled
- Path alias `@/*` maps to root directory
- Target: ES2017

### Key Technologies
- React 19.1.0
- Next.js 15.4.2 with Turbopack
- TypeScript 5
- Tailwind CSS 4
- Apollo Client 3.13.8
- ESLint 9 with Next.js config

### Environment Variables
- `START_GG_API_KEY`: API key for start.gg GraphQL API (stored in .env file)