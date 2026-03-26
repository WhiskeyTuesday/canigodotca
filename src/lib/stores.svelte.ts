import type { UserSettings, Trip, StoredData, ProvincialStatus, USPresenceStatus, B1B2PresenceStatus } from '$lib/types';
import { calculateProvincialStatus, calculateUSPresence, calculateB1B2Presence } from '$lib/data/calculations';
import { loadFromLocalStorage, saveToLocalStorage } from '$lib/data/storage';

const currentYear = new Date().getFullYear();

const defaultSettings: UserSettings = {
	homeProvince: 'bc',
	theme: 'system',
	yearOfInterest: currentYear
};

let settings = $state<UserSettings>({ ...defaultSettings });
let trips = $state<Trip[]>([]);
let plannedTrips = $state<Trip[]>([]);
let toastMessage = $state<string>('');
let toastVisible = $state(false);
let saveTimeout: ReturnType<typeof setTimeout> | undefined;

export function getSettings() {
	return settings;
}

export function setSettings(s: Partial<UserSettings>) {
	Object.assign(settings, s);
	debouncedSave();
}

export function getTrips() {
	return trips;
}

export function addTrip(trip: Trip) {
	trips.push(trip);
	debouncedSave();
}

export function updateTrip(id: string, updated: Trip) {
	const idx = trips.findIndex((t) => t.id === id);
	if (idx !== -1) {
		trips[idx] = updated;
		debouncedSave();
	}
}

export function deleteTrip(id: string) {
	const idx = trips.findIndex((t) => t.id === id);
	if (idx !== -1) {
		trips.splice(idx, 1);
		debouncedSave();
	}
}

// Planned trips
export function getPlannedTrips() {
	return plannedTrips;
}

export function addPlannedTrip(trip: Trip) {
	plannedTrips.push(trip);
	debouncedSave();
}

export function updatePlannedTrip(id: string, updated: Trip) {
	const idx = plannedTrips.findIndex((t) => t.id === id);
	if (idx !== -1) {
		plannedTrips[idx] = updated;
		debouncedSave();
	}
}

export function deletePlannedTrip(id: string) {
	const idx = plannedTrips.findIndex((t) => t.id === id);
	if (idx !== -1) {
		plannedTrips.splice(idx, 1);
		debouncedSave();
	}
}

export function getProvincialStatus(): ProvincialStatus {
	return calculateProvincialStatus(trips, settings.homeProvince, settings.yearOfInterest);
}

export function getUSPresence(): USPresenceStatus {
	return calculateUSPresence(trips, settings.yearOfInterest);
}

export function getProjectedProvincialStatus(): ProvincialStatus {
	return calculateProvincialStatus(
		trips.concat(plannedTrips),
		settings.homeProvince,
		settings.yearOfInterest
	);
}

export function getProjectedUSPresence(): USPresenceStatus {
	return calculateUSPresence(trips.concat(plannedTrips), settings.yearOfInterest);
}

export function getB1B2Presence(): B1B2PresenceStatus {
	return calculateB1B2Presence(trips);
}

export function getProjectedB1B2Presence(): B1B2PresenceStatus {
	return calculateB1B2Presence(trips.concat(plannedTrips));
}

export function getToast() {
	return { message: toastMessage, visible: toastVisible };
}

export function showToast(message: string, duration = 2000) {
	toastMessage = message;
	toastVisible = true;
	setTimeout(() => {
		toastVisible = false;
	}, duration);
}

function debouncedSave() {
	if (saveTimeout) clearTimeout(saveTimeout);
	saveTimeout = setTimeout(() => {
		saveToLocalStorage({
			version: 2,
			settings,
			trips,
			plannedTrips,
			lastUpdated: new Date().toISOString()
		});
	}, 500);
}

export function initFromStorage() {
	const data = loadFromLocalStorage();
	if (data) {
		Object.assign(settings, data.settings);
		trips.length = 0;
		trips.push(...data.trips);
		plannedTrips.length = 0;
		plannedTrips.push(...data.plannedTrips);
	}
}

export function loadData(data: StoredData) {
	Object.assign(settings, data.settings);
	trips.length = 0;
	trips.push(...data.trips);
	plannedTrips.length = 0;
	plannedTrips.push(...data.plannedTrips);
	debouncedSave();
}

export function generateId(): string {
	return crypto.randomUUID();
}
