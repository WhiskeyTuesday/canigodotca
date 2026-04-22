import type { Trip, Province, ProvincialStatus, USPresenceStatus, B1B2PresenceStatus } from '$lib/types';
import { getThreshold } from './provinces';

export function daysBetween(start: string, end: string): number {
	const s = new Date(start + 'T00:00:00');
	const e = new Date(end + 'T00:00:00');
	const diff = e.getTime() - s.getTime();
	return Math.max(0, Math.round(diff / (1000 * 60 * 60 * 24)) + 1);
}

export function daysInYear(year: number): number {
	return isLeapYear(year) ? 366 : 365;
}

function isLeapYear(year: number): boolean {
	return (year % 4 === 0 && year % 100 !== 0) || year % 400 === 0;
}

export function addDays(dateStr: string, n: number): string {
	const d = new Date(dateStr + 'T00:00:00');
	d.setDate(d.getDate() + n);
	return d.toISOString().slice(0, 10);
}

/**
 * Count days outside home province within a date range, clipping legs to the range.
 * Iterates ALL trips regardless of trip.year — handles cross-year trips correctly.
 */
export function countDaysOutside(trips: Trip[], rangeStart: string, rangeEnd: string): number {
	let days = 0;
	for (const trip of trips) {
		for (const leg of trip.destinations) {
			if (leg.destination !== 'home') {
				const a = leg.arrivalDate > rangeStart ? leg.arrivalDate : rangeStart;
				const b = leg.departureDate < rangeEnd ? leg.departureDate : rangeEnd;
				if (a <= b) {
					days += daysBetween(a, b);
				}
			}
		}
	}
	return days;
}

/**
 * Count US days within a date range, clipping legs to the range.
 * Iterates ALL trips regardless of trip.year — handles cross-year trips correctly.
 */
export function countUSDays(trips: Trip[], rangeStart: string, rangeEnd: string): number {
	let days = 0;
	for (const trip of trips) {
		for (const leg of trip.destinations) {
			if (leg.destination === 'usa') {
				const a = leg.arrivalDate > rangeStart ? leg.arrivalDate : rangeStart;
				const b = leg.departureDate < rangeEnd ? leg.departureDate : rangeEnd;
				if (a <= b) {
					days += daysBetween(a, b);
				}
			}
		}
	}
	return days;
}

export function calculateProvincialStatus(
	trips: Trip[],
	province: Province,
	year: number,
	today?: string
): ProvincialStatus {
	const effectiveToday = today ?? new Date().toISOString().slice(0, 10);
	const currentYear = parseInt(effectiveToday.slice(0, 4));
	const threshold = getThreshold(province);

	const yearStart = `${year}-01-01`;
	const yearEnd = `${year}-12-31`;

	// For the current year, count through today. For past years, full year.
	const cutoff = year < currentYear ? yearEnd : year > currentYear ? yearStart : effectiveToday;
	const daysElapsed = year > currentYear ? 0 : daysBetween(yearStart, cutoff);
	const daysOutside = countDaysOutside(trips, yearStart, cutoff);
	const daysPresent = daysElapsed - daysOutside;
	const daysRemaining = Math.max(0, threshold - daysPresent);
	const daysLeftInYear = year >= currentYear ? daysBetween(cutoff, yearEnd) - (year === currentYear ? 1 : 0) : 0;

	let status: ProvincialStatus['status'];
	if (daysPresent >= threshold) {
		status = 'OK';
	} else if (daysRemaining > daysLeftInYear) {
		// Can't possibly make it even if home every remaining day
		status = 'EXCEEDED';
	} else if (daysRemaining <= 30) {
		status = 'AT_RISK';
	} else {
		status = 'AT_RISK';
	}

	return {
		daysPresent,
		daysOutside,
		daysElapsed,
		threshold,
		daysRemaining,
		daysLeftInYear,
		status
	};
}

export function calculateUSPresence(trips: Trip[], year: number): USPresenceStatus {
	const currentYearDays = countUSDays(trips, `${year}-01-01`, `${year}-12-31`);
	const priorYearDays = countUSDays(trips, `${year - 1}-01-01`, `${year - 1}-12-31`);
	const twoYearsAgoDays = countUSDays(trips, `${year - 2}-01-01`, `${year - 2}-12-31`);

	const priorYearWeighted = Math.floor(priorYearDays / 3);
	const twoYearsAgoWeighted = Math.floor(twoYearsAgoDays / 6);
	const total = currentYearDays + priorYearWeighted + twoYearsAgoWeighted;

	return {
		year,
		currentYearDays,
		priorYearDays,
		twoYearsAgoDays,
		priorYearWeighted,
		twoYearsAgoWeighted,
		total,
		threshold: 183,
		meetsMinimum: currentYearDays >= 31,
		passes: total >= 183 && currentYearDays >= 31
	};
}

export function countUSDaysInWindow(
	intervals: { start: string; end: string }[],
	windowStart: string,
	windowEnd: string
): number {
	let days = 0;
	for (const iv of intervals) {
		const a = iv.start > windowStart ? iv.start : windowStart;
		const b = iv.end < windowEnd ? iv.end : windowEnd;
		if (a <= b) {
			days += daysBetween(a, b);
		}
	}
	return days;
}

export function collectUSIntervals(trips: Trip[]): { start: string; end: string }[] {
	const intervals: { start: string; end: string }[] = [];
	for (const trip of trips) {
		for (const leg of trip.destinations) {
			if (leg.destination === 'usa') {
				intervals.push({ start: leg.arrivalDate, end: leg.departureDate });
			}
		}
	}
	return intervals;
}

export function calculateB1B2Presence(trips: Trip[], today?: string): B1B2PresenceStatus {
	const effectiveToday = today ?? new Date().toISOString().slice(0, 10);
	const usIntervals = collectUSIntervals(trips);

	const todayWindowEnd = effectiveToday;
	const todayWindowStart = addDays(effectiveToday, -364);
	const todayDays = countUSDaysInWindow(usIntervals, todayWindowStart, todayWindowEnd);

	if (usIntervals.length === 0) {
		return {
			worstDays: 0,
			windowStart: todayWindowStart,
			windowEnd: todayWindowEnd,
			todayDays: 0,
			todayWindowStart,
			todayWindowEnd,
			threshold: 180,
			exceeds: false
		};
	}

	// Only consider windows ending at or after today — past windows are irrelevant
	const candidates = new Set<string>();
	candidates.add(effectiveToday);
	for (const iv of usIntervals) {
		if (iv.end >= effectiveToday) candidates.add(iv.end);
		const shifted = addDays(iv.start, 364);
		if (shifted >= effectiveToday) candidates.add(shifted);
	}

	let worstDays = 0;
	let worstEnd = effectiveToday;

	for (const endDate of candidates) {
		const windowStart = addDays(endDate, -364);
		const days = countUSDaysInWindow(usIntervals, windowStart, endDate);
		if (days > worstDays) {
			worstDays = days;
			worstEnd = endDate;
		}
	}

	return {
		worstDays,
		windowStart: addDays(worstEnd, -364),
		windowEnd: worstEnd,
		todayDays,
		todayWindowStart,
		todayWindowEnd,
		threshold: 180,
		exceeds: worstDays >= 180
	};
}
