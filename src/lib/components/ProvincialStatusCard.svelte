<script lang="ts">
	import { AlertTriangle, CheckCircle, Info, ExternalLink } from '@lucide/svelte';
	import { getProvincialStatus, getSettings } from '$lib/stores.svelte';
	import { getProvinceInfo } from '$lib/data/provinces';

	const settings = $derived(getSettings());
	const status = $derived(getProvincialStatus());
	const province = $derived(getProvinceInfo(settings.homeProvince));
	const pct = $derived(Math.min(100, Math.round((status.daysPresent / status.threshold) * 100)));

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
			<p>You must be present in {province.label} for at least {province.threshold} days per calendar year to maintain healthcare eligibility.</p>
			<a href={province.sourceUrl} target="_blank" rel="noopener" class="mt-1 inline-flex items-center gap-1 text-accent hover:underline">
				Official source <ExternalLink size={12} />
			</a>
		</div>
	{/if}

	<div class="mb-2 text-sm">
		Days present: <span class="font-semibold">{status.daysPresent}</span> / {status.threshold}
	</div>

	<div class="mb-3 h-3 overflow-hidden rounded-full bg-progress">
		<div
			class="h-full rounded-full transition-all duration-500 {status.status === 'OK'
				? 'bg-success'
				: status.status === 'AT_RISK'
					? 'bg-warning'
					: 'bg-danger'}"
			style="width: {pct}%"
		></div>
	</div>

	<div class="flex items-center gap-2 text-sm">
		{#if status.status === 'OK'}
			<CheckCircle size={16} class="text-success" />
			<span class="text-success font-medium">Maintains Residency</span>
		{:else if status.status === 'AT_RISK'}
			<AlertTriangle size={16} class="text-warning" />
			<span class="text-warning font-medium">{status.daysRemaining} more days needed</span>
		{:else}
			<AlertTriangle size={16} class="text-danger" />
			<span class="text-danger font-medium">{status.daysRemaining} more days needed</span>
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
