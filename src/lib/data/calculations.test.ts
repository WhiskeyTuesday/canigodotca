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

function homeTrip(departure: string, returnDate: string): Trip {
	return makeTrip({
		departureDate: departure,
		returnDate,
		destinations: [{ destination: 'home', arrivalDate: departure, departureDate: returnDate }]
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

	it('crosses leap day: Feb 28 to Mar 1 in non-leap year = 2', () => {
		expect(daysBetween('2025-02-28', '2025-03-01')).toBe(2);
	});

	it('crosses year boundary: Dec 30 to Jan 4 = 6', () => {
		expect(daysBetween('2025-12-30', '2026-01-04')).toBe(6);
	});

	it('multi-year span', () => {
		// 2024 is leap (366) + 2025 (365) = 731 days from Jan 1 2024 to Dec 31 2025
		expect(daysBetween('2024-01-01', '2025-12-31')).toBe(731);
	});
});

// ═══════════════════════════════════════════════════════════════════════════
// daysInYear
// ═══════════════════════════════════════════════════════════════════════════

describe('daysInYear', () => {
	it('non-leap year = 365', () => {
		expect(daysInYear(2025)).toBe(365);
	});

	it('leap year = 366', () => {
		expect(daysInYear(2024)).toBe(366);
	});

	it('century non-leap = 365', () => {
		expect(daysInYear(1900)).toBe(365);
	});

	it('400-year leap = 366', () => {
		expect(daysInYear(2000)).toBe(366);
	});

	it('2026 (non-leap) = 365', () => {
		expect(daysInYear(2026)).toBe(365);
	});

	it('2028 (leap) = 366', () => {
		expect(daysInYear(2028)).toBe(366);
	});
});

// ═══════════════════════════════════════════════════════════════════════════
// addDays
// ═══════════════════════════════════════════════════════════════════════════

describe('addDays', () => {
	it('adds positive days', () => {
		expect(addDays('2026-01-01', 10)).toBe('2026-01-11');
	});

	it('subtracts with negative', () => {
		expect(addDays('2026-01-11', -10)).toBe('2026-01-01');
	});

	it('crosses month boundary', () => {
		expect(addDays('2026-01-30', 5)).toBe('2026-02-04');
	});

	it('crosses year boundary', () => {
		expect(addDays('2025-12-30', 5)).toBe('2026-01-04');
	});

	it('adding 0 returns same date', () => {
		expect(addDays('2026-06-15', 0)).toBe('2026-06-15');
	});

	it('crosses leap day correctly', () => {
		expect(addDays('2024-02-28', 1)).toBe('2024-02-29');
		expect(addDays('2024-02-28', 2)).toBe('2024-03-01');
	});

	it('non-leap year Feb 28 + 1 = Mar 1', () => {
		expect(addDays('2025-02-28', 1)).toBe('2025-03-01');
	});

	it('adding 364 gives window boundary', () => {
		expect(addDays('2025-01-01', 364)).toBe('2025-12-31');
	});
});

// ═══════════════════════════════════════════════════════════════════════════
// countDaysOutside
// ═══════════════════════════════════════════════════════════════════════════

describe('countDaysOutside', () => {
	it('counts non-home legs only', () => {
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
		expect(countDaysOutside(trips, 2026)).toBe(5);
	});

	it('ignores trips from other years', () => {
		const trips = [usaTrip('2025-06-01', '2025-06-10')];
		expect(countDaysOutside(trips, 2026)).toBe(0);
	});

	it('empty trips = 0', () => {
		expect(countDaysOutside([], 2026)).toBe(0);
	});

	it('trip with only home legs = 0 days outside', () => {
		const trips = [homeTrip('2026-03-01', '2026-03-10')];
		expect(countDaysOutside(trips, 2026)).toBe(0);
	});

	it('same-day trip to USA = 1 day outside', () => {
		const trips = [usaTrip('2026-05-15', '2026-05-15')];
		expect(countDaysOutside(trips, 2026)).toBe(1);
	});

	it('sums multiple trips in same year', () => {
		const trips = [
			usaTrip('2026-01-10', '2026-01-15'),   // 6 days
			otherTrip('2026-03-01', '2026-03-05'),  // 5 days
			otherTrip('2026-06-01', '2026-06-03', 'other') // 3 days
		];
		expect(countDaysOutside(trips, 2026)).toBe(6 + 5 + 3);
	});

	it('multi-leg trip: counts each non-home leg separately', () => {
		const trips = [multiLegTrip('2026-04-01', '2026-04-20', [
			{ dest: 'usa', from: '2026-04-01', to: '2026-04-07' },     // 7 days
			{ dest: 'other', from: '2026-04-08', to: '2026-04-14' },   // 7 days
			{ dest: 'home', from: '2026-04-15', to: '2026-04-20' }     // home, not counted
		])];
		expect(countDaysOutside(trips, 2026)).toBe(14);
	});

	it('counts other_ca as outside', () => {
		const trips = [otherTrip('2026-08-01', '2026-08-10', 'other_ca')];
		expect(countDaysOutside(trips, 2026)).toBe(10);
	});
});

// ═══════════════════════════════════════════════════════════════════════════
// countUSDays
// ═══════════════════════════════════════════════════════════════════════════

describe('countUSDays', () => {
	it('counts only usa legs', () => {
		const trips = [
			usaTrip('2026-03-01', '2026-03-10'),
			otherTrip('2026-04-01', '2026-04-05')
		];
		expect(countUSDays(trips, 2026)).toBe(10);
	});

	it('sums multiple usa trips in same year', () => {
		const trips = [
			usaTrip('2026-01-01', '2026-01-10'),
			usaTrip('2026-06-01', '2026-06-10')
		];
		expect(countUSDays(trips, 2026)).toBe(20);
	});

	it('no usa legs = 0', () => {
		const trips = [otherTrip('2026-05-01', '2026-05-10')];
		expect(countUSDays(trips, 2026)).toBe(0);
	});

	it('multi-leg trip: only usa portion counted', () => {
		const trips = [multiLegTrip('2026-04-01', '2026-04-20', [
			{ dest: 'usa', from: '2026-04-01', to: '2026-04-07' },     // 7 days USA
			{ dest: 'other', from: '2026-04-08', to: '2026-04-14' },   // not USA
			{ dest: 'usa', from: '2026-04-15', to: '2026-04-20' }      // 6 days USA
		])];
		expect(countUSDays(trips, 2026)).toBe(7 + 6);
	});

	it('same-day USA trip = 1', () => {
		const trips = [usaTrip('2026-07-04', '2026-07-04')];
		expect(countUSDays(trips, 2026)).toBe(1);
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
		expect(intervals[0]).toEqual({ start: '2026-01-01', end: '2026-01-10' });
		expect(intervals[1]).toEqual({ start: '2025-06-01', end: '2025-06-15' });
	});

	it('empty trips = empty intervals', () => {
		expect(collectUSIntervals([])).toEqual([]);
	});

	it('no usa destinations = empty intervals', () => {
		const trips = [otherTrip('2026-01-01', '2026-01-10')];
		expect(collectUSIntervals(trips)).toEqual([]);
	});

	it('multi-leg trip extracts only usa legs', () => {
		const trips = [multiLegTrip('2026-04-01', '2026-04-20', [
			{ dest: 'usa', from: '2026-04-01', to: '2026-04-07' },
			{ dest: 'other', from: '2026-04-08', to: '2026-04-14' },
			{ dest: 'usa', from: '2026-04-15', to: '2026-04-20' }
		])];
		const intervals = collectUSIntervals(trips);
		expect(intervals).toHaveLength(2);
		expect(intervals[0]).toEqual({ start: '2026-04-01', end: '2026-04-07' });
		expect(intervals[1]).toEqual({ start: '2026-04-15', end: '2026-04-20' });
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

	it('empty intervals = 0', () => {
		expect(countUSDaysInWindow([], '2026-01-01', '2026-12-31')).toBe(0);
	});

	it('window exactly matches one interval', () => {
		expect(countUSDaysInWindow(intervals, '2026-01-01', '2026-01-10')).toBe(10);
	});

	it('window captures start of interval only', () => {
		// Window ends in the middle of the first interval
		expect(countUSDaysInWindow(intervals, '2025-12-01', '2026-01-05')).toBe(5);
	});

	it('window captures end of interval only', () => {
		// Window starts in the middle of the first interval
		expect(countUSDaysInWindow(intervals, '2026-01-08', '2026-01-20')).toBe(3);
	});

	it('single day window hitting an interval', () => {
		expect(countUSDaysInWindow(intervals, '2026-01-05', '2026-01-05')).toBe(1);
	});

	it('single day window missing all intervals', () => {
		expect(countUSDaysInWindow(intervals, '2026-03-15', '2026-03-15')).toBe(0);
	});
});

// ═══════════════════════════════════════════════════════════════════════════
// calculateProvincialStatus
// ═══════════════════════════════════════════════════════════════════════════

describe('calculateProvincialStatus', () => {
	it('OK when no trips (all days at home)', () => {
		const result = calculateProvincialStatus([], 'bc', 2026);
		expect(result.status).toBe('OK');
		expect(result.daysPresent).toBe(365);
		expect(result.daysOutside).toBe(0);
	});

	it('EXCEEDED when far below threshold', () => {
		const result = calculateProvincialStatus(
			[usaTrip('2026-01-01', '2026-10-27')],
			'bc', 2026
		);
		expect(result.status).toBe('EXCEEDED');
		expect(result.daysPresent).toBe(65);
		expect(result.daysOutside).toBe(300);
	});

	it('AT_RISK when within 30 days of threshold', () => {
		const trips = [usaTrip('2026-01-01', '2026-07-09')]; // 190 days outside
		const result = calculateProvincialStatus(trips, 'bc', 2026);
		expect(result.status).toBe('AT_RISK');
	});

	it('uses correct threshold for Alberta (212)', () => {
		const result = calculateProvincialStatus([], 'ab', 2026);
		expect(result.threshold).toBe(212);
	});

	// ── boundary transitions for 183-threshold province ──

	it('BC: exactly 183 days present → OK', () => {
		// 365 - 182 = 183 present → exactly meets threshold
		const trips = [usaTrip('2026-01-01', '2026-07-01')]; // 182 days outside
		const result = calculateProvincialStatus(trips, 'bc', 2026);
		expect(result.daysPresent).toBe(183);
		expect(result.status).toBe('OK');
		expect(result.daysRemaining).toBe(0);
	});

	it('BC: 182 days present → AT_RISK (1 day remaining)', () => {
		// 365 - 183 = 182 present, need 1 more → AT_RISK (≤30)
		const trips = [usaTrip('2026-01-01', '2026-07-02')]; // 183 days outside
		const result = calculateProvincialStatus(trips, 'bc', 2026);
		expect(result.daysPresent).toBe(182);
		expect(result.status).toBe('AT_RISK');
		expect(result.daysRemaining).toBe(1);
	});

	it('BC: 153 days present → AT_RISK (30 remaining, right at boundary)', () => {
		// 365 - 212 = 153 present, daysRemaining = 183 - 153 = 30
		const trips = [usaTrip('2026-01-01', '2026-07-31')]; // 212 days outside
		const result = calculateProvincialStatus(trips, 'bc', 2026);
		expect(result.daysPresent).toBe(153);
		expect(result.daysRemaining).toBe(30);
		expect(result.status).toBe('AT_RISK');
	});

	it('BC: 152 days present → EXCEEDED (31 remaining, just past AT_RISK)', () => {
		// 365 - 213 = 152 present, daysRemaining = 183 - 152 = 31
		const trips = [usaTrip('2026-01-01', '2026-08-01')]; // 213 days outside
		const result = calculateProvincialStatus(trips, 'bc', 2026);
		expect(result.daysPresent).toBe(152);
		expect(result.daysRemaining).toBe(31);
		expect(result.status).toBe('EXCEEDED');
	});

	// ── boundary transitions for 212-threshold province ──

	it('AB: exactly 212 days present → OK', () => {
		// 365 - 153 = 212 present
		const trips = [usaTrip('2026-01-01', '2026-06-02')]; // 153 days outside
		const result = calculateProvincialStatus(trips, 'ab', 2026);
		expect(result.daysPresent).toBe(212);
		expect(result.status).toBe('OK');
		expect(result.daysRemaining).toBe(0);
	});

	it('AB: 211 days present → AT_RISK', () => {
		// 365 - 154 = 211, remaining = 1
		const trips = [usaTrip('2026-01-01', '2026-06-03')]; // 154 days outside
		const result = calculateProvincialStatus(trips, 'ab', 2026);
		expect(result.daysPresent).toBe(211);
		expect(result.status).toBe('AT_RISK');
	});

	it('AB: 182 days present → AT_RISK (30 remaining)', () => {
		// 365 - 183 = 182, remaining = 212 - 182 = 30
		const trips = [usaTrip('2026-01-01', '2026-07-02')]; // 183 days outside
		const result = calculateProvincialStatus(trips, 'ab', 2026);
		expect(result.daysPresent).toBe(182);
		expect(result.daysRemaining).toBe(30);
		expect(result.status).toBe('AT_RISK');
	});

	it('AB: 181 days present → EXCEEDED (31 remaining)', () => {
		// 365 - 184 = 181, remaining = 212 - 181 = 31
		const trips = [usaTrip('2026-01-01', '2026-07-03')]; // 184 days outside
		const result = calculateProvincialStatus(trips, 'ab', 2026);
		expect(result.daysPresent).toBe(181);
		expect(result.daysRemaining).toBe(31);
		expect(result.status).toBe('EXCEEDED');
	});

	// ── invariant: daysPresent + daysOutside = daysInYear ──

	it('INVARIANT: daysPresent + daysOutside = daysInYear (no trips)', () => {
		const result = calculateProvincialStatus([], 'bc', 2026);
		expect(result.daysPresent + result.daysOutside).toBe(daysInYear(2026));
	});

	it('INVARIANT: daysPresent + daysOutside = daysInYear (with trips)', () => {
		const trips = [
			usaTrip('2026-02-01', '2026-02-15'),
			otherTrip('2026-08-01', '2026-08-20')
		];
		const result = calculateProvincialStatus(trips, 'on', 2026);
		expect(result.daysPresent + result.daysOutside).toBe(daysInYear(2026));
	});

	it('INVARIANT: daysPresent + daysOutside = daysInYear (leap year)', () => {
		const trips = [usaTrip('2024-01-01', '2024-03-31')];
		const result = calculateProvincialStatus(trips, 'bc', 2024);
		expect(result.daysPresent + result.daysOutside).toBe(366);
	});

	// ── leap year affects calculation ──

	it('leap year: 366 days total for 2024', () => {
		const result = calculateProvincialStatus([], 'bc', 2024);
		expect(result.daysPresent).toBe(366);
	});

	// ── daysRemaining is clamped to 0 when above threshold ──

	it('daysRemaining is 0 when well above threshold', () => {
		const result = calculateProvincialStatus([], 'bc', 2026);
		expect(result.daysRemaining).toBe(0);
	});
});

// ═══════════════════════════════════════════════════════════════════════════
// calculateUSPresence
// ═══════════════════════════════════════════════════════════════════════════

describe('calculateUSPresence', () => {
	it('no trips = zero everywhere', () => {
		const result = calculateUSPresence([], 2026);
		expect(result.total).toBe(0);
		expect(result.passes).toBe(false);
		expect(result.meetsMinimum).toBe(false);
	});

	it('weights prior years correctly', () => {
		const trips = [
			usaTrip('2026-01-01', '2026-01-31'), // 31 days current
			usaTrip('2025-01-01', '2025-03-31'), // 90 days prior → 30 weighted
			usaTrip('2024-01-01', '2024-06-29')  // 181 days two years ago → 30 weighted
		];
		const result = calculateUSPresence(trips, 2026);
		expect(result.currentYearDays).toBe(31);
		expect(result.priorYearWeighted).toBe(30);
		expect(result.twoYearsAgoWeighted).toBe(30);
		expect(result.total).toBe(91);
		expect(result.passes).toBe(false);
	});

	it('passes when total >= 183 and minimum met', () => {
		const trips = [
			usaTrip('2026-01-01', '2026-07-02'), // 183 days
		];
		const result = calculateUSPresence(trips, 2026);
		expect(result.currentYearDays).toBe(183);
		expect(result.meetsMinimum).toBe(true);
		expect(result.passes).toBe(true);
	});

	it('does not pass if minimum not met even with high total', () => {
		const trips = [
			usaTrip('2026-01-01', '2026-01-30'), // 30 days (below 31 minimum)
			usaTrip('2025-01-01', '2025-12-31'), // 365 → 121 weighted
			usaTrip('2024-01-01', '2024-12-31')  // 366 → 61 weighted
		];
		const result = calculateUSPresence(trips, 2026);
		expect(result.meetsMinimum).toBe(false);
		expect(result.passes).toBe(false);
	});

	// ── boundary: exactly 31 days (minimum threshold) ──

	it('exactly 31 current year days meets minimum', () => {
		const trips = [usaTrip('2026-01-01', '2026-01-31')]; // 31 days
		const result = calculateUSPresence(trips, 2026);
		expect(result.currentYearDays).toBe(31);
		expect(result.meetsMinimum).toBe(true);
	});

	it('30 current year days does NOT meet minimum', () => {
		const trips = [usaTrip('2026-01-01', '2026-01-30')]; // 30 days
		const result = calculateUSPresence(trips, 2026);
		expect(result.currentYearDays).toBe(30);
		expect(result.meetsMinimum).toBe(false);
	});

	// ── boundary: exactly 183 total ──

	it('total exactly 183 with minimum met → passes', () => {
		// 31 current + need 152 from weighted priors
		// 152 = floor(456/3) → 456 prior year days
		const trips = [
			usaTrip('2026-01-01', '2026-01-31'), // 31 days
			usaTrip('2025-01-01', '2025-12-31'), // 365 days → floor(365/3) = 121
			usaTrip('2024-01-01', '2024-06-18')  // 170 days → floor(170/6) = 28
		];
		// total = 31 + 121 + 28 = 180... not quite 183
		// Let me recalculate. We need total = 183.
		// 31 + floor(x/3) + floor(y/6) = 183
		// Need weighted = 152
		// floor(365/3) = 121, floor(366/6) = 61 → 121 + 61 = 182 + 31 = 213
		// That's too high. Let me construct a precise case.
		const trips2 = [
			usaTrip('2026-01-01', '2026-01-31'), // 31 current
			usaTrip('2025-01-01', '2025-07-02'), // 183 prior → floor(183/3) = 61
			usaTrip('2024-01-01', '2024-12-31')  // 366 → floor(366/6) = 61
		];
		// total = 31 + 61 + 61 = 153... still not 183
		// Let me try: need 183 total with 31 current
		// weighted from priors needs to be 152
		// floor(P/3) + floor(T/6) = 152
		// P=365 → 121, need T to give 31: floor(T/6) = 31, T >= 186
		// 121 + 31 = 152. Total = 31 + 152 = 183!
		const tripsExact = [
			usaTrip('2026-01-01', '2026-01-31'), // 31 current
			usaTrip('2025-01-01', '2025-12-31'), // 365 → floor(365/3) = 121
			usaTrip('2024-01-01', '2024-07-04')  // 186 → floor(186/6) = 31
		];
		const result = calculateUSPresence(tripsExact, 2026);
		expect(result.currentYearDays).toBe(31);
		expect(result.priorYearWeighted).toBe(121);
		expect(result.twoYearsAgoWeighted).toBe(31);
		expect(result.total).toBe(183);
		expect(result.passes).toBe(true);
	});

	it('total exactly 182 → does not pass', () => {
		// 31 current + floor(365/3)=121 + floor(180/6)=30 = 182
		const trips = [
			usaTrip('2026-01-01', '2026-01-31'), // 31
			usaTrip('2025-01-01', '2025-12-31'), // 365 → 121
			usaTrip('2024-01-01', '2024-06-28')  // 180 → floor(180/6) = 30
		];
		const result = calculateUSPresence(trips, 2026);
		expect(result.total).toBe(182);
		expect(result.passes).toBe(false);
	});

	// ── floor rounding for weighted years ──

	it('floor rounding: 1 prior year day → 0 weighted', () => {
		const trips = [usaTrip('2025-05-01', '2025-05-01')]; // 1 day
		const result = calculateUSPresence(trips, 2026);
		expect(result.priorYearDays).toBe(1);
		expect(result.priorYearWeighted).toBe(0);
	});

	it('floor rounding: 2 prior year days → 0 weighted', () => {
		const trips = [usaTrip('2025-05-01', '2025-05-02')]; // 2 days
		const result = calculateUSPresence(trips, 2026);
		expect(result.priorYearDays).toBe(2);
		expect(result.priorYearWeighted).toBe(0);
	});

	it('floor rounding: 3 prior year days → 1 weighted', () => {
		const trips = [usaTrip('2025-05-01', '2025-05-03')]; // 3 days
		const result = calculateUSPresence(trips, 2026);
		expect(result.priorYearDays).toBe(3);
		expect(result.priorYearWeighted).toBe(1);
	});

	it('floor rounding: 5 two-years-ago days → 0 weighted', () => {
		const trips = [usaTrip('2024-05-01', '2024-05-05')]; // 5 days
		const result = calculateUSPresence(trips, 2026);
		expect(result.twoYearsAgoDays).toBe(5);
		expect(result.twoYearsAgoWeighted).toBe(0);
	});

	it('floor rounding: 6 two-years-ago days → 1 weighted', () => {
		const trips = [usaTrip('2024-05-01', '2024-05-06')]; // 6 days
		const result = calculateUSPresence(trips, 2026);
		expect(result.twoYearsAgoDays).toBe(6);
		expect(result.twoYearsAgoWeighted).toBe(1);
	});

	it('floor rounding: 7 two-years-ago days → 1 weighted', () => {
		const trips = [usaTrip('2024-05-01', '2024-05-07')]; // 7 days
		const result = calculateUSPresence(trips, 2026);
		expect(result.twoYearsAgoDays).toBe(7);
		expect(result.twoYearsAgoWeighted).toBe(1);
	});

	// ── invariant: weighted ≤ raw ──

	it('INVARIANT: priorYearWeighted <= priorYearDays', () => {
		const trips = [usaTrip('2025-01-01', '2025-06-30')]; // 181 days
		const result = calculateUSPresence(trips, 2026);
		expect(result.priorYearWeighted).toBeLessThanOrEqual(result.priorYearDays);
	});

	it('INVARIANT: twoYearsAgoWeighted <= twoYearsAgoDays', () => {
		const trips = [usaTrip('2024-01-01', '2024-12-31')]; // 366 days
		const result = calculateUSPresence(trips, 2026);
		expect(result.twoYearsAgoWeighted).toBeLessThanOrEqual(result.twoYearsAgoDays);
	});

	// ── only current year counts toward minimum ──

	it('heavy prior years dont count toward 31-day minimum', () => {
		const trips = [
			usaTrip('2025-01-01', '2025-12-31'), // 365 prior → 121
			usaTrip('2024-01-01', '2024-12-31')  // 366 two years ago → 61
		];
		// weighted total = 0 + 121 + 61 = 182, no current year
		const result = calculateUSPresence(trips, 2026);
		expect(result.currentYearDays).toBe(0);
		expect(result.total).toBe(182);
		expect(result.meetsMinimum).toBe(false);
		expect(result.passes).toBe(false);
	});

	// ── threshold field always 183 ──

	it('threshold is always 183', () => {
		expect(calculateUSPresence([], 2026).threshold).toBe(183);
		expect(calculateUSPresence([usaTrip('2026-01-01', '2026-12-31')], 2026).threshold).toBe(183);
	});
});

// ═══════════════════════════════════════════════════════════════════════════
// calculateB1B2Presence
// ═══════════════════════════════════════════════════════════════════════════

describe('calculateB1B2Presence', () => {
	it('no trips = zero', () => {
		const result = calculateB1B2Presence([], '2026-03-14');
		expect(result.worstDays).toBe(0);
		expect(result.exceeds).toBe(false);
	});

	it('single trip within window', () => {
		const trips = [usaTrip('2026-02-01', '2026-02-10')]; // 10 days
		const result = calculateB1B2Presence(trips, '2026-03-14');
		expect(result.worstDays).toBe(10);
		expect(result.exceeds).toBe(false);
	});

	it('finds worst-case window across multiple trips', () => {
		const trips = [
			usaTrip('2025-06-01', '2025-06-30'), // 30 days
			usaTrip('2025-10-01', '2025-12-31'), // 92 days
			usaTrip('2026-02-01', '2026-05-31')  // 120 days
		];
		const result = calculateB1B2Presence(trips, '2026-06-01');
		expect(result.worstDays).toBe(241);
		expect(result.exceeds).toBe(true);
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

	it('old trips roll off — not counted in current/future windows', () => {
		const trips = [usaTrip('2023-01-01', '2023-06-30')]; // 181 days in 2023
		const result = calculateB1B2Presence(trips, '2026-03-14');
		expect(result.worstDays).toBe(0);
	});

	it('is deterministic (does not depend on real clock)', () => {
		const trips = [usaTrip('2026-01-01', '2026-01-15')];
		const r1 = calculateB1B2Presence(trips, '2026-06-01');
		const r2 = calculateB1B2Presence(trips, '2026-06-01');
		expect(r1).toEqual(r2);
	});

	// ── INVARIANT: window is always exactly 365 days ──

	it('INVARIANT: windowEnd - windowStart = 364 days (365 inclusive)', () => {
		const trips = [usaTrip('2026-01-01', '2026-03-31')];
		const result = calculateB1B2Presence(trips, '2026-06-01');
		expect(daysBetween(result.windowStart, result.windowEnd)).toBe(365);
	});

	it('INVARIANT: window is 365 days even with no trips', () => {
		const result = calculateB1B2Presence([], '2026-06-15');
		expect(daysBetween(result.windowStart, result.windowEnd)).toBe(365);
	});

	// ── threshold is always 180 ──

	it('threshold is always 180', () => {
		expect(calculateB1B2Presence([], '2026-01-01').threshold).toBe(180);
	});

	// ── future trips are counted ──

	it('future US trip is counted in worst window', () => {
		const trips = [usaTrip('2026-10-01', '2026-12-31')]; // 92 future days
		const result = calculateB1B2Presence(trips, '2026-06-01');
		expect(result.worstDays).toBe(92);
		expect(result.exceeds).toBe(false);
	});

	it('future trip exactly at 180 threshold', () => {
		// Trip from Oct 1 to Mar 29 next year = 180 days
		const trips = [usaTrip('2026-10-01', '2027-03-29')]; // 180 days
		const result = calculateB1B2Presence(trips, '2026-06-01');
		expect(result.worstDays).toBe(180);
		expect(result.exceeds).toBe(true);
	});

	// ── same-day trip ──

	it('same-day trip counts as 1 day', () => {
		const trips = [usaTrip('2026-05-15', '2026-05-15')];
		const result = calculateB1B2Presence(trips, '2026-06-01');
		expect(result.worstDays).toBe(1);
	});

	// ── trip happening on "today" ──

	it('trip ending today is captured', () => {
		const trips = [usaTrip('2026-06-01', '2026-06-10')];
		const result = calculateB1B2Presence(trips, '2026-06-10');
		expect(result.worstDays).toBe(10);
	});

	it('trip starting today is captured', () => {
		const trips = [usaTrip('2026-06-10', '2026-06-20')];
		const result = calculateB1B2Presence(trips, '2026-06-10');
		expect(result.worstDays).toBe(11);
	});
});

// ═══════════════════════════════════════════════════════════════════════════
// Province data integrity
// ═══════════════════════════════════════════════════════════════════════════

describe('Province data integrity', () => {
	const allCodes: Province[] = ['bc', 'ab', 'sk', 'mb', 'on', 'qc', 'nb', 'ns', 'pe', 'nl', 'yt', 'nt', 'nu'];

	it('all 13 provinces are present', () => {
		expect(PROVINCES).toHaveLength(13);
	});

	it('no duplicate province codes', () => {
		const codes = PROVINCES.map(p => p.code);
		expect(new Set(codes).size).toBe(codes.length);
	});

	it('every province has all required fields', () => {
		for (const p of PROVINCES) {
			expect(p.code).toBeTruthy();
			expect(p.label).toBeTruthy();
			expect(p.threshold).toBeGreaterThan(0);
			expect(p.color).toMatch(/^#[0-9a-fA-F]{6}$/);
			expect(p.sourceUrl).toMatch(/^https?:\/\//);
			expect(p.sourceLabel).toBeTruthy();
		}
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

	it('every Province type code maps to a valid province', () => {
		for (const code of allCodes) {
			const found = PROVINCES.find(p => p.code === code);
			expect(found).toBeDefined();
		}
	});

	it('calculateProvincialStatus works for every province with no trips', () => {
		for (const p of PROVINCES) {
			const result = calculateProvincialStatus([], p.code, 2026);
			expect(result.status).toBe('OK');
			expect(result.threshold).toBe(p.threshold);
			expect(result.daysPresent).toBe(365);
		}
	});
});

// ═══════════════════════════════════════════════════════════════════════════
// Real-world scenarios
// ═══════════════════════════════════════════════════════════════════════════

describe('Real-world scenarios', () => {
	describe('Snowbird: BC resident winters in Arizona (Nov–Mar)', () => {
		const trips = [
			// Left Nov 1, returned March 31 — split across two years
			usaTrip('2025-11-01', '2025-12-31'), // 62 days in 2025
			usaTrip('2026-01-01', '2026-03-31')   // 90 days in 2026
		];

		it('provincial: 275 days present in 2026 → OK for BC', () => {
			const result = calculateProvincialStatus(trips, 'bc', 2026);
			expect(result.daysOutside).toBe(90);
			expect(result.daysPresent).toBe(275);
			expect(result.status).toBe('OK');
		});

		it('US presence: 90 current + 20 weighted prior', () => {
			const result = calculateUSPresence(trips, 2026);
			expect(result.currentYearDays).toBe(90);
			expect(result.priorYearDays).toBe(61); // Nov 1 to Dec 31 inclusive = 61
			expect(result.priorYearWeighted).toBe(20); // floor(61/3)
			expect(result.total).toBe(110);
			expect(result.passes).toBe(false);
		});

		it('B1B2: winter trip captured in rolling window', () => {
			const result = calculateB1B2Presence(trips, '2026-04-15');
			// Worst window should capture both: 61 + 90 = 151
			expect(result.worstDays).toBe(151);
			expect(result.exceeds).toBe(false);
		});
	});

	describe('Frequent business traveler: many short US trips', () => {
		const trips = [
			usaTrip('2026-01-15', '2026-01-18'), // 4 days
			usaTrip('2026-02-10', '2026-02-14'), // 5 days
			usaTrip('2026-03-05', '2026-03-08'), // 4 days
			usaTrip('2026-04-20', '2026-04-24'), // 5 days
			usaTrip('2026-05-12', '2026-05-16'), // 5 days
			usaTrip('2026-06-01', '2026-06-04'), // 4 days
		];

		it('total US days = 27', () => {
			expect(countUSDays(trips, 2026)).toBe(27);
		});

		it('provincial: 338 days present → well OK for any province', () => {
			const result = calculateProvincialStatus(trips, 'bc', 2026);
			expect(result.daysPresent).toBe(338);
			expect(result.status).toBe('OK');
		});

		it('US presence: below minimum with 27 days', () => {
			const result = calculateUSPresence(trips, 2026);
			expect(result.currentYearDays).toBe(27);
			expect(result.meetsMinimum).toBe(false);
			expect(result.passes).toBe(false);
		});

		it('B1B2: 27 days well under 180', () => {
			const result = calculateB1B2Presence(trips, '2026-07-01');
			expect(result.worstDays).toBe(27);
			expect(result.exceeds).toBe(false);
		});
	});

	describe('Multi-country trip: BC → USA → Mexico → BC', () => {
		const trips = [multiLegTrip('2026-03-01', '2026-03-21', [
			{ dest: 'usa', from: '2026-03-01', to: '2026-03-07' },    // 7 days USA
			{ dest: 'other', from: '2026-03-08', to: '2026-03-14' },  // 7 days Mexico
			{ dest: 'usa', from: '2026-03-15', to: '2026-03-18' },    // 4 days USA (stopover)
			{ dest: 'home', from: '2026-03-19', to: '2026-03-21' }    // 3 days home
		])];

		it('provincial: 18 days outside (usa + mexico legs)', () => {
			expect(countDaysOutside(trips, 2026)).toBe(7 + 7 + 4);
		});

		it('US days: only usa legs counted (11 days)', () => {
			expect(countUSDays(trips, 2026)).toBe(7 + 4);
		});

		it('collectUSIntervals gets both USA legs', () => {
			const intervals = collectUSIntervals(trips);
			expect(intervals).toHaveLength(2);
			expect(intervals[0]).toEqual({ start: '2026-03-01', end: '2026-03-07' });
			expect(intervals[1]).toEqual({ start: '2026-03-15', end: '2026-03-18' });
		});
	});

	describe('Heavy US presence over 3 years (tax risk)', () => {
		const trips = [
			usaTrip('2024-01-01', '2024-06-30'), // 182 days in 2024
			usaTrip('2025-01-01', '2025-06-30'), // 181 days in 2025
			usaTrip('2026-01-01', '2026-02-28'), // 59 days in 2026
		];

		it('US presence correctly weights all three years', () => {
			const result = calculateUSPresence(trips, 2026);
			expect(result.currentYearDays).toBe(59);
			expect(result.priorYearDays).toBe(181);
			expect(result.priorYearWeighted).toBe(60); // floor(181/3)
			expect(result.twoYearsAgoDays).toBe(182);
			expect(result.twoYearsAgoWeighted).toBe(30); // floor(182/6)
			expect(result.total).toBe(59 + 60 + 30); // 149
			expect(result.meetsMinimum).toBe(true); // 59 >= 31
			expect(result.passes).toBe(false); // 149 < 183
		});
	});

	describe('Ontario resident barely keeping healthcare', () => {
		// Ontario threshold is 212 days present
		// 365 - 212 = 153 max days outside
		const trips = [
			usaTrip('2026-01-10', '2026-03-15'), // 65 days
			otherTrip('2026-07-01', '2026-09-25', 'other'), // 87 days
		];
		// Total outside = 65 + 87 = 152 → present = 213 → just OK

		it('152 days outside → 213 present → OK', () => {
			const result = calculateProvincialStatus(trips, 'on', 2026);
			expect(result.daysOutside).toBe(152);
			expect(result.daysPresent).toBe(213);
			expect(result.status).toBe('OK');
		});

		it('one more day outside would make it AT_RISK', () => {
			const tripsPlus = [
				usaTrip('2026-01-10', '2026-03-16'), // 66 days (1 more)
				otherTrip('2026-07-01', '2026-09-25', 'other'), // 87 days
			];
			const result = calculateProvincialStatus(tripsPlus, 'on', 2026);
			expect(result.daysOutside).toBe(153);
			expect(result.daysPresent).toBe(212);
			// 212 >= 212 → still OK (exactly at threshold)
			expect(result.status).toBe('OK');

			// Two more days:
			const tripsPlus2 = [
				usaTrip('2026-01-10', '2026-03-17'), // 67 days
				otherTrip('2026-07-01', '2026-09-25', 'other'), // 87 days
			];
			const result2 = calculateProvincialStatus(tripsPlus2, 'on', 2026);
			expect(result2.daysOutside).toBe(154);
			expect(result2.daysPresent).toBe(211);
			expect(result2.status).toBe('AT_RISK');
		});
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

	it('US days ≤ days outside (usa is a subset of non-home)', () => {
		const usDays = countUSDays(trips, 2026);
		const outsideDays = countDaysOutside(trips, 2026);
		expect(usDays).toBeLessThanOrEqual(outsideDays);
	});

	it('days outside = sum of all non-home leg durations', () => {
		// 31 (usa) + 15 (other_ca) + 15 (usa) = 61
		expect(countDaysOutside(trips, 2026)).toBe(31 + 15 + 15);
	});

	it('US days = sum of only usa leg durations', () => {
		// 31 + 15 = 46
		expect(countUSDays(trips, 2026)).toBe(31 + 15);
	});

	it('collectUSIntervals count matches countUSDays', () => {
		const intervals = collectUSIntervals(trips);
		const totalFromIntervals = intervals.reduce((sum, iv) => sum + daysBetween(iv.start, iv.end), 0);
		expect(totalFromIntervals).toBe(countUSDays(trips, 2026));
	});
});
