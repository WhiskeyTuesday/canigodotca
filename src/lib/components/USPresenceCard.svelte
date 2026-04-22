<script lang="ts">
	import { AlertTriangle, CheckCircle, Info, ExternalLink } from '@lucide/svelte';
	import type { USPresenceStatus } from '$lib/types';

	interface Props {
		presence: USPresenceStatus;
	}

	let { presence }: Props = $props();

	const IRS_URL =
		'https://www.irs.gov/individuals/international-taxpayers/substantial-presence-test';

	const pct = $derived(Math.min(100, Math.round((presence.total / presence.threshold) * 100)));

	let showInfo = $state(false);
</script>

<div class="rounded-xl border border-card bg-card p-4">
	<div class="mb-3 flex items-center justify-between">
		<h3 class="flex items-center gap-2 text-sm font-semibold">
			🇺🇸 US Substantial Presence
		</h3>
		<button
			onclick={() => (showInfo = !showInfo)}
			class="rounded-full p-1.5 text-accent bg-theme-secondary hover:bg-theme-tertiary"
			aria-label="Info"
		>
			<Info size={16} />
		</button>
	</div>

	{#if showInfo}
		<div class="mb-3 rounded-lg bg-theme-secondary p-3 text-xs text-theme-secondary">
			<p>The IRS substantial presence test counts 100% of current year US days + 1/3 of prior year + 1/6 of two years ago. You meet the test if total is 183+ days AND you were in the US 31+ days in the current year.</p>
			<a href={IRS_URL} target="_blank" rel="noopener" class="mt-1 inline-flex items-center gap-1 text-accent hover:underline">
				IRS source <ExternalLink size={12} />
			</a>
		</div>
	{/if}

	<div class="space-y-1 text-sm">
		<div class="flex justify-between">
			<span>{presence.year}: {presence.currentYearDays} days</span>
			<span class="text-theme-muted">× 1 = {presence.currentYearDays}</span>
		</div>
		<div class="flex justify-between">
			<span>{presence.year - 1}: {presence.priorYearDays} days</span>
			<span class="text-theme-muted">÷ 3 = {presence.priorYearWeighted}</span>
		</div>
		<div class="flex justify-between">
			<span>{presence.year - 2}: {presence.twoYearsAgoDays} days</span>
			<span class="text-theme-muted">÷ 6 = {presence.twoYearsAgoWeighted}</span>
		</div>
	</div>

	<div class="my-2 border-t border-card"></div>

	<div class="mb-2 text-sm">
		Weighted total: <span class="font-semibold">{presence.total}</span> / {presence.threshold}
	</div>

	<div class="mb-3 h-3 overflow-hidden rounded-full bg-progress">
		<div
			class="h-full rounded-full transition-all duration-500 {presence.passes ? 'bg-danger' : 'bg-success'}"
			style="width: {pct}%"
		></div>
	</div>

	<div class="flex items-center gap-2 text-sm">
		{#if presence.passes}
			<AlertTriangle size={16} class="text-danger" />
			<span class="text-danger font-medium">Meets substantial presence test</span>
		{:else}
			<CheckCircle size={16} class="text-success" />
			<span class="text-success font-medium">Below threshold</span>
		{/if}
	</div>

	<div class="mt-3 border-t border-card pt-2">
		<a
			href={IRS_URL}
			target="_blank"
			rel="noopener"
			class="text-xs text-theme-muted hover:text-accent"
			title={IRS_URL}
		>
			Source: irs.gov
		</a>
	</div>
</div>
