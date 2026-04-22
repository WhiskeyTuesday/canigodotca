<script lang="ts">
	import { Pencil, Trash2, Plane, MapPin, Globe } from '@lucide/svelte';
	import { deleteTrip, deletePlannedTrip } from '$lib/stores.svelte';
	import type { Trip, Destination } from '$lib/types';

	interface Props {
		trip: Trip;
		planned?: boolean;
		onedit: (trip: Trip) => void;
	}

	let { trip, planned = false, onedit }: Props = $props();

	const destLabels: Record<Destination, string> = {
		home: 'Home',
		other_ca: 'Canada',
		usa: 'USA',
		other: 'Other'
	};

	const destColors: Record<Destination, string> = {
		home: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200',
		other_ca: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200',
		usa: 'bg-indigo-100 text-indigo-800 dark:bg-indigo-900 dark:text-indigo-200',
		other: 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200'
	};

	function formatDate(d: string, includeYear = false): string {
		const opts: Intl.DateTimeFormatOptions = { month: 'short', day: 'numeric' };
		if (includeYear) opts.year = 'numeric';
		return new Date(d + 'T00:00:00').toLocaleDateString('en-CA', opts);
	}

	const crossesYear = $derived(
		trip.returnDate != null && trip.returnDate.slice(0, 4) !== trip.departureDate.slice(0, 4)
	);
</script>

<div class="rounded-xl border p-3 {planned ? 'border-dashed border-accent/50 bg-accent/5' : 'border-card bg-card'}">
	<div class="flex items-start justify-between">
		<div class="flex-1">
			<div class="mb-1 flex items-center gap-2 text-sm font-medium">
				<Plane size={14} class="text-theme-muted" />
				<span>
					{formatDate(trip.departureDate)}
					{#if trip.returnDate && trip.returnDate !== trip.departureDate}
						→ {formatDate(trip.returnDate, crossesYear)}
					{/if}
					{#if trip.isSameDay}
						<span class="text-xs text-theme-muted">(same day)</span>
					{/if}
				</span>
			</div>
			<div class="flex flex-wrap gap-1">
				{#each trip.destinations as leg}
					<span class="inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium {destColors[leg.destination]}">
						{destLabels[leg.destination]}
					</span>
				{/each}
			</div>
			{#if trip.notes}
				<p class="mt-1 text-xs text-theme-muted">{trip.notes}</p>
			{/if}
		</div>
		<div class="flex gap-1">
			<button
				onclick={() => onedit(trip)}
				class="rounded-lg p-1.5 text-theme-muted transition-colors hover:bg-theme-secondary hover:text-theme"
				aria-label="Edit trip"
			>
				<Pencil size={14} />
			</button>
			<button
				onclick={() => planned ? deletePlannedTrip(trip.id) : deleteTrip(trip.id)}
				class="rounded-lg p-1.5 text-theme-muted transition-colors hover:bg-theme-secondary hover:text-danger"
				aria-label="Delete trip"
			>
				<Trash2 size={14} />
			</button>
		</div>
	</div>
</div>
