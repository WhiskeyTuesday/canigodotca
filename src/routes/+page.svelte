<script lang="ts">
	import { onMount } from 'svelte';
	import { initFromStorage, getSettings, getTrips } from '$lib/stores.svelte';
	import { applyTheme } from '$lib/theme';
	import Header from '$lib/components/Header.svelte';
	import ProvinceSelector from '$lib/components/ProvinceSelector.svelte';
	import TripForm from '$lib/components/TripForm.svelte';
	import TripList from '$lib/components/TripList.svelte';
	import Dashboard from '$lib/components/Dashboard.svelte';
	import TripPlanner from '$lib/components/TripPlanner.svelte';
	import Footer from '$lib/components/Footer.svelte';
	import SaveLoadButtons from '$lib/components/SaveLoadButtons.svelte';
	import Toast from '$lib/components/Toast.svelte';
	import type { Trip } from '$lib/types';

	let editingTrip = $state<Trip | null>(null);

	onMount(() => {
		initFromStorage();
		applyTheme();
	});

	// Re-apply theme when settings change
	$effect(() => {
		const s = getSettings();
		applyTheme(s.theme);
	});

	function handleEdit(trip: Trip) {
		editingTrip = trip;
	}

	function handleDone() {
		editingTrip = null;
	}
</script>

<svelte:head>
	<title>Can I Go? — Provincial Residency Tracker</title>
	<meta name="description" content="Track days outside your Canadian province to monitor healthcare eligibility and US substantial presence." />
</svelte:head>

<div class="flex min-h-screen flex-col">
	<Header />

	<main class="flex-1">
		<ProvinceSelector />
		<div class="px-4 py-2">
			<div class="mx-auto max-w-3xl">
				<SaveLoadButtons />
			</div>
		</div>
		<div class="px-4 pt-3">
			<div class="mx-auto max-w-3xl">
				<h2 class="text-base font-bold">Trip History</h2>
				<p class="mt-1 text-sm text-theme-muted">Log trips you've already taken.</p>
			</div>
		</div>
		<TripForm editTrip={editingTrip} oncancel={handleDone} ondone={handleDone} />
		<TripList trips={getTrips()} onedit={handleEdit} />

		<div class="px-4 pt-3">
			<div class="mx-auto max-w-3xl">
				<h2 class="text-base font-bold">Current Status</h2>
				<p class="mt-1 text-sm text-theme-muted">Based on logged trips only.</p>
			</div>
		</div>
		<Dashboard />

		<TripPlanner />
	</main>

	<Footer />
	<Toast />
</div>
