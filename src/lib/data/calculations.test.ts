import { describe, it, expect } from 'vitest';
import type { Trip, Province } from '$lib/types';
import {
	daysBetween,
	daysInYear,
	addDays,
	countDaysOutside,
	countUSDays,
	countUSDaysInWindow,
	collectUSIntervals,
	calculateProvincialStatus,
	calculateUSPresence,
	calculateB1B2Presence
} from './calculations';
import { PROVINCES, getThreshold } from './provinces';

// ─── helpers ──────────────────────────────────────────────────────────────

function makeTrip(overrides: Partial<Trip> & Pick<Trip, 'departureDate' | 'returnDate' | 'destinations'>): Trip {
	const year = parseInt(overrides.departureDate.slice(0, 4));
	return {
		id: crypto.randomUUID(),
		year,
		isSameDay: overrides.departureDate === overrides.returnDate,
		notes: undefined,
		...overrides
	};
}

function usaTrip(departure: string, returnDate: string): Trip {
	return makeTrip({
		departureDate: departure,
		returnDate,
		destinations: [{ destination: 'usa', arrivalDate: departure, departureDate: returnDate }]
	});
}

function otherTrip(departure: string, returnDate: string, destination: 'other_ca' | 'other' = 'other_ca'): Trip {
	return makeTrip({
		departureDate: departure,
		returnDate,
		destinations: [{ destination, arrivalDate: departure, departureDate: returnDate }]
	});
}

function multiLegTrip(departure: string, returnDate: string, legs: { dest: 'home' | 'usa' | 'other_ca' | 'other'; from: string; to: string }[]): Trip {
	return makeTrip({
		departureDate: departure,
		returnDate,
		destinations: legs.map(l => ({ destination: l.dest, arrivalDate: l.from, departureDate: l.to }))
	});
}

// ═══════════════════════════════════════════════════════════════════════════
// daysBetween
// ═══════════════════════════════════════════════════════════════════════════

describe('daysBetween', () => {
	it('same day = 1', () => {
		expect(daysBetween('2026-01-15', '2026-01-15')).toBe(1);
	});

	it('two consecutive days = 2', () => {
		expect(daysBetween('2026-01-15', '2026-01-16')).toBe(2);
	});

	it('week-long span = 8 (inclusive)', () => {
		expect(daysBetween('2026-03-01', '2026-03-08')).toBe(8);
	});

	it('returns 0 if end before start', () => {
		expect(daysBetween('2026-03-10', '2026-03-05')).toBe(0);
	});

	it('full non-leap year: Jan 1 to Dec 31 = 365', () => {
		expect(daysBetween('2025-01-01', '2025-12-31')).toBe(365);
	});

	it('full leap year: Jan 1 to Dec 31 = 366', () => {
		expect(daysBetween('2024-01-01', '2024-12-31')).toBe(366);
	});

	it('crosses leap day: Feb 28 to Mar 1 in leap year = 3', () => {
		expect(daysBetween('2024-02-28', '2024-03-01')).toBe(3);
	});

	it('crosses year boundary: Dec 30 to Jan 4 = 6', () => {
		expect(daysBetween('2025-12-30', '2026-01-04')).toBe(6);
	});
});

// ═══════════════════════════════════════════════════════════════════════════
// daysInYear
// ═══════════════════════════════════════════════════════════════════════════

describe('daysInYear', () => {
	it('non-leap year = 365', () => expect(daysInYear(2025)).toBe(365));
	it('leap year = 366', () => expect(daysInYear(2024)).toBe(366));
	it('century non-leap = 365', () => expect(daysInYear(1900)).toBe(365));
	it('400-year leap = 366', () => expect(daysInYear(2000)).toBe(366));
});

// ═══════════════════════════════════════════════════════════════════════════
// addDays
// ═══════════════════════════════════════════════════════════════════════════

