<script lang="ts">
	import { Plane } from '@lucide/svelte';
	import type { Trip } from '$lib/types';
	import TripCard from './TripCard.svelte';

	interface Props {
		trips: Trip[];
		planned?: boolean;
		onedit: (trip: Trip) => void;
	}

	let { trips, planned = false, onedit }: Props = $props();

	const sorted = $derived(
		[...trips].sort((a, b) => b.departureDate.localeCompare(a.departureDate))
	);

	const groupedByYear = $derived(() => {
		const groups: { year: number; trips: Trip[] }[] = [];
		for (const trip of sorted) {
			const last = groups[groups.length - 1];
			if (last && last.year === trip.year) {
				last.trips.push(trip);
			} else {
				groups.push({ year: trip.year, trips: [trip] });
			}
		}
		return groups;
	});
</script>

<div class="px-4 py-3">
	<div class="mx-auto max-w-3xl">
		{#if sorted.length === 0}
			<div class="rounded-xl border border-dashed border-theme py-8 text-center">
				<Plane size={32} class="mx-auto mb-2 text-theme-muted" />
				<p class="text-sm text-theme-muted">No {planned ? 'planned ' : ''}trips yet</p>
				<p class="text-xs text-theme-muted">{planned ? 'Plan a trip above to see projections' : 'Add your first trip above'}</p>
			</div>
		{:else}
			<div class="space-y-4">
				{#each groupedByYear() as group (group.year)}
					<div>
						<h3 class="mb-2 text-xs font-semibold uppercase tracking-wide text-theme-muted">{group.year}</h3>
						<div class="space-y-2">
							{#each group.trips as trip (trip.id)}
								<TripCard {trip} {planned} {onedit} />
							{/each}
						</div>
					</div>
				{/each}
			</div>
		{/if}
	</div>
</div>
