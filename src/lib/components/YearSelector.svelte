<script lang="ts">
	import { getSettings, setSettings } from '$lib/stores.svelte';

	const settings = $derived(getSettings());
	const currentYear = new Date().getFullYear();
	const years = $derived(
		Array.from({ length: 5 }, (_, i) => currentYear - 2 + i)
	);
</script>

<div class="px-4 py-2">
	<div class="mx-auto flex max-w-3xl gap-1 overflow-x-auto">
		{#each years as year}
			<button
				onclick={() => setSettings({ yearOfInterest: year })}
				class="rounded-lg px-4 py-2 text-sm font-medium transition-colors {year === settings.yearOfInterest
					? 'bg-accent text-white'
					: 'bg-theme-secondary text-theme-secondary hover:bg-theme-tertiary'}"
			>
				{year}
			</button>
		{/each}
	</div>
</div>