describe('addDays', () => {
	it('adds positive days', () => expect(addDays('2026-01-01', 10)).toBe('2026-01-11'));
	it('subtracts with negative', () => expect(addDays('2026-01-11', -10)).toBe('2026-01-01'));
	it('crosses month boundary', () => expect(addDays('2026-01-30', 5)).toBe('2026-02-04'));
	it('crosses year boundary', () => expect(addDays('2025-12-30', 5)).toBe('2026-01-04'));
	it('adding 0 returns same date', () => expect(addDays('2026-06-15', 0)).toBe('2026-06-15'));
});

// ═══════════════════════════════════════════════════════════════════════════
// countDaysOutside — now takes (trips, rangeStart, rangeEnd)
// ═══════════════════════════════════════════════════════════════════════════

describe('countDaysOutside', () => {
	it('counts non-home legs within the range', () => {
		const trips = [
			makeTrip({
				departureDate: '2026-02-01',
				returnDate: '2026-02-10',
				destinations: [
					{ destination: 'usa', arrivalDate: '2026-02-01', departureDate: '2026-02-05' },
					{ destination: 'home', arrivalDate: '2026-02-06', departureDate: '2026-02-10' }
				]
			})
		];
		expect(countDaysOutside(trips, '2026-01-01', '2026-12-31')).toBe(5);
	});

	it('clips legs to the requested range', () => {
		const trips = [usaTrip('2025-12-20', '2026-01-10')];
		// Only the 2026 portion: Jan 1–Jan 10 = 10 days
		expect(countDaysOutside(trips, '2026-01-01', '2026-12-31')).toBe(10);
	});

	it('clips legs to a partial year (through today)', () => {
		const trips = [usaTrip('2026-01-15', '2026-02-15')];
		// Through Jan 31: Jan 15–Jan 31 = 17 days
		expect(countDaysOutside(trips, '2026-01-01', '2026-01-31')).toBe(17);
	});

	it('empty trips = 0', () => {
		expect(countDaysOutside([], '2026-01-01', '2026-12-31')).toBe(0);
	});

	it('same-day trip = 1', () => {
		const trips = [usaTrip('2026-05-15', '2026-05-15')];
		expect(countDaysOutside(trips, '2026-01-01', '2026-12-31')).toBe(1);
	});

	it('trip entirely outside range = 0', () => {
		const trips = [usaTrip('2025-06-01', '2025-06-10')];
		expect(countDaysOutside(trips, '2026-01-01', '2026-12-31')).toBe(0);
	});

	it('handles cross-year trip spanning into target year', () => {
		// Trip departs Nov 2023, returns Apr 2024
		const trips = [usaTrip('2023-11-16', '2024-04-10')];
		// 2024 portion: Jan 1 – Apr 10 = 101 days
		expect(countDaysOutside(trips, '2024-01-01', '2024-12-31')).toBe(101);
		// 2023 portion: Nov 16 – Dec 31 = 46 days
		expect(countDaysOutside(trips, '2023-01-01', '2023-12-31')).toBe(46);
	});

	it('sums multiple trips', () => {
		const trips = [
			usaTrip('2026-01-10', '2026-01-15'),   // 6 days
			otherTrip('2026-03-01', '2026-03-05'),  // 5 days
		];
		expect(countDaysOutside(trips, '2026-01-01', '2026-12-31')).toBe(11);
	});

	it('home legs are not counted', () => {
		const trips = [makeTrip({
			departureDate: '2026-03-01',
			returnDate: '2026-03-10',
			destinations: [{ destination: 'home', arrivalDate: '2026-03-01', departureDate: '2026-03-10' }]
		})];
		expect(countDaysOutside(trips, '2026-01-01', '2026-12-31')).toBe(0);
	});
});

// ═══════════════════════════════════════════════════════════════════════════
// countUSDays — now takes (trips, rangeStart, rangeEnd)
// ═══════════════════════════════════════════════════════════════════════════

