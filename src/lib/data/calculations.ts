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

export function countDaysOutside(trips: Trip[], year: number): number {
	let days = 0;
	for (const trip of trips) {
		if (trip.year !== year) continue;
		for (const leg of trip.destinations) {
			if (leg.destination !== 'home') {
				days += daysBetween(leg.arrivalDate, leg.departureDate);
			}
		}
	}
	return days;
}

export function countUSDays(trips: Trip[], year: number): number {
	let days = 0;
	for (const trip of trips) {
		if (trip.year !== year) continue;
		for (const leg of trip.destinations) {
			if (leg.destination === 'usa') {
				days += daysBetween(leg.arrivalDate, leg.departureDate);
			}
		}
	}
	return days;
}

export function calculateProvincialStatus(
	trips: Trip[],
	province: Province,
	year: number
): ProvincialStatus {
	const threshold = getThreshold(province);
	const totalDays = daysInYear(year);
	const daysOutside = countDaysOutside(trips, year);
	const daysPresent = totalDays - daysOutside;
	const daysRemaining = threshold - daysPresent;

	let status: ProvincialStatus['status'];
	if (daysPresent >= threshold) {
		status = 'OK';
	} else if (daysRemaining <= 30) {
		status = 'AT_RISK';
	} else {
		status = 'EXCEEDED';
	}

	return {
		daysPresent,
		daysOutside,
		threshold,
		daysRemaining: Math.max(0, daysRemaining),
		status
	};
}

export function calculateUSPresence(trips: Trip[], year: number): USPresenceStatus {
	const currentYearDays = countUSDays(trips, year);
	const priorYearDays = countUSDays(trips, year - 1);
	const twoYearsAgoDays = countUSDays(trips, year - 2);

	const priorYearWeighted = Math.floor(priorYearDays / 3);
	const twoYearsAgoWeighted = Math.floor(twoYearsAgoDays / 6);
	const total = currentYearDays + priorYearWeighted + twoYearsAgoWeighted;

	return {
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

export function addDays(dateStr: string, n: number): string {
	const d = new Date(dateStr + 'T00:00:00');
	d.setDate(d.getDate() + n);
	return d.toISOString().slice(0, 10);
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

	if (usIntervals.length === 0) {
		return {
			worstDays: 0,
			windowStart: addDays(effectiveToday, -364),
			windowEnd: effectiveToday,
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
		threshold: 180,
		exceeds: worstDays >= 180
	};
}
