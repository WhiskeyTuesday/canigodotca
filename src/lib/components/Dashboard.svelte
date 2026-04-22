<script lang="ts">
	import ProvincialStatusCard from './ProvincialStatusCard.svelte';
	import USPresenceCard from './USPresenceCard.svelte';
	import B1B2PresenceCard from './B1B2PresenceCard.svelte';
	import { getProvincialStatus, getUSPresence, getB1B2Presence, getSettings } from '$lib/stores.svelte';
	import { getProvinceInfo } from '$lib/data/provinces';

	const settings = $derived(getSettings());
	const provincialStatus = $derived(getProvincialStatus());
	const usPresence = $derived(getUSPresence());
	const b1b2Presence = $derived(getB1B2Presence());
	const province = $derived(getProvinceInfo(settings.homeProvince));
</script>

<div class="px-4 py-3">
	<div class="mx-auto grid max-w-3xl gap-3 md:grid-cols-2">
		<ProvincialStatusCard status={provincialStatus} {province} yearOfInterest={settings.yearOfInterest} />
		<USPresenceCard presence={usPresence} />
		<B1B2PresenceCard presence={b1b2Presence} />
	</div>
	<div class="mx-auto mt-3 max-w-3xl">
		<p class="text-xs text-theme-muted">
			Disclaimer: This tool provides estimates only. Consult official government sources and a tax professional for definitive advice.
		</p>
	</div>
</div>