describe('countUSDays', () => {
	it('counts only usa legs', () => {
		const trips = [
			usaTrip('2026-03-01', '2026-03-10'),
			otherTrip('2026-04-01', '2026-04-05')
		];
		expect(countUSDays(trips, '2026-01-01', '2026-12-31')).toBe(10);
	});

	it('clips cross-year usa trip to target year', () => {
		const trips = [usaTrip('2025-10-03', '2026-03-03')];
		// 2026 portion: Jan 1 – Mar 3 = 62 days
		expect(countUSDays(trips, '2026-01-01', '2026-12-31')).toBe(62);
		// 2025 portion: Oct 3 – Dec 31 = 90 days
		expect(countUSDays(trips, '2025-01-01', '2025-12-31')).toBe(90);
	});

	it('clips cross-year trip correctly for both years (2023→2024)', () => {
		const trips = [usaTrip('2023-11-16', '2024-04-10')];
		// 2024 portion: Jan 1 – Apr 10 = 101 days
		expect(countUSDays(trips, '2024-01-01', '2024-12-31')).toBe(101);
		// 2023 portion: Nov 16 – Dec 31 = 46 days
		expect(countUSDays(trips, '2023-01-01', '2023-12-31')).toBe(46);
	});

	it('sums multiple usa trips in same year', () => {
		const trips = [
			usaTrip('2026-01-01', '2026-01-10'),
			usaTrip('2026-06-01', '2026-06-10')
		];
		expect(countUSDays(trips, '2026-01-01', '2026-12-31')).toBe(20);
	});

	it('no usa legs = 0', () => {
		const trips = [otherTrip('2026-05-01', '2026-05-10')];
		expect(countUSDays(trips, '2026-01-01', '2026-12-31')).toBe(0);
	});
});

// ═══════════════════════════════════════════════════════════════════════════
// collectUSIntervals
// ═══════════════════════════════════════════════════════════════════════════

describe('collectUSIntervals', () => {
	it('extracts usa legs across trips', () => {
		const trips = [
			usaTrip('2026-01-01', '2026-01-10'),
			otherTrip('2026-02-01', '2026-02-05'),
			usaTrip('2025-06-01', '2025-06-15')
		];
		const intervals = collectUSIntervals(trips);
		expect(intervals).toHaveLength(2);
	});

	it('empty trips = empty intervals', () => {
		expect(collectUSIntervals([])).toEqual([]);
	});
});

// ═══════════════════════════════════════════════════════════════════════════
// countUSDaysInWindow
// ═══════════════════════════════════════════════════════════════════════════

describe('countUSDaysInWindow', () => {
	const intervals = [
		{ start: '2026-01-01', end: '2026-01-10' },
		{ start: '2026-06-01', end: '2026-06-15' }
	];

	it('full overlap', () => {
		expect(countUSDaysInWindow(intervals, '2025-01-01', '2026-12-31')).toBe(10 + 15);
	});

	it('partial overlap', () => {
		expect(countUSDaysInWindow(intervals, '2026-01-05', '2026-01-08')).toBe(4);
	});

	it('no overlap', () => {
		expect(countUSDaysInWindow(intervals, '2026-02-01', '2026-05-01')).toBe(0);
	});
});

// ═══════════════════════════════════════════════════════════════════════════
// calculateProvincialStatus — now uses elapsed days and cross-year clipping
// ═══════════════════════════════════════════════════════════════════════════

