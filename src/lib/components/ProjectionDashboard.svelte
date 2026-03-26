<script lang="ts">
	import { AlertTriangle, CheckCircle, CircleCheck, CircleX } from '@lucide/svelte';
	import {
		getProvincialStatus,
		getUSPresence,
		getProjectedProvincialStatus,
		getProjectedUSPresence,
		getB1B2Presence,
		getProjectedB1B2Presence,
		getSettings,
		getPlannedTrips
	} from '$lib/stores.svelte';
	import { getProvinceInfo } from '$lib/data/provinces';

	const settings = $derived(getSettings());
	const plannedTrips = $derived(getPlannedTrips());
	const hasPlannedTrips = $derived(plannedTrips.length > 0);

	const current = $derived(getProvincialStatus());
	const projected = $derived(getProjectedProvincialStatus());
	const province = $derived(getProvinceInfo(settings.homeProvince));

	const currentUS = $derived(getUSPresence());
	const projectedUS = $derived(getProjectedUSPresence());

	const currentB1B2 = $derived(getB1B2Presence());
	const projectedB1B2 = $derived(getProjectedB1B2Presence());

	const provincialOk = $derived(projected.status === 'OK');
	const usOk = $derived(!projectedUS.passes);
	const b1b2Ok = $derived(!projectedB1B2.exceeds);
	const allClear = $derived(provincialOk && usOk && b1b2Ok);

	const projPct = $derived(Math.min(100, Math.round((projected.daysPresent / projected.threshold) * 100)));
	const projUSPct = $derived(Math.min(100, Math.round((projectedUS.total / projectedUS.threshold) * 100)));
	const projB1B2Pct = $derived(Math.min(100, Math.round((projectedB1B2.worstDays / projectedB1B2.threshold) * 100)));

	function formatDate(d: string): string {
		return new Date(d + 'T00:00:00').toLocaleDateString('en-CA', {
			month: 'short',
			day: 'numeric',
			year: 'numeric'
		});
	}
</script>

{#if hasPlannedTrips}
	<div class="px-4 py-3">
		<div class="mx-auto max-w-3xl">
			<!-- Verdict Banner -->
			<div class="mb-3 rounded-xl p-4 text-center {allClear ? 'bg-success/10 border border-success/30' : 'bg-danger/10 border border-danger/30'}">
				{#if allClear}
					<CircleCheck size={32} class="mx-auto mb-1 text-success" />
					<p class="text-lg font-bold text-success">Yes, you can go!</p>
					<p class="text-sm text-theme-secondary">Your planned trips keep you within all thresholds.</p>
				{:else}
					<CircleX size={32} class="mx-auto mb-1 text-danger" />
					<p class="text-lg font-bold text-danger">Warning: threshold exceeded</p>
					<p class="text-sm text-theme-secondary">Your planned trips would push you past a limit.</p>
				{/if}
			</div>

			<div class="grid gap-3 md:grid-cols-2">
				<!-- Provincial Projection -->
				<div class="rounded-xl border border-card bg-card p-4">
					<h3 class="mb-3 text-sm font-semibold">🏥 {province.label} Healthcare — Projected</h3>

					<div class="mb-2 text-sm">
						Days present:
						<span class="text-theme-muted">{current.daysPresent}</span>
						<span class="mx-1">→</span>
						<span class="font-semibold">{projected.daysPresent}</span>
						/ {projected.threshold}
					</div>

					<div class="mb-3 h-3 overflow-hidden rounded-full bg-progress">
						<div
							class="h-full rounded-full transition-all duration-500 {projected.status === 'OK'
								? 'bg-success'
								: projected.status === 'AT_RISK'
									? 'bg-warning'
									: 'bg-danger'}"
							style="width: {projPct}%"
						></div>
					</div>

					<div class="flex items-center gap-2 text-sm">
						{#if projected.status === 'OK'}
							<CheckCircle size={16} class="text-success" />
							<span class="text-success font-medium">Maintains Residency</span>
						{:else if projected.status === 'AT_RISK'}
							<AlertTriangle size={16} class="text-warning" />
							<span class="text-warning font-medium">{projected.daysRemaining} more days needed</span>
						{:else}
							<AlertTriangle size={16} class="text-danger" />
							<span class="text-danger font-medium">{projected.daysRemaining} more days needed</span>
						{/if}
					</div>
				</div>

				<!-- US Presence Projection -->
				<div class="rounded-xl border border-card bg-card p-4">
					<h3 class="mb-3 text-sm font-semibold">🇺🇸 US Substantial Presence — Projected</h3>

					<div class="mb-2 text-sm">
						Weighted total:
						<span class="text-theme-muted">{currentUS.total}</span>
						<span class="mx-1">→</span>
						<span class="font-semibold">{projectedUS.total}</span>
						/ {projectedUS.threshold}
					</div>

					<div class="mb-3 h-3 overflow-hidden rounded-full bg-progress">
						<div
							class="h-full rounded-full transition-all duration-500 {projectedUS.passes ? 'bg-danger' : 'bg-success'}"
							style="width: {projUSPct}%"
						></div>
					</div>

					<div class="flex items-center gap-2 text-sm">
						{#if projectedUS.passes}
							<AlertTriangle size={16} class="text-danger" />
							<span class="text-danger font-medium">Would meet substantial presence test</span>
						{:else}
							<CheckCircle size={16} class="text-success" />
							<span class="text-success font-medium">Below threshold</span>
						{/if}
					</div>
				</div>

				<!-- B1/B2 Rolling Presence Projection -->
				<div class="rounded-xl border border-card bg-card p-4">
					<h3 class="mb-3 text-sm font-semibold">🛂 B1/B2 Rolling Presence — Projected</h3>

					<div class="mb-2 text-sm">
						Worst-case window:
						<span class="text-theme-muted">{currentB1B2.worstDays}</span>
						<span class="mx-1">→</span>
						<span class="font-semibold">{projectedB1B2.worstDays}</span>
						/ {projectedB1B2.threshold} days
					</div>

					<div class="mb-2 text-xs text-theme-muted">
						{formatDate(projectedB1B2.windowStart)} — {formatDate(projectedB1B2.windowEnd)}
					</div>

					<div class="mb-3 h-3 overflow-hidden rounded-full bg-progress">
						<div
							class="h-full rounded-full transition-all duration-500 {projectedB1B2.exceeds ? 'bg-danger' : 'bg-success'}"
							style="width: {projB1B2Pct}%"
						></div>
					</div>

					<div class="flex items-center gap-2 text-sm">
						{#if projectedB1B2.exceeds}
							<AlertTriangle size={16} class="text-danger" />
							<span class="text-danger font-medium">Would exceed 180-day guideline</span>
						{:else}
							<CheckCircle size={16} class="text-success" />
							<span class="text-success font-medium">Within guideline</span>
						{/if}
					</div>
				</div>
			</div>
		</div>
	</div>
{/if}
