<script lang="ts">
	import { MapPinPlus } from '@lucide/svelte';
	import { getPlannedTrips } from '$lib/stores.svelte';
	import TripForm from './TripForm.svelte';
	import TripList from './TripList.svelte';
	import ProjectionDashboard from './ProjectionDashboard.svelte';
	import type { Trip } from '$lib/types';

	let editingPlannedTrip = $state<Trip | null>(null);

	function handleEdit(trip: Trip) {
		editingPlannedTrip = trip;
	}

	function handleDone() {
		editingPlannedTrip = null;
	}
</script>

<div class="px-4 py-3">
	<div class="mx-auto max-w-3xl">
		<div class="mb-3 border-t border-theme pt-4">
			<h2 class="flex items-center gap-2 text-base font-bold">
				<MapPinPlus size={20} class="text-accent" />
				Can I Go?
			</h2>
			<p class="mt-1 text-sm text-theme-muted">Add trips you're thinking about — we'll show whether they'd break any thresholds.</p>
		</div>
	</div>
</div>

<TripForm mode="planned" editTrip={editingPlannedTrip} oncancel={handleDone} ondone={handleDone} />
<TripList trips={getPlannedTrips()} planned onedit={handleEdit} />
<ProjectionDashboard />
