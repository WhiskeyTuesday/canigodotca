<script lang="ts">
	import ProvincialStatusCard from './ProvincialStatusCard.svelte';
	import USPresenceCard from './USPresenceCard.svelte';
	import B1B2PresenceCard from './B1B2PresenceCard.svelte';
</script>

<div class="px-4 py-3">
	<div class="mx-auto grid max-w-3xl gap-3 md:grid-cols-2">
		<ProvincialStatusCard />
		<USPresenceCard />
		<B1B2PresenceCard />
	</div>
	<div class="mx-auto mt-3 max-w-3xl">
		<p class="text-xs text-theme-muted">
			Disclaimer: This tool provides estimates only. Consult official government sources and a tax professional for definitive advice.
		</p>
	</div>
</div>
