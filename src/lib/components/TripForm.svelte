<script lang="ts">
	import { Plus, Plane, X } from '@lucide/svelte';
	import { addTrip, addPlannedTrip, updateTrip, updatePlannedTrip, generateId, getSettings } from '$lib/stores.svelte';
	import type { Trip, Destination, DestinationLeg } from '$lib/types';

	interface Props {
		mode?: 'history' | 'planned';
		editTrip?: Trip | null;
		oncancel?: () => void;
		ondone?: () => void;
	}

	let { mode = 'history', editTrip = null, oncancel, ondone }: Props = $props();

	const settings = $derived(getSettings());

	let departureDate = $state('');
	let returnDate = $state('');
	let isSameDay = $state(false);
	let notes = $state('');
	let legs = $state<{ destination: Destination; arrivalDate: string; departureDate: string }[]>([
		{ destination: 'usa', arrivalDate: '', departureDate: '' }
	]);

	// Sync form when editTrip changes
	$effect(() => {
		if (editTrip) {
			departureDate = editTrip.departureDate;
			returnDate = editTrip.returnDate ?? '';
			isSameDay = editTrip.isSameDay;
			notes = editTrip.notes ?? '';
			legs = editTrip.destinations.map((d) => ({ ...d }));
		} else {
			resetForm();
		}
	});

	// Default return date to departure date so the picker opens to the right month
	let lastDeparture = '';
	$effect(() => {
		if (departureDate && departureDate !== lastDeparture) {
			lastDeparture = departureDate;
			if (!returnDate || returnDate < departureDate) {
				returnDate = departureDate;
			}
		}
	});

	const destinations: { value: Destination; label: string }[] = [
		{ value: 'home', label: 'Home Province' },
		{ value: 'other_ca', label: 'Other Canada' },
		{ value: 'usa', label: 'USA' },
		{ value: 'other', label: 'Other Country' }
	];

	function addLeg() {
		legs.push({ destination: 'usa', arrivalDate: '', departureDate: '' });
	}

	function removeLeg(i: number) {
		legs.splice(i, 1);
	}

	function resetForm() {
		departureDate = '';
		returnDate = '';
		isSameDay = false;
		notes = '';
		legs = [{ destination: 'usa', arrivalDate: '', departureDate: '' }];
	}

	function handleSubmit() {
		if (legs.length === 1) {
			legs[0].arrivalDate = departureDate;
			legs[0].departureDate = isSameDay ? departureDate : returnDate;
		}

		const finalLegs: DestinationLeg[] = legs.map((l) => ({
			destination: l.destination,
			arrivalDate: l.arrivalDate || departureDate,
			departureDate: l.departureDate || (isSameDay ? departureDate : returnDate)
		}));

		const year = parseInt(departureDate.slice(0, 4));

		const trip: Trip = {
			id: editTrip?.id ?? generateId(),
			year,
			departureDate,
			returnDate: isSameDay ? departureDate : returnDate,
			isSameDay,
			destinations: finalLegs,
			notes: notes || undefined
		};

		if (editTrip) {
			if (mode === 'planned') {
				updatePlannedTrip(editTrip.id, trip);
			} else {
				updateTrip(editTrip.id, trip);
			}
		} else {
			if (mode === 'planned') {
				addPlannedTrip(trip);
			} else {
				addTrip(trip);
			}
		}

		resetForm();
		ondone?.();
	}
</script>

