<script lang="ts">
	import { CircleCheck, CircleX } from '@lucide/svelte';
	import ProvincialStatusCard from './ProvincialStatusCard.svelte';
	import USPresenceCard from './USPresenceCard.svelte';
	import B1B2PresenceCard from './B1B2PresenceCard.svelte';
	import { getTrips, getPlannedTrips, getSettings } from '$lib/stores.svelte';
	import { getProvinceInfo } from '$lib/data/provinces';
	import { calculateProvincialStatus, calculateUSPresence, calculateB1B2Presence } from '$lib/data/calculations';

	const settings = $derived(getSettings());
	const trips = $derived(getTrips());
	const plannedTrips = $derived(getPlannedTrips());
	const hasPlannedTrips = $derived(plannedTrips.length > 0);
	const province = $derived(getProvinceInfo(settings.homeProvince));

	// Find the latest return date among all planned trips
	const projectionDate = $derived.by(() => {
		let latest = '';
		for (const trip of plannedTrips) {
			const ret = trip.returnDate ?? trip.departureDate;
			if (ret > latest) latest = ret;
		}
		return latest;
	});

	const allTrips = $derived(trips.concat(plannedTrips));

	// Compute all three cards as-of the projection date
	const projProvincial = $derived(
		hasPlannedTrips
			? calculateProvincialStatus(allTrips, settings.homeProvince, settings.yearOfInterest, projectionDate)
			: null
	);
	const projUS = $derived(
		hasPlannedTrips
			? calculateUSPresence(allTrips, settings.yearOfInterest)
			: null
	);
	const projB1B2 = $derived(
		hasPlannedTrips
			? calculateB1B2Presence(allTrips, projectionDate)
			: null
	);

	const allClear = $derived(
		projProvincial && projUS && projB1B2
			? projProvincial.status !== 'EXCEEDED' && !projUS.passes && !projB1B2.exceeds
			: true
	);

	function formatDate(d: string): string {
		return new Date(d + 'T00:00:00').toLocaleDateString('en-CA', {
			weekday: 'short',
			month: 'short',
			day: 'numeric',
			year: 'numeric'
		});
	}
</script>

{#if hasPlannedTrips && projProvincial && projUS && projB1B2}
	<div class="px-4 py-3">
		<div class="mx-auto max-w-3xl">
			<!-- Verdict Banner with date -->
			<div class="mb-3 rounded-xl p-4 text-center {allClear ? 'bg-success/10 border border-success/30' : 'bg-danger/10 border border-danger/30'}">
				{#if allClear}
					<CircleCheck size={32} class="mx-auto mb-1 text-success" />
					<p class="text-lg font-bold text-success">Yes, you can go!</p>
				{:else}
					<CircleX size={32} class="mx-auto mb-1 text-danger" />
					<p class="text-lg font-bold text-danger">Warning: threshold exceeded</p>
				{/if}
				<p class="text-sm text-theme-secondary">
					Projected status as of <span class="font-semibold">{formatDate(projectionDate)}</span>
				</p>
			</div>

			<div class="grid gap-3 md:grid-cols-2">
				<ProvincialStatusCard status={projProvincial} {province} yearOfInterest={settings.yearOfInterest} />
				<USPresenceCard presence={projUS} />
				<B1B2PresenceCard presence={projB1B2} />
			</div>
		</div>
	</div>
{/if}
