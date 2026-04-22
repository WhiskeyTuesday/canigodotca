<script lang="ts">
	import { AlertTriangle, CheckCircle, Info } from '@lucide/svelte';
	import type { B1B2PresenceStatus } from '$lib/types';

	interface Props {
		presence: B1B2PresenceStatus;
	}

	let { presence }: Props = $props();

	const pct = $derived(Math.min(100, Math.round((presence.worstDays / presence.threshold) * 100)));
	const todayPct = $derived(Math.min(100, Math.round((presence.todayDays / presence.threshold) * 100)));

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
		</div>
	{/if}

	<div class="space-y-3">
		<!-- As of today / as of date -->
		<div>
			<div class="mb-1 text-sm">
				Today: <span class="font-semibold">{presence.todayDays}</span> / {presence.threshold} days
			</div>
			<div class="mb-1 text-xs text-theme-muted">
				{formatDate(presence.todayWindowStart)} — {formatDate(presence.todayWindowEnd)}
			</div>
			<div class="h-2.5 overflow-hidden rounded-full bg-progress">
				<div
					class="h-full rounded-full transition-all duration-500 {presence.todayDays >= presence.threshold ? 'bg-danger' : 'bg-success'}"
					style="width: {todayPct}%"
				></div>
			</div>
		</div>

		<!-- Worst-case window (if different from today) -->
		{#if presence.worstDays !== presence.todayDays}
			<div>
				<div class="mb-1 text-sm">
					Worst window: <span class="font-semibold">{presence.worstDays}</span> / {presence.threshold} days
				</div>
				<div class="mb-1 text-xs text-theme-muted">
					{formatDate(presence.windowStart)} — {formatDate(presence.windowEnd)}
				</div>
				<div class="h-2.5 overflow-hidden rounded-full bg-progress">
					<div
						class="h-full rounded-full transition-all duration-500 {presence.exceeds ? 'bg-danger' : 'bg-warning'}"
						style="width: {pct}%"
					></div>
				</div>
			</div>
		{/if}
	</div>

	<div class="mt-3 flex items-center gap-2 text-sm">
		{#if presence.exceeds}
			<AlertTriangle size={16} class="text-danger" />
			<span class="text-danger font-medium">Exceeds 180-day guideline</span>
		{:else}
			<CheckCircle size={16} class="text-success" />
			<span class="text-success font-medium">Within guideline</span>
		{/if}
	</div>
</div>