<div class="px-4 py-3">
	<div class="mx-auto max-w-3xl rounded-xl border border-card bg-card p-4">
		<h2 class="mb-3 flex items-center gap-2 text-sm font-semibold">
			<Plane size={16} class="text-accent" />
			{editTrip ? 'Edit trip' : mode === 'planned' ? 'Plan a trip' : 'Add a trip'}
		</h2>

		<form onsubmit={(e) => { e.preventDefault(); handleSubmit(); }} class="space-y-3">
			<div class="grid grid-cols-2 gap-3">
				<div>
					<label for="departure" class="mb-1 block text-xs text-theme-secondary">Departure date</label>
					<input
						id="departure"
						type="date"
						bind:value={departureDate}
						required
						class="w-full rounded-lg border border-theme bg-theme px-3 py-2 text-sm text-theme focus:border-accent focus:outline-none"
					/>
				</div>
				<div>
					<label for="return" class="mb-1 block text-xs text-theme-secondary">Return date</label>
					<input
						id="return"
						type="date"
						bind:value={returnDate}
						min={departureDate}
						disabled={isSameDay}
						required={!isSameDay}
						class="w-full rounded-lg border border-theme bg-theme px-3 py-2 text-sm text-theme focus:border-accent focus:outline-none disabled:opacity-50"
					/>
				</div>
			</div>

			<label class="flex items-center gap-2 text-sm">
				<input type="checkbox" bind:checked={isSameDay} class="rounded border-theme" />
				Same-day trip
			</label>

			{#each legs as leg, i}
				<div class="flex items-end gap-2">
					<div class="flex-1">
						<span class="mb-1 block text-xs text-theme-secondary">
							Destination {legs.length > 1 ? i + 1 : ''}
						</span>
						<select
							bind:value={leg.destination}
							aria-label="Destination {i + 1}"
							class="w-full rounded-lg border border-theme bg-theme px-3 py-2 text-sm text-theme focus:border-accent focus:outline-none"
						>
							{#each destinations as d}
								<option value={d.value}>{d.label}</option>
							{/each}
						</select>
					</div>
					{#if legs.length > 1}
						<div>
							<span class="mb-1 block text-xs text-theme-secondary">Arrive</span>
							<input
								type="date"
								bind:value={leg.arrivalDate}
								aria-label="Arrival date {i + 1}"
								class="w-full rounded-lg border border-theme bg-theme px-3 py-2 text-sm text-theme focus:border-accent focus:outline-none"
							/>
						</div>
						<div>
							<span class="mb-1 block text-xs text-theme-secondary">Depart</span>
							<input
								type="date"
								bind:value={leg.departureDate}
								aria-label="Departure date {i + 1}"
								class="w-full rounded-lg border border-theme bg-theme px-3 py-2 text-sm text-theme focus:border-accent focus:outline-none"
							/>
						</div>
						<button
							type="button"
							onclick={() => removeLeg(i)}
							class="rounded-lg p-2 text-danger hover:bg-theme-secondary"
							aria-label="Remove destination {i + 1}"
						>
							<X size={16} />
						</button>
					{/if}
				</div>
			{/each}

			<button
				type="button"
				onclick={addLeg}
				class="flex items-center gap-1 text-sm text-accent hover:underline"
			>
				<Plus size={14} />
				Add destination
			</button>

			<div>
				<label for="notes" class="mb-1 block text-xs text-theme-secondary">Trip notes (optional)</label>
				<input
					id="notes"
					type="text"
					bind:value={notes}
					placeholder="e.g. Business trip to NYC"
					class="w-full rounded-lg border border-theme bg-theme px-3 py-2 text-sm text-theme focus:border-accent focus:outline-none"
				/>
			</div>

			<div class="flex gap-2">
				<button
					type="submit"
					disabled={!departureDate || (!isSameDay && !returnDate)}
					class="rounded-lg bg-accent px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-accent-hover disabled:opacity-50"
				>
					{editTrip ? 'Update trip' : mode === 'planned' ? 'Add to plan' : 'Save trip'}
				</button>
				{#if editTrip}
					<button
						type="button"
						onclick={() => oncancel?.()}
						class="rounded-lg bg-theme-secondary px-4 py-2 text-sm text-theme-secondary transition-colors hover:bg-theme-tertiary"
					>
						Cancel
					</button>
				{/if}
			</div>
		</form>
	</div>
</div>
