import { describe, it, expect } from 'vitest';
import type { StoredData, UserSettings, Trip } from '$lib/types';
import { migrateData, serializeToJSONL, parseJSONL } from './storage';

const defaultSettings: UserSettings = {
	homeProvince: 'bc',
	theme: 'system',
	yearOfInterest: 2026
};

function makeTripData(departure: string, returnDate?: string, opts?: Partial<Trip>): Trip {
	const ret = returnDate ?? departure;
	return {
		id: `test-${departure}`,
		year: parseInt(departure.slice(0, 4)),
		departureDate: departure,
		returnDate: ret,
		isSameDay: departure === ret,
		destinations: [{ destination: 'usa', arrivalDate: departure, departureDate: ret }],
		...opts
	};
}

// ═══════════════════════════════════════════════════════════════════════════
// migrateData
// ═══════════════════════════════════════════════════════════════════════════

describe('migrateData', () => {
	it('migrates V1 data (no version field)', () => {
		const v1 = {
			settings: defaultSettings,
			trips: [makeTripData('2026-01-01')],
			lastUpdated: '2026-01-01T00:00:00Z'
		};
		const result = migrateData(v1);
		expect(result.version).toBe(2);
		expect(result.plannedTrips).toEqual([]);
		expect(result.trips).toHaveLength(1);
	});

	it('migrates V1 data (version: 1)', () => {
		const v1 = {
			version: 1,
			settings: defaultSettings,
			trips: [],
			lastUpdated: '2026-01-01T00:00:00Z'
		};
		const result = migrateData(v1);
		expect(result.version).toBe(2);
		expect(result.plannedTrips).toEqual([]);
	});

	it('passes through V2 data unchanged', () => {
		const v2: StoredData = {
			version: 2,
			settings: defaultSettings,
			trips: [makeTripData('2026-01-01')],
			plannedTrips: [makeTripData('2026-06-01')],
			lastUpdated: '2026-01-01T00:00:00Z'
		};
		const result = migrateData(v2);
		expect(result).toEqual(v2);
	});

	it('handles missing trips/plannedTrips gracefully', () => {
		const broken = { settings: defaultSettings };
		const result = migrateData(broken);
		expect(result.version).toBe(2);
		expect(result.trips).toEqual([]);
		expect(result.plannedTrips).toEqual([]);
	});

	it('preserves settings through migration', () => {
		const custom: UserSettings = { homeProvince: 'on', theme: 'dark', yearOfInterest: 2025 };
		const result = migrateData({ settings: custom, trips: [] });
		expect(result.settings).toEqual(custom);
	});

	it('preserves trip data through V1 migration', () => {
		const trip = makeTripData('2026-03-15', '2026-03-20', { notes: 'business trip' });
		const result = migrateData({ version: 1, settings: defaultSettings, trips: [trip] });
		expect(result.trips[0].departureDate).toBe('2026-03-15');
		expect(result.trips[0].returnDate).toBe('2026-03-20');
		expect(result.trips[0].notes).toBe('business trip');
	});
});

// ═══════════════════════════════════════════════════════════════════════════
// JSONL serialization / parsing
// ═══════════════════════════════════════════════════════════════════════════

