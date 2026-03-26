# SPEC: canigo.ca - Residency Tracker App

## Overview

**App Name**: Can I Go (canigo.ca)  
**Purpose**: Track days outside your Canadian province/territory to monitor healthcare eligibility and US substantial presence  
**Stack**: Svelte 5, TailwindCSS, Tailwind Typography, Lucide Icons, Vite  
**Platform**: Mobile-first responsive web app

## Official Sources

### Provincial Healthcare Eligibility Rules

| Province/Territory | Rule | Source |
|-------------------|------|--------|
| BC | Must be physically present in BC at least 6 months (183 days) in a calendar year. Vacation absences allowed up to 7 months (212 days). | [BC MSP Eligibility](https://www2.gov.bc.ca/gov/content/health/health-drug-coverage/msp/bc-residents/eligibility-and-enrolment/are-you-eligible) |
| Alberta | Must be physically present in Alberta for at least 183 days in a 12-month period. Vacation absences up to 212 days. | [Alberta AHCIP Absence](https://www.alberta.ca/ahcip-absence-from-alberta) |
| Ontario | Must be physically present in Ontario for 153 days in any 12-month period. Away up to 7 months (212 days) allowed with pre-approval. | [Ontario OHIP Coverage](https://www.ontario.ca/page/ohip-coverage-while-outside-canada) |
| Quebec | Must be present in Quebec for 183 days or more in the calendar year. | [Quebec Séjours hors du Québec](https://www.quebec.ca/sante/systeme-et-services-de-sante/sejours-hors-du-quebec) |
| PEI | 183 days absence limit (calendar year) | [PEI Health](https://www.princeedwardisland.ca/) |
| Nunavut | 183 days absence limit (calendar year) | [Nunavut Health](https://www.gov.nu.ca/health) |
| Saskatchewan | 183 days absence limit (calendar year) | [Saskatchewan Health](https://www.saskatchewan.ca/) |
| Manitoba | 183 days absence limit (calendar year) | [Manitoba Health](https://www.gov.mb.ca/health/) |
| New Brunswick | 183 days absence limit (calendar year) | [New Brunswick Health](https://www2.gnb.ca/) |
| Nova Scotia | 183 days absence limit (calendar year) | [Nova Scotia Health](https://novascotia.ca/dhw/) |
| Newfoundland | 183 days absence limit (calendar year) | [Newfoundland Health](https://www.gov.nl.ca/health/) |
| Yukon | 212 days (7 months) absence limit | [Yukon Health](https://yukon.ca/en/health) |
| Northwest Territories | 183 days absence limit | [NT Health](https://www.hss.gov.nt.ca/) |

**Simplified Rules for App:**
| Province/Territory | Max Days Outside | Period Type |
|--------------------|------------------|-------------|
| BC, Quebec, PEI, Nunavut | 183 | Calendar year |
| All others | 212 | Calendar year |

### US Substantial Presence Test

**IRS Official Rule:** A person meets the substantial presence test if physically present in the US for at least:
- 183 days during the 3-year period (current year + 2 prior years), calculated as:
  - 100% of current year days
  - + 1/3 of prior year days
  - + 1/6 of days from 2 years ago
- AND at least 31 days in the current year

Source: [IRS Substantial Presence Test](https://www.irs.gov/individuals/international-taxpayers/substantial-presence-test)

## Core Functionality

## Data Model

### Trip

```typescript
interface Trip {
  id: string;
  year: number;                    // Calendar year
  departureDate: string;           // ISO date (YYYY-MM-DD)
  returnDate: string | null;       // null if one-way or same-day
  isSameDay: boolean;               // true if checkbox "same day trip" checked
  destinations: DestinationLeg[];  // Ordered list of legs
  notes?: string;
}

interface DestinationLeg {
  destination: Destination;
  arrivalDate: string;             // ISO date
  departureDate: string;           // ISO date (or null if final leg)
}

type Destination = 
  | "bc"           // Home province/territory
  | "other_ca"     // Other Canadian province/territory
  | "usa"          // United States
  | "other";       // Outside Canada/US
```

### User Settings

```typescript
interface UserSettings {
  homeProvince: Province;          // User's home province
  theme: "light" | "dark" | "dim" | "system";
  yearOfInterest: number;          // Default year to analyze
}
```

## UI/UX Specification

### Layout Structure

```
┌─────────────────────────────────────────┐
│ Header: Logo + Theme Toggle             │
├─────────────────────────────────────────┤
│ Province Selector                       │
├─────────────────────────────────────────┤
│ Year Tabs / Selector                    │
├─────────────────────────────────────────┤
│ Trip Input Form                         │
│ ┌─────────────────────────────────────┐ │
│ │ Date Inputs + Destination Chain     │ │
│ │ [+ Add Destination] button          │ │
│ │ [x] Same-day trip                   │ │
│ └─────────────────────────────────────┘ │
├─────────────────────────────────────────┤
│ Trip List (Cards)                       │
├─────────────────────────────────────────┤
│ Summary Dashboard                       │
│ ┌──────────────┐ ┌──────────────┐       │
│ │ Province    │ │ US Days      │       │
│ │ Status      │ │ Calculator   │       │
│ └──────────────┘ └──────────────┘       │
├─────────────────────────────────────────┤
│ Footer: Save/Load Buttons               │
└─────────────────────────────────────────┘
```

### Theme System

Three-position toggle switch:

| Position | CSS Variable | Background | Text | Accent |
|----------|--------------|------------|------|--------|
| Light | --bg: #ffffff, --fg: #1a1a1a | #ffffff | #1a1a1a | #2563eb |
| Dim | --bg: #1e1e2e, --fg: #cdd6f4 | #1e1e2e | #cdd6f4 | #89b4fa |
| Dark | --bg: #0d1117, --fg: #e6edf3 | #0d1117 | #e6edf3 | #58a6ff |

Default to `prefers-color-scheme` if user hasn't set preference.

### Color Palette (Provincial)

- BC: #0077b6 (blue)
- Alberta: #ff8c00 (orange)
- Saskatchewan: #2e8b57 (green)
- Manitoba: #dc143c (crimson)
- Ontario: #ce1126 (red)
- Quebec: #ed2939 (red/white)
- New Brunswick: #ff0000 (red)
- Nova Scotia: #ff0000 (red)
- PEI: #ff0000 (red)
- Newfoundland: #ff0000 (red)
- Yukon: #ff0000 (red)
- Northwest Territories: #ff0000 (red)
- Nunavut: #ff0000 (red)

- USA: #3c3b6e (navy)
- Other: #6b7280 (gray)

### Components

#### Theme Toggle
- Three-position slide switch
- Icons: Sun / Moon / CloudMoon
- Smooth 200ms transition between themes

#### Province Selector
- Dropdown with all provinces/territories
- Flag emoji prefix (🇨🇦 + province abbreviation)
- Tooltip showing the days rule on hover

#### Trip Input Form
- Date picker for departure
- Destination dropdown (BC, Other Canada, USA, Other)
- "+ Add Destination" for multi-leg trips
- Same-day checkbox that disables/hides return date
- Return date picker (disabled when same-day checked)

#### Trip Card
- Compact view showing: dates, destination chain
- Edit / Delete buttons
- Visual indicator for BC vs outside

#### Summary Dashboard

**Provincial Status Card:**
```
┌────────────────────────────────┐
│ 🏥 BC Healthcare Eligibility  │
│ ───────────────────────────── │
│ Days in BC: 167 / 183         │
│ ████████████░░░░░░░░░░░░░░░░  │
│                                │
│ Status: ⚠️ 16 days remaining  │
│ Risk: MEDIUM                   │
└────────────────────────────────┘
```

**US Substantial Presence Card:**
```
┌────────────────────────────────┐
│ 🇺🇸 US Substantial Presence   │
│ ───────────────────────────── │
│ 2026: 45 days                 │
│ 2025: 90 days (÷3 = 30)       │
│ 2024: 120 days (÷6 = 20)      │
│ ───────────────────────────── │
│ Total: 95 days                 │
│ Threshold: 183 days            │
│                                │
│ Status: ✅ Below threshold     │
└────────────────────────────────┘
```

#### Source Attribution in UI

Each dashboard card must display a clickable link to the official source:

```
┌─────────────────────────────────────────┐
│ 🏥 BC Healthcare Eligibility       [?] │
│ ───────────────────────────────────── │
│ Days in BC: 167 / 183                  │
│ ████████████░░░░░░░░░░░░░░░░          │
│                                         │
│ Status: ⚠️ 16 days remaining           │
│ Risk: MEDIUM                            │
│                                         │
│ Source: gov.bc.ca/msp                  │
└─────────────────────────────────────────┘
```

**Attribution Requirements:**

1. **Provincial Card**: Show "Source: [abbreviated URL]" at bottom of card
   - Link opens official government page in new tab
   - Tooltip on hover shows full URL

2. **US Card**: Show "Source: irs.gov" at bottom of card  
   - Link to https://www.irs.gov/individuals/international-taxpayers/substantial-presence-test

3. **Footer Disclaimer**: Small text below dashboard:
   ```
   Disclaimer: This tool provides estimates only. Consult official government 
   sources and a tax professional for definitive advice.
   ```

4. **Info Tooltips**: Each card has a (?) icon that shows:
   - Full rule explanation
   - Link to official source
   - Last verified date

#### Year Selector
- Horizontal scrollable tabs or dropdown
- Show +/- 2 years from current
- Highlight current year

### Responsive Breakpoints

| Breakpoint | Width | Layout |
|------------|-------|--------|
| xs | < 640px | Single column, stacked cards |
| sm | 640px+ | Two-column grid for cards |
| md | 768px+ | Side-by-side dashboard cards |
| lg | 1024px+ | Max-width container, comfortable padding |

### Mobile-First Considerations

- Touch-friendly tap targets (min 44px)
- Large date picker inputs
- Sticky header on scroll
- Bottom sheet for trip editing on mobile
- Swipe to delete trips (optional enhancement)

## Data Flow

### Calculations

```typescript
function calculateProvincialStatus(trips: Trip[], province: Province, year: number): ProvincialStatus {
  const threshold = THRESHOLDS[province]; // 183 or 212
  
  let daysInProvince = 0;
  
  for (const trip of trips.filter(t => t.year === year)) {
    for (const leg of trip.destinations) {
      if (leg.destination === province) {
        daysInProvince += daysBetween(leg.arrivalDate, leg.departureDate || today);
      }
    }
  }
  
  return {
    daysPresent: daysInProvince,
    threshold,
    daysRemaining: threshold - daysInProvince,
    status: daysInProvince >= threshold ? "OK" : "AT_RISK"
  };
}

function calculateUSPresence(trips: Trip[], year: number): USPresenceStatus {
  const currentYear = trips.filter(t => t.year === year)
    .flatMap(t => t.destinations.filter(d => d.destination === "usa"))
    .reduce((sum, leg) => sum + daysBetween(leg.arrivalDate, leg.departureDate || today), 0);
    
  const priorYear = trips.filter(t => t.year === year - 1)
    .flatMap(t => t.destinations.filter(d => d.destination === "usa"))
    .reduce((sum, leg) => sum + daysBetween(leg.arrivalDate, leg.departureDate || today), 0);
    
  const twoYearsAgo = trips.filter(t => t.year === year - 2)
    .flatMap(t => t.destinations.filter(d => d.destination === "usa"))
    .reduce((sum, leg) => sum + daysBetween(leg.arrivalDate, leg.departureDate || today), 0);
    
  const total = currentYear + Math.floor(priorYear / 3) + Math.floor(twoYearsAgo / 6);
  
  return {
    currentYear,
    priorYearWeighted: Math.floor(priorYear / 3),
    twoYearsAgoWeighted: Math.floor(twoYearsAgo / 6),
    total,
    threshold: 183,
    passes: total >= 183
  };
}
```

### Persistence

#### LocalStorage (Auto-save)

```typescript
const STORAGE_KEY = "canigo_data";

interface StoredData {
  settings: UserSettings;
  trips: Trip[];
  lastUpdated: string;
}

// Save on every change (debounced 500ms)
function saveToLocalStorage(data: StoredData): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
}

// Load on app init
function loadFromLocalStorage(): StoredData | null {
  const stored = localStorage.getItem(STORAGE_KEY);
  return stored ? JSON.parse(stored) : null;
}
```

#### JSONL File Format

```jsonl
{"version":1,"settings":{"homeProvince":"bc","theme":"system","yearOfInterest":2026}}
{"trip":{"id":"uuid","year":2026,"departureDate":"2026-01-15","returnDate":"2026-03-15","isSameDay":false,"destinations":[{"destination":"usa","arrivalDate":"2026-01-15","departureDate":"2026-02-01"},{"destination":"other","arrivalDate":"2026-02-01","departureDate":"2026-03-15"}]}}
```

Note: First line is settings, subsequent lines are trips. Each trip is a separate JSON object for easy appending.

### File Operations

```typescript
// Save to file (download)
function exportToJSONL(data: StoredData): void {
  const lines = [
    JSON.stringify({ version: 1, settings: data.settings }),
    ...data.trips.map(trip => JSON.stringify({ trip }))
  ];
  const blob = new Blob([lines.join("\n")], { type: "application/jsonl" });
  const url = URL.createObjectURL(blob);
  // Trigger download
}

// Load from file
function importFromJSONL(file: File): Promise<StoredData> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const lines = reader.result.split("\n").filter(l => l.trim());
      const settings = JSON.parse(lines[0]).settings;
      const trips = lines.slice(1).map(l => JSON.parse(l).trip);
      resolve({ settings, trips, lastUpdated: new Date().toISOString() });
    };
    reader.onerror = reject;
    reader.readAsText(file);
  });
}
```

## State Management

Using Svelte 5 runes:

```svelte
<script>
  let settingsSettings>({... = $state<User});
  let trips = $state<Trip[]>([]);
  
  // Derived values
  let provincialStatus = $derived(calculateProvincialStatus(trips, settings.homeProvince, settings.yearOfInterest));
  let usPresence = $derived(calculateUSPresence(trips, settings.yearOfInterest));
</script>
```

## UI Copy

### Header
- Logo: "Can I Go?" with airplane icon
- Tagline: "Track your provincial residency"

### Province Selector
- Label: "Your home province"
- Placeholder: "Select province..."

### Trip Form
- "Add a trip"
- "Departure date"
- "Return date"
- "Same-day trip" (checkbox)
- "Destination"
- "+ Add destination" (for multi-leg)
- "Trip notes (optional)"
- "Save trip" / "Cancel"

### Summary
- "Days remaining"
- "Status: OK" / "Status: At Risk"
- "US days (weighted)"

### Actions
- "Save to browser" (with toast: "Saved!")
- "Save to file"
- "Load from file"

### Toast Messages
- "Auto-saved" (subtle, appears briefly)
- "Saved to browser" (on button click)
- "File loaded successfully"
- "Error loading file"

## Icons (Lucide)

| Purpose | Icon Name |
|---------|-----------|
| Theme toggle sun | Sun |
| Theme toggle moon | Moon |
| Theme toggle dim | CloudMoon |
| Add trip | Plane |
| Add destination | Plus |
| Delete | Trash2 |
| Edit | Pencil |
| Save to browser | Save |
| Save to file | Download |
| Load from file | Upload |
| Calendar | Calendar |
| Home (province) | Home |
| Other Canada | MapPin |
| USA | Globe |
| Other country | Globe2 |
| Warning | AlertTriangle |
| Check OK | CheckCircle |
| Info | Info |

## Validation Rules

1. **Departure date required**
2. **Return date required** (unless same-day checked)
3. **Return must be after or same as departure**
4. **Destination required**
5. **At least one destination in chain**
6. **First destination must be home province** (departing from home)
7. **No overlapping trips** (warn but allow)
8. **Year must be valid** (current year +/- 5)

## Edge Cases

1. **Trip spans new year**: Split into two trip records automatically
2. **Same-day trip**: Count as 1 day in destination, 0 travel days
3. **Multi-leg same date**: Leg arrives and departs on same day = 1 day
4. **No trips**: Show empty state with prompt to add first trip
5. **Zero days in year**: Handle division by zero for US calc
6. **Future dates**: Allow but flag with warning
7. **Partial data from file**: Best-effort parsing, warn on errors

## Acceptance Criteria

### Functional
- [ ] User can select home province from all 13 provinces/territories
- [ ] User can add trips with departure/return dates
- [ ] User can create multi-leg trips (BC → USA → Mexico → BC)
- [ ] Same-day checkbox hides return date field
- [ ] Provincial days calculated correctly (days in home province)
- [ ] US substantial presence calculated with 3-year weighted formula
- [ ] Dashboard shows progress bars and status indicators
- [ ] Data persists in localStorage (auto-save)
- [ ] Export to JSONL file works
- [ ] Import from JSONL file works
- [ ] Year selector changes calculation year

### Source Attribution
- [ ] Provincial card displays clickable link to official government source
- [ ] US card displays clickable link to IRS substantial presence test page
- [ ] Footer disclaimer warns users to consult official sources
- [ ] Tooltips on cards explain the rule with source link

### UI/UX
- [ ] Three themes: light, dim, dark
- [ ] Theme defaults to system preference
- [ ] Theme toggle switches smoothly
- [ ] Mobile-first responsive layout
- [ ] Touch-friendly on mobile
- [ ] Toast notifications appear and auto-dismiss
- [ ] Lucide icons render correctly (no raw SVG paths)
- [ ] Tailwind Typography prose for text content

### Visual Checkpoints
- [ ] Province selector shows flag emoji
- [ ] Progress bar fills proportionally
- [ ] At-risk status shows warning color (amber)
- [ ] OK status shows success color (green)
- [ ] Cards have consistent padding and border-radius
- [ ] Theme colors apply consistently across all components
