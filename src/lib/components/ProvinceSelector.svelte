<script lang="ts">
	import { Home } from '@lucide/svelte';
	import { PROVINCES } from '$lib/data/provinces';
	import { getSettings, setSettings } from '$lib/stores.svelte';
	import type { Province } from '$lib/types';

	const SUPPORTED_PROVINCES: Province[] = ['bc'];

	const settings = $derived(getSettings());
</script>

<div class="px-4 py-3">
	<div class="mx-auto max-w-3xl">
		<label class="mb-1 flex items-center gap-2 text-sm font-medium text-theme-secondary">
			<Home size={16} />
			Select your home province or territory
		</label>
		<select
			value={settings.homeProvince}
			onchange={(e) => setSettings({ homeProvince: e.currentTarget.value as Province })}
			class="w-full rounded-lg border border-theme bg-card px-3 py-2.5 text-theme transition-colors focus:border-accent focus:outline-none"
		>
			{#each PROVINCES as prov}
				{#if SUPPORTED_PROVINCES.includes(prov.code)}
					<option value={prov.code}>
						🇨🇦 {prov.label} (~{prov.threshold} days present, calendar year)
					</option>
				{:else}
					<option value={prov.code} disabled>
						🇨🇦 {prov.label} — coming soon
					</option>
				{/if}
			{/each}
		</select>
	</div>
</div>