describe('calculateProvincialStatus', () => {
	it('past year with no trips: all days present', () => {
		const result = calculateProvincialStatus([], 'bc', 2025, '2026-04-22');
		expect(result.status).toBe('OK');
		expect(result.daysPresent).toBe(365);
		expect(result.daysOutside).toBe(0);
		expect(result.daysElapsed).toBe(365);
	});

	it('current year mid-year: only counts elapsed days', () => {
		// Today is Apr 22 = 112 days into 2026
		const result = calculateProvincialStatus([], 'bc', 2026, '2026-04-22');
		expect(result.daysElapsed).toBe(112);
		expect(result.daysPresent).toBe(112);
		expect(result.daysOutside).toBe(0);
	});

	it('current year with trip: subtracts from elapsed', () => {
		const trips = [usaTrip('2026-01-15', '2026-02-15')]; // 32 days
		const result = calculateProvincialStatus(trips, 'bc', 2026, '2026-04-22');
		expect(result.daysElapsed).toBe(112);
		expect(result.daysOutside).toBe(32);
		expect(result.daysPresent).toBe(80);
	});

	it('cross-year trip: clips to current year', () => {
		// Trip from Oct 2025 to Mar 3 2026 — only Jan 1-Mar 3 counts for 2026
		const trips = [usaTrip('2025-10-03', '2026-03-03')];
		const result = calculateProvincialStatus(trips, 'bc', 2026, '2026-04-22');
		// Jan 1-Mar 3 = 62 days outside
		expect(result.daysOutside).toBe(62);
		expect(result.daysPresent).toBe(112 - 62);
	});

	it('EXCEEDED when impossible to catch up', () => {
		// 300 days outside by mid year — can't reach 183 present
		const trips = [usaTrip('2026-01-01', '2026-10-27')];
		const result = calculateProvincialStatus(trips, 'bc', 2026, '2026-12-31');
		expect(result.status).toBe('EXCEEDED');
	});

	it('AT_RISK when possible but close', () => {
		// Through Apr 22 (112 days), 82 days present, need 101 more, 253 left
		const trips = [usaTrip('2026-01-15', '2026-02-15')]; // 32 outside
		const result = calculateProvincialStatus(trips, 'bc', 2026, '2026-04-22');
		// present=80, need 103 more, 253 days left → achievable but > 30 remaining
		expect(result.status).toBe('AT_RISK');
	});

	it('uses correct threshold for Alberta (212)', () => {
		const result = calculateProvincialStatus([], 'ab', 2025, '2026-04-22');
		expect(result.threshold).toBe(212);
	});

	// ── INVARIANT: daysPresent + daysOutside = daysElapsed ──

	it('INVARIANT: daysPresent + daysOutside = daysElapsed', () => {
		const trips = [usaTrip('2026-02-01', '2026-02-15')];
		const result = calculateProvincialStatus(trips, 'bc', 2026, '2026-04-22');
		expect(result.daysPresent + result.daysOutside).toBe(result.daysElapsed);
	});

	it('INVARIANT: daysPresent + daysOutside = daysElapsed (past year)', () => {
		const trips = [usaTrip('2025-06-01', '2025-06-30')];
		const result = calculateProvincialStatus(trips, 'bc', 2025, '2026-04-22');
		expect(result.daysPresent + result.daysOutside).toBe(365);
	});

	it('INVARIANT: daysPresent + daysOutside = daysElapsed (cross-year trip)', () => {
		const trips = [usaTrip('2025-10-03', '2026-03-03')];
		const result = calculateProvincialStatus(trips, 'bc', 2026, '2026-04-22');
		expect(result.daysPresent + result.daysOutside).toBe(result.daysElapsed);
	});
});

// ═══════════════════════════════════════════════════════════════════════════
// calculateUSPresence — now clips to year boundaries
// ═══════════════════════════════════════════════════════════════════════════

