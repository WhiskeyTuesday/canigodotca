import type { StoredData, UserSettings, Trip } from '$lib/types';

const STORAGE_KEY = 'canigo_data';

export function migrateData(raw: any): StoredData {
	if (!raw.version || raw.version === 1) {
		return {
			version: 2,
			settings: raw.settings,
			trips: raw.trips ?? [],
			plannedTrips: raw.plannedTrips ?? [],
			lastUpdated: raw.lastUpdated ?? new Date().toISOString()
		};
	}
	return raw as StoredData;
}

export function loadFromLocalStorage(): StoredData | null {
	if (typeof localStorage === 'undefined') return null;
	try {
		const stored = localStorage.getItem(STORAGE_KEY);
		if (!stored) return null;
		return migrateData(JSON.parse(stored));
	} catch {
		return null;
	}
}

export function saveToLocalStorage(data: StoredData): void {
	if (typeof localStorage === 'undefined') return;
	try {
		localStorage.setItem(STORAGE_KEY, JSON.stringify({ ...data, version: 2 }));
	} catch {
		// Storage full or unavailable
	}
}

export function serializeToJSONL(data: StoredData): string {
	const lines = [
		JSON.stringify({ version: 2, settings: data.settings }),
		...data.trips.map((trip) => JSON.stringify({ trip })),
		...data.plannedTrips.map((trip) => JSON.stringify({ plannedTrip: trip }))
	];
	return lines.join('\n');
}

export function exportToJSONL(data: StoredData): void {
	const content = serializeToJSONL(data);
	const blob = new Blob([content], { type: 'application/jsonl' });
	const url = URL.createObjectURL(blob);
	const a = document.createElement('a');
	a.href = url;
	a.download = `canigo-${new Date().toISOString().slice(0, 10)}.jsonl`;
	a.click();
	URL.revokeObjectURL(url);
}

export function parseJSONL(text: string): StoredData {
	const lines = text.split('\n').filter((l) => l.trim());
	if (lines.length === 0) {
		throw new Error('Empty file');
	}
	const first = JSON.parse(lines[0]);
	const settings: UserSettings = first.settings;
	const trips: Trip[] = [];
	const plannedTrips: Trip[] = [];
	for (const line of lines.slice(1)) {
		const parsed = JSON.parse(line);
		if (parsed.plannedTrip) {
			plannedTrips.push(parsed.plannedTrip);
		} else if (parsed.trip) {
			trips.push(parsed.trip);
		}
	}
	return migrateData({
		version: first.version ?? 1,
		settings,
		trips,
		plannedTrips,
		lastUpdated: new Date().toISOString()
	});
}

export function importFromJSONL(file: File): Promise<StoredData> {
	return new Promise((resolve, reject) => {
		const reader = new FileReader();
		reader.onload = () => {
			try {
				resolve(parseJSONL(reader.result as string));
			} catch (e) {
				reject(e instanceof Error ? e : new Error('Invalid file format'));
			}
		};
		reader.onerror = () => reject(new Error('Failed to read file'));
		reader.readAsText(file);
	});
}
