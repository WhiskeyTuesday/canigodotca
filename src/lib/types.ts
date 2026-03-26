export type Province =
	| 'bc'
	| 'ab'
	| 'sk'
	| 'mb'
	| 'on'
	| 'qc'
	| 'nb'
	| 'ns'
	| 'pe'
	| 'nl'
	| 'yt'
	| 'nt'
	| 'nu';

export type Destination = 'home' | 'other_ca' | 'usa' | 'other';

export interface DestinationLeg {
	destination: Destination;
	arrivalDate: string;
	departureDate: string;
}

export interface Trip {
	id: string;
	year: number;
	departureDate: string;
	returnDate: string | null;
	isSameDay: boolean;
	destinations: DestinationLeg[];
	notes?: string;
}

export interface UserSettings {
	homeProvince: Province;
	theme: 'light' | 'dark' | 'dim' | 'system';
	yearOfInterest: number;
}

export interface ProvincialStatus {
	daysPresent: number;
	daysOutside: number;
	threshold: number;
	daysRemaining: number;
	status: 'OK' | 'AT_RISK' | 'EXCEEDED';
}

export interface USPresenceStatus {
	currentYearDays: number;
	priorYearDays: number;
	twoYearsAgoDays: number;
	priorYearWeighted: number;
	twoYearsAgoWeighted: number;
	total: number;
	threshold: number;
	meetsMinimum: boolean;
	passes: boolean;
}

export interface B1B2PresenceStatus {
	worstDays: number;
	windowStart: string;
	windowEnd: string;
	threshold: number;
	exceeds: boolean;
}

export interface StoredData {
	version: number;
	settings: UserSettings;
	trips: Trip[];
	plannedTrips: Trip[];
	lastUpdated: string;
}
