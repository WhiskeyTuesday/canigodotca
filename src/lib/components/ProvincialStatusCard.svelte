<script lang="ts">
	import { AlertTriangle, CheckCircle, Info, ExternalLink } from '@lucide/svelte';
	import type { ProvincialStatus } from '$lib/types';
	import type { ProvinceInfo } from '$lib/data/provinces';
	import { daysInYear } from '$lib/data/calculations';

	interface Props {
		status: ProvincialStatus;
		province: ProvinceInfo;
		yearOfInterest: number;
	}

	let { status, province, yearOfInterest }: Props = $props();

	const totalDays = $derived(daysInYear(yearOfInterest));
	const presentPct = $derived(Math.round((status.daysPresent / totalDays) * 100));
	const outsidePct = $derived(Math.round((status.daysOutside / totalDays) * 100));
	const remainderPct = $derived(100 - presentPct - outsidePct);
	const thresholdPct = $derived(Math.round((status.threshold / totalDays) * 100));

	let showInfo = $state(false);
</script>

<div class="rounded-xl border border-card bg-card p-4">
	<div class="mb-3 flex items-center justify-between">
		<h3 class="flex items-center gap-2 text-sm font-semibold">
			🏥 {province.label} Healthcare
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
			<p>You must be physically present in {province.label} for at least 6 months (~{province.threshold} days) per calendar year to maintain MSP eligibility. Residents absent for vacation only may be away up to 7 months.</p>
			<a href={province.sourceUrl} target="_blank" rel="noopener" class="mt-1 inline-flex items-center gap-1 text-accent hover:underline">
				Official source <ExternalLink size={12} />
			</a>
		</div>
	{/if}

	<!-- Stacked year bar -->
	<div class="relative mb-1 h-4 overflow-hidden rounded-full bg-progress">
		{#if presentPct > 0}
			<div
				class="absolute left-0 top-0 h-full bg-success transition-all duration-500"
				style="width: {presentPct}%"
			></div>
		{/if}
		{#if outsidePct > 0}
			<div
				class="absolute top-0 h-full bg-danger transition-all duration-500"
				style="left: {presentPct}%; width: {outsidePct}%"
			></div>
		{/if}
		{#if remainderPct > 0}
			<div
				class="absolute top-0 h-full opacity-30 transition-all duration-500"
				style="left: {presentPct + outsidePct}%; width: {remainderPct}%;
					background: repeating-linear-gradient(
						-45deg,
						var(--color-warning, #eab308),
						var(--color-warning, #eab308) 2px,
						transparent 2px,
						transparent 6px
					)"
			></div>
		{/if}
		<div
			class="absolute top-0 h-full border-r-2 border-theme"
			style="left: {thresholdPct}%"
			title="~{status.threshold} days needed"
		></div>
	</div>

	<!-- Legend -->
	<div class="mb-3 flex flex-wrap gap-x-4 gap-y-0.5 text-xs text-theme-muted">
		<span class="flex items-center gap-1">
			<span class="inline-block h-2.5 w-2.5 rounded-sm bg-success"></span>
			{status.daysPresent} days in {province.label}
		</span>
		<span class="flex items-center gap-1">
			<span class="inline-block h-2.5 w-2.5 rounded-sm bg-danger"></span>
			{status.daysOutside} days away
		</span>
		{#if status.daysLeftInYear > 0}
			<span class="flex items-center gap-1">
				<span class="inline-block h-2.5 w-2.5 rounded-sm opacity-40" style="background: var(--color-warning, #eab308)"></span>
				{status.daysLeftInYear} days left
			</span>
		{/if}
	</div>

	<!-- Status text -->
	<div class="flex items-center gap-2 text-sm">
		{#if status.status === 'OK'}
			<CheckCircle size={16} class="text-success" />
			<span class="text-success font-medium">Met ~{status.threshold}-day threshold</span>
		{:else if status.status === 'EXCEEDED'}
			<AlertTriangle size={16} class="text-danger" />
			<span class="text-danger font-medium">Can't reach threshold — need {status.daysRemaining} more days, only {status.daysLeftInYear} left</span>
		{:else}
			<span class="text-theme-secondary">{status.daysRemaining} more days needed — {status.daysLeftInYear} left in year</span>
		{/if}
	</div>

	<div class="mt-3 border-t border-card pt-2">
		<a
			href={province.sourceUrl}
			target="_blank"
			rel="noopener"
			class="text-xs text-theme-muted hover:text-accent"
			title={province.sourceUrl}
		>
			Source: {province.sourceLabel}
		</a>
	</div>
</div>