describe('calculateUSPresence', () => {
	it('no trips = zero everywhere', () => {
		const result = calculateUSPresence([], 2026);
		expect(result.total).toBe(0);
		expect(result.passes).toBe(false);
		expect(result.meetsMinimum).toBe(false);
	});

	it('includes year field', () => {
		const result = calculateUSPresence([], 2024);
		expect(result.year).toBe(2024);
	});

	it('cross-year trip: clips to each year correctly', () => {
		// Trip from Nov 16 2023 to Apr 10 2024
		const trips = [usaTrip('2023-11-16', '2024-04-10')];
		const result = calculateUSPresence(trips, 2024);
		// 2024 = current: Jan 1-Apr 10 = 101 days
		expect(result.currentYearDays).toBe(101);
		// 2023 = prior: Nov 16-Dec 31 = 46 days
		expect(result.priorYearDays).toBe(46);
		expect(result.priorYearWeighted).toBe(15); // floor(46/3)
		expect(result.twoYearsAgoDays).toBe(0);
	});

	it('cross-year trip spanning Oct 2025 to Mar 2026', () => {
		const trips = [usaTrip('2025-10-03', '2026-03-03')];
		const result = calculateUSPresence(trips, 2026);
		// 2026 current: Jan 1-Mar 3 = 62 days
		expect(result.currentYearDays).toBe(62);
		// 2025 prior: Oct 3-Dec 31 = 90 days, weighted = floor(90/3) = 30
		expect(result.priorYearDays).toBe(90);
		expect(result.priorYearWeighted).toBe(30);
	});

	it('weights prior years correctly', () => {
		const trips = [
			usaTrip('2026-01-01', '2026-01-31'), // 31 current
			usaTrip('2025-01-01', '2025-03-31'), // 90 prior → 30
			usaTrip('2024-01-01', '2024-06-29')  // 181 two years ago → 30
		];
		const result = calculateUSPresence(trips, 2026);
		expect(result.currentYearDays).toBe(31);
		expect(result.priorYearWeighted).toBe(30);
		expect(result.twoYearsAgoWeighted).toBe(30);
		expect(result.total).toBe(91);
	});

	it('passes when total >= 183 and minimum met', () => {
		const trips = [usaTrip('2026-01-01', '2026-07-02')]; // 183 days
		const result = calculateUSPresence(trips, 2026);
		expect(result.passes).toBe(true);
	});

	it('does not pass if minimum not met', () => {
		const trips = [
			usaTrip('2026-01-01', '2026-01-30'), // 30 days (below 31)
			usaTrip('2025-01-01', '2025-12-31'), // 365 → 121
			usaTrip('2024-01-01', '2024-12-31')  // 366 → 61
		];
		const result = calculateUSPresence(trips, 2026);
		expect(result.meetsMinimum).toBe(false);
		expect(result.passes).toBe(false);
	});

	// ── floor rounding ──

	it('floor rounding: 1 prior year day → 0', () => {
		const trips = [usaTrip('2025-05-01', '2025-05-01')];
		const result = calculateUSPresence(trips, 2026);
		expect(result.priorYearWeighted).toBe(0);
	});

	it('floor rounding: 3 prior year days → 1', () => {
		const trips = [usaTrip('2025-05-01', '2025-05-03')];
		const result = calculateUSPresence(trips, 2026);
		expect(result.priorYearWeighted).toBe(1);
	});

	it('floor rounding: 5 two-years-ago days → 0', () => {
		const trips = [usaTrip('2024-05-01', '2024-05-05')];
		const result = calculateUSPresence(trips, 2026);
		expect(result.twoYearsAgoWeighted).toBe(0);
	});

	it('floor rounding: 6 two-years-ago days → 1', () => {
		const trips = [usaTrip('2024-05-01', '2024-05-06')];
		const result = calculateUSPresence(trips, 2026);
		expect(result.twoYearsAgoWeighted).toBe(1);
	});
});

// ═══════════════════════════════════════════════════════════════════════════
// calculateB1B2Presence — now includes todayDays
// ═══════════════════════════════════════════════════════════════════════════