describe('JSONL serialization', () => {
	it('round-trips V2 data', () => {
		const data: StoredData = {
			version: 2,
			settings: defaultSettings,
			trips: [makeTripData('2026-01-01')],
			plannedTrips: [makeTripData('2026-06-01')],
			lastUpdated: '2026-01-01T00:00:00Z'
		};
		const jsonl = serializeToJSONL(data);
		const parsed = parseJSONL(jsonl);
		expect(parsed.version).toBe(2);
		expect(parsed.settings).toEqual(defaultSettings);
		expect(parsed.trips).toHaveLength(1);
		expect(parsed.trips[0].departureDate).toBe('2026-01-01');
		expect(parsed.plannedTrips).toHaveLength(1);
		expect(parsed.plannedTrips[0].departureDate).toBe('2026-06-01');
	});

	it('serializes header with version 2', () => {
		const data: StoredData = {
			version: 2,
			settings: defaultSettings,
			trips: [],
			plannedTrips: [],
			lastUpdated: '2026-01-01T00:00:00Z'
		};
		const jsonl = serializeToJSONL(data);
		const header = JSON.parse(jsonl.split('\n')[0]);
		expect(header.version).toBe(2);
		expect(header.settings).toEqual(defaultSettings);
	});

	it('parses V1 JSONL (no plannedTrip lines)', () => {
		const v1jsonl = [
			JSON.stringify({ version: 1, settings: defaultSettings }),
			JSON.stringify({ trip: makeTripData('2025-03-01') })
		].join('\n');
		const parsed = parseJSONL(v1jsonl);
		expect(parsed.version).toBe(2);
		expect(parsed.trips).toHaveLength(1);
		expect(parsed.plannedTrips).toEqual([]);
	});

	it('throws on empty input', () => {
		expect(() => parseJSONL('')).toThrow('Empty file');
	});

	it('throws on invalid JSON', () => {
		expect(() => parseJSONL('not json')).toThrow();
	});

	// ── notes preservation ──

	it('preserves notes field through round-trip', () => {
		const trip = makeTripData('2026-05-01', '2026-05-10', { notes: 'Conference in SF' });
		const data: StoredData = {
			version: 2,
			settings: defaultSettings,
			trips: [trip],
			plannedTrips: [],
			lastUpdated: '2026-01-01T00:00:00Z'
		};
		const parsed = parseJSONL(serializeToJSONL(data));
		expect(parsed.trips[0].notes).toBe('Conference in SF');
	});

	it('preserves undefined notes as absent', () => {
		const trip = makeTripData('2026-05-01', '2026-05-10');
		const data: StoredData = {
			version: 2,
			settings: defaultSettings,
			trips: [trip],
			plannedTrips: [],
			lastUpdated: '2026-01-01T00:00:00Z'
		};
		const parsed = parseJSONL(serializeToJSONL(data));
		// notes should either be undefined or not present
		expect(parsed.trips[0].notes).toBeUndefined();
	});

	// ── multiple trips and planned trips ──

	it('round-trips multiple trips and planned trips', () => {
		const data: StoredData = {
			version: 2,
			settings: defaultSettings,
			trips: [
				makeTripData('2026-01-01', '2026-01-10'),
				makeTripData('2026-03-01', '2026-03-15'),
				makeTripData('2026-06-01', '2026-06-20')
			],
			plannedTrips: [
				makeTripData('2026-09-01', '2026-09-10'),
				makeTripData('2026-11-15', '2026-11-30')
			],
			lastUpdated: '2026-01-01T00:00:00Z'
		};
		const parsed = parseJSONL(serializeToJSONL(data));
		expect(parsed.trips).toHaveLength(3);
		expect(parsed.plannedTrips).toHaveLength(2);
		expect(parsed.trips[0].departureDate).toBe('2026-01-01');
		expect(parsed.trips[2].departureDate).toBe('2026-06-01');
		expect(parsed.plannedTrips[1].departureDate).toBe('2026-11-15');
	});

	// ── JSONL format structure ──

	it('JSONL has correct number of lines', () => {
		const data: StoredData = {
			version: 2,
			settings: defaultSettings,
			trips: [makeTripData('2026-01-01'), makeTripData('2026-02-01')],
			plannedTrips: [makeTripData('2026-06-01')],
			lastUpdated: '2026-01-01T00:00:00Z'
		};
		const lines = serializeToJSONL(data).split('\n');
		// 1 header + 2 trips + 1 planned trip = 4 lines
		expect(lines).toHaveLength(4);
	});

	it('each JSONL line is valid JSON', () => {
		const data: StoredData = {
			version: 2,
			settings: defaultSettings,
			trips: [makeTripData('2026-01-01')],
			plannedTrips: [makeTripData('2026-06-01')],
			lastUpdated: '2026-01-01T00:00:00Z'
		};
		const lines = serializeToJSONL(data).split('\n');
		for (const line of lines) {
			expect(() => JSON.parse(line)).not.toThrow();
		}
	});

	it('trip lines have "trip" key, planned trip lines have "plannedTrip" key', () => {
		const data: StoredData = {
			version: 2,
			settings: defaultSettings,
			trips: [makeTripData('2026-01-01')],
			plannedTrips: [makeTripData('2026-06-01')],
			lastUpdated: '2026-01-01T00:00:00Z'
		};
		const lines = serializeToJSONL(data).split('\n');
		const tripLine = JSON.parse(lines[1]);
		const plannedLine = JSON.parse(lines[2]);
		expect(tripLine).toHaveProperty('trip');
		expect(tripLine).not.toHaveProperty('plannedTrip');
		expect(plannedLine).toHaveProperty('plannedTrip');
		expect(plannedLine).not.toHaveProperty('trip');
	});

	// ── settings variants ──

	it('round-trips all theme variants', () => {
		const themes = ['light', 'dark', 'dim', 'system'] as const;
		for (const theme of themes) {
			const settings: UserSettings = { homeProvince: 'bc', theme, yearOfInterest: 2026 };
			const data: StoredData = {
				version: 2,
				settings,
				trips: [],
				plannedTrips: [],
				lastUpdated: '2026-01-01T00:00:00Z'
			};
			const parsed = parseJSONL(serializeToJSONL(data));
			expect(parsed.settings.theme).toBe(theme);
		}
	});

	it('round-trips different province settings', () => {
		const provinces = ['bc', 'ab', 'on', 'qc', 'yt'] as const;
		for (const prov of provinces) {
			const settings: UserSettings = { homeProvince: prov, theme: 'system', yearOfInterest: 2026 };
			const data: StoredData = {
				version: 2,
				settings,
				trips: [],
				plannedTrips: [],
				lastUpdated: '2026-01-01T00:00:00Z'
			};
			const parsed = parseJSONL(serializeToJSONL(data));
			expect(parsed.settings.homeProvince).toBe(prov);
		}
	});

	// ── whitespace/blank lines in JSONL ──

	it('handles blank lines in JSONL input gracefully', () => {
		const jsonl = [
			JSON.stringify({ version: 2, settings: defaultSettings }),
			'',
			JSON.stringify({ trip: makeTripData('2026-01-01') }),
			'   ',
			JSON.stringify({ plannedTrip: makeTripData('2026-06-01') }),
			''
		].join('\n');
		const parsed = parseJSONL(jsonl);
		expect(parsed.trips).toHaveLength(1);
		expect(parsed.plannedTrips).toHaveLength(1);
	});

	// ── empty data ──

	it('round-trips data with no trips', () => {
		const data: StoredData = {
			version: 2,
			settings: defaultSettings,
			trips: [],
			plannedTrips: [],
			lastUpdated: '2026-01-01T00:00:00Z'
		};
		const parsed = parseJSONL(serializeToJSONL(data));
		expect(parsed.trips).toEqual([]);
		expect(parsed.plannedTrips).toEqual([]);
	});

	// ── multi-leg trip preservation ──

	it('preserves multi-leg trip destinations through round-trip', () => {
		const trip: Trip = {
			id: 'multi-leg',
			year: 2026,
			departureDate: '2026-04-01',
			returnDate: '2026-04-21',
			isSameDay: false,
			destinations: [
				{ destination: 'usa', arrivalDate: '2026-04-01', departureDate: '2026-04-07' },
				{ destination: 'other', arrivalDate: '2026-04-08', departureDate: '2026-04-14' },
				{ destination: 'home', arrivalDate: '2026-04-15', departureDate: '2026-04-21' }
			],
			notes: 'Multi-country trip'
		};
		const data: StoredData = {
			version: 2,
			settings: defaultSettings,
			trips: [trip],
			plannedTrips: [],
			lastUpdated: '2026-01-01T00:00:00Z'
		};
		const parsed = parseJSONL(serializeToJSONL(data));
		expect(parsed.trips[0].destinations).toHaveLength(3);
		expect(parsed.trips[0].destinations[0].destination).toBe('usa');
		expect(parsed.trips[0].destinations[1].destination).toBe('other');
		expect(parsed.trips[0].destinations[2].destination).toBe('home');
		expect(parsed.trips[0].notes).toBe('Multi-country trip');
	});

	// ── same-day trip preservation ──

	it('preserves same-day trip through round-trip', () => {
		const trip = makeTripData('2026-07-04');
		const data: StoredData = {
			version: 2,
			settings: defaultSettings,
			trips: [trip],
			plannedTrips: [],
			lastUpdated: '2026-01-01T00:00:00Z'
		};
		const parsed = parseJSONL(serializeToJSONL(data));
		expect(parsed.trips[0].isSameDay).toBe(true);
		expect(parsed.trips[0].departureDate).toBe('2026-07-04');
		expect(parsed.trips[0].returnDate).toBe('2026-07-04');
	});

	// ── unknown lines in JSONL are silently ignored ──

	it('ignores unrecognized lines in JSONL', () => {
		const jsonl = [
			JSON.stringify({ version: 2, settings: defaultSettings }),
			JSON.stringify({ trip: makeTripData('2026-01-01') }),
			JSON.stringify({ somethingElse: 'unknown data' }),
			JSON.stringify({ plannedTrip: makeTripData('2026-06-01') })
		].join('\n');
		const parsed = parseJSONL(jsonl);
		expect(parsed.trips).toHaveLength(1);
		expect(parsed.plannedTrips).toHaveLength(1);
	});
});
