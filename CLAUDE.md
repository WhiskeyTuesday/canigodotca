# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

**Can I Go** (canigo.ca) — A mobile-first web app that tracks days outside a Canadian province/territory to monitor healthcare eligibility and US substantial presence for tax purposes.

The full specification is in `SPEC-canigo-ca.md`.

## Tech Stack

- Svelte 5 (with runes: `$state`, `$derived`)
- TailwindCSS + Tailwind Typography
- Lucide Icons (via `lucide-svelte`)
- Vite
- TypeScript

## Build Commands

```bash
npm install          # Install dependencies
npm run dev          # Dev server (Vite)
npm run build        # Production build
npm run preview      # Preview production build
```

## Architecture

### Data Model

- **Trip**: Has departure/return dates, ordered `DestinationLeg[]`, optional notes. Trips spanning New Year are split into two records.
- **DestinationLeg**: destination (`"bc"` | `"other_ca"` | `"usa"` | `"other"`), arrival/departure dates.
- **UserSettings**: home province, theme (`"light"` | `"dark"` | `"dim"` | `"system"`), year of interest.

### Core Calculations

1. **Provincial healthcare eligibility**: Count days present in home province vs threshold (183 or 212 depending on province) per calendar year.
2. **US substantial presence test**: 100% current year US days + 1/3 prior year + 1/6 two years ago. Threshold is 183 days, with a minimum 31 days in current year.

### State Management

Svelte 5 runes — `$state` for settings and trips, `$derived` for calculated provincial status and US presence.

### Persistence

- **Auto-save**: localStorage with key `canigo_data`, debounced 500ms on every change.
- **File export/import**: JSONL format — first line is settings, subsequent lines are individual trips.

### Theme System

Three themes (light/dim/dark) via CSS custom properties, defaulting to `prefers-color-scheme`. Three-position toggle switch.

### Provincial Rules (Simplified)

| Max Days Outside | Provinces |
|------------------|-----------|
| 183 | BC, Quebec, PEI, Nunavut, Saskatchewan, Manitoba, New Brunswick, Nova Scotia, Newfoundland, Northwest Territories |
| 212 | Alberta, Ontario, Yukon |

Each dashboard card links to the official government source URL for the rule it displays.