describe('calculateB1B2Presence', () => {
	it('no trips = zero for both worst and today', () => {
		const result = calculateB1B2Presence([], '2026-03-14');
		expect(result.worstDays).toBe(0);
		expect(result.todayDays).toBe(0);
		expect(result.exceeds).toBe(false);
	});

	it('single trip within window', () => {
		const trips = [usaTrip('2026-02-01', '2026-02-10')];
		const result = calculateB1B2Presence(trips, '2026-03-14');
		expect(result.worstDays).toBe(10);
		expect(result.todayDays).toBe(10);
	});

	it('exceeds at exactly 180', () => {
		const trips = [usaTrip('2026-01-01', '2026-06-29')]; // 180 days
		const result = calculateB1B2Presence(trips, '2026-07-01');
		expect(result.worstDays).toBe(180);
		expect(result.exceeds).toBe(true);
	});

	it('just under threshold', () => {
		const trips = [usaTrip('2026-01-01', '2026-06-28')]; // 179 days
		const result = calculateB1B2Presence(trips, '2026-07-01');
		expect(result.worstDays).toBe(179);
		expect(result.exceeds).toBe(false);
	});

	it('old trips roll off', () => {
		const trips = [usaTrip('2023-01-01', '2023-06-30')];
		const result = calculateB1B2Presence(trips, '2026-03-14');
		expect(result.worstDays).toBe(0);
		expect(result.todayDays).toBe(0);
	});

	it('today window differs from worst window for future trips', () => {
		// Past trip + future trip
		const trips = [
			usaTrip('2026-01-01', '2026-01-10'), // 10 days, in today window
			usaTrip('2026-10-01', '2026-12-31')  // 92 days, future, NOT in today window
		];
		const result = calculateB1B2Presence(trips, '2026-04-22');
		// Today's window: Apr 23 2025 - Apr 22 2026 → captures Jan 1-10 = 10 days
		expect(result.todayDays).toBe(10);
		// Worst window should capture both: some window captures 10+92 = 102
		expect(result.worstDays).toBe(102);
	});

	it('INVARIANT: window is always 365 days', () => {
		const trips = [usaTrip('2026-01-01', '2026-03-31')];
		const result = calculateB1B2Presence(trips, '2026-06-01');
		expect(daysBetween(result.windowStart, result.windowEnd)).toBe(365);
		expect(daysBetween(result.todayWindowStart, result.todayWindowEnd)).toBe(365);
	});

	it('threshold is always 180', () => {
		expect(calculateB1B2Presence([], '2026-01-01').threshold).toBe(180);
	});
});

// ═══════════════════════════════════════════════════════════════════════════
// Province data integrity
// ═══════════════════════════════════════════════════════════════════════════

describe('Province data integrity', () => {
	it('all 13 provinces are present', () => {
		expect(PROVINCES).toHaveLength(13);
	});

	it('no duplicate province codes', () => {
		const codes = PROVINCES.map(p => p.code);
		expect(new Set(codes).size).toBe(codes.length);
	});

	it('183-threshold provinces are correct', () => {
		const expected183: Province[] = ['bc', 'sk', 'mb', 'qc', 'nb', 'ns', 'pe', 'nl', 'nt', 'nu'];
		for (const code of expected183) {
			expect(getThreshold(code)).toBe(183);
		}
	});

	it('212-threshold provinces are correct', () => {
		const expected212: Province[] = ['ab', 'on', 'yt'];
		for (const code of expected212) {
			expect(getThreshold(code)).toBe(212);
		}
	});
});

// ═══════════════════════════════════════════════════════════════════════════
// Real-world scenarios — using actual user data patterns
// ═══════════════════════════════════════════════════════════════════════════

