<script lang="ts">
	import { AlertTriangle, CheckCircle, Info } from '@lucide/svelte';
	import { getB1B2Presence } from '$lib/stores.svelte';

	const presence = $derived(getB1B2Presence());
	const pct = $derived(Math.min(100, Math.round((presence.worstDays / presence.threshold) * 100)));

	let showInfo = $state(false);

	function formatDate(d: string): string {
		return new Date(d + 'T00:00:00').toLocaleDateString('en-CA', {
			month: 'short',
			day: 'numeric',
			year: 'numeric'
		});
	}
</script>

<div class="rounded-xl border border-card bg-card p-4">
	<div class="mb-3 flex items-center justify-between">
		<h3 class="flex items-center gap-2 text-sm font-semibold">
			🛂 B1/B2 Rolling Presence
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
			<p>CBP officers generally expect B1/B2 visitors to spend no more than approximately 180 days in the US in any rolling 12-month period. This is an informal guideline, not a strict statutory limit, but exceeding it risks denial of entry.</p>
			<p class="mt-1">This card shows the worst-case 365-day window across all your trips.</p>
		</div>
	{/if}

	<div class="mb-2 text-sm">
		Worst-case window: <span class="font-semibold">{presence.worstDays}</span> / {presence.threshold} days
	</div>

	<div class="mb-2 text-xs text-theme-muted">
		{formatDate(presence.windowStart)} — {formatDate(presence.windowEnd)}
	</div>

	<div class="mb-3 h-3 overflow-hidden rounded-full bg-progress">
		<div
			class="h-full rounded-full transition-all duration-500 {presence.exceeds ? 'bg-danger' : 'bg-success'}"
			style="width: {pct}%"
		></div>
	</div>

	<div class="flex items-center gap-2 text-sm">
		{#if presence.exceeds}
			<AlertTriangle size={16} class="text-danger" />
			<span class="text-danger font-medium">Exceeds 180-day guideline</span>
		{:else}
			<CheckCircle size={16} class="text-success" />
			<span class="text-success font-medium">Within guideline</span>
		{/if}
	</div>
</div>