describe('Real-world: cross-year snowbird', () => {
	// Mirrors the user's actual data: long winter trip spanning two years
	const trips = [
		usaTrip('2025-10-03', '2026-03-03'), // 153 total, split across years
		usaTrip('2025-04-23', '2025-05-05'), // 13 days in 2025
		usaTrip('2025-02-11', '2025-03-18'), // 36 days in 2025
	];

	it('2026 US days = only the Jan-Mar portion', () => {
		// Jan 1 to Mar 3 = 62 days
		expect(countUSDays(trips, '2026-01-01', '2026-12-31')).toBe(62);
	});

	it('2025 US days = all 2025 trips + winter trip 2025 portion', () => {
		// Oct 3-Dec 31 = 90 + Apr 23-May 5 = 13 + Feb 11-Mar 18 = 36 = 139
		expect(countUSDays(trips, '2025-01-01', '2025-12-31')).toBe(139);
	});

	it('provincial status as of mid-April 2026', () => {
		const result = calculateProvincialStatus(trips, 'bc', 2026, '2026-04-22');
		// 112 days elapsed, 62 outside (Jan 1-Mar 3), 50 present
		expect(result.daysElapsed).toBe(112);
		expect(result.daysOutside).toBe(62);
		expect(result.daysPresent).toBe(50);
	});

	it('US presence for 2026 includes cross-year trip', () => {
		const result = calculateUSPresence(trips, 2026);
		expect(result.currentYearDays).toBe(62);
		expect(result.priorYearDays).toBe(139);
		expect(result.priorYearWeighted).toBe(46); // floor(139/3)
	});
});

describe('Real-world: multiple years of travel (user data pattern)', () => {
	const trips = [
		usaTrip('2023-11-16', '2024-04-10'), // cross-year
		usaTrip('2024-06-07', '2024-06-26'), // 20 days
		usaTrip('2024-10-23', '2024-11-01'), // 10 days
		usaTrip('2025-02-11', '2025-03-18'), // 36 days
		usaTrip('2025-04-23', '2025-05-05'), // 13 days
		usaTrip('2025-06-16', '2025-06-26'), // 11 days
		usaTrip('2025-08-29', '2025-09-02'), // 5 days
		usaTrip('2025-09-11', '2025-09-15'), // 5 days
		usaTrip('2025-10-03', '2026-03-03'), // cross-year
	];

	it('2024 correctly includes cross-year trip from 2023', () => {
		const result = calculateUSPresence(trips, 2024);
		// 2024 current: Jan 1-Apr 10 (101) + Jun 7-26 (20) + Oct 23-Nov 1 (10) = 131
		expect(result.currentYearDays).toBe(131);
		// 2023 prior: Nov 16-Dec 31 = 46
		expect(result.priorYearDays).toBe(46);
		expect(result.twoYearsAgoDays).toBe(0);
	});

	it('2025 correctly includes cross-year trip tail from 2025', () => {
		const result = calculateUSPresence(trips, 2025);
		// 2025: Feb-Mar(36) + Apr-May(13) + Jun(11) + Aug-Sep(5) + Sep(5) + Oct-Dec(90) = 160
		expect(result.currentYearDays).toBe(160);
	});

	it('2026 correctly shows cross-year trip head', () => {
		const result = calculateUSPresence(trips, 2026);
		// 2026: Jan 1-Mar 3 = 62
		expect(result.currentYearDays).toBe(62);
	});
});

// ═══════════════════════════════════════════════════════════════════════════
// Cross-calculation consistency
// ═══════════════════════════════════════════════════════════════════════════

describe('Cross-calculation consistency', () => {
	const trips = [
		usaTrip('2026-01-01', '2026-01-31'),
		otherTrip('2026-04-01', '2026-04-15'),
		usaTrip('2026-07-01', '2026-07-15'),
	];

	it('US days <= days outside', () => {
		const usDays = countUSDays(trips, '2026-01-01', '2026-12-31');
		const outsideDays = countDaysOutside(trips, '2026-01-01', '2026-12-31');
		expect(usDays).toBeLessThanOrEqual(outsideDays);
	});

	it('collectUSIntervals count matches countUSDays for full year', () => {
		const intervals = collectUSIntervals(trips);
		const totalFromIntervals = intervals.reduce((sum, iv) => sum + daysBetween(iv.start, iv.end), 0);
		expect(totalFromIntervals).toBe(countUSDays(trips, '2026-01-01', '2026-12-31'));
	});
});
