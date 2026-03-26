<script lang="ts">
	import { Download, Upload, Save } from '@lucide/svelte';
	import { getSettings, getTrips, getPlannedTrips, loadData, showToast } from '$lib/stores.svelte';
	import { exportToJSONL, importFromJSONL, saveToLocalStorage } from '$lib/data/storage';

	let fileInput: HTMLInputElement;

	function handleSave() {
		saveToLocalStorage({
			version: 2,
			settings: getSettings(),
			trips: getTrips(),
			plannedTrips: getPlannedTrips(),
			lastUpdated: new Date().toISOString()
		});
		showToast('Saved to browser');
	}

	function handleExport() {
		exportToJSONL({
			version: 2,
			settings: getSettings(),
			trips: getTrips(),
			plannedTrips: getPlannedTrips(),
			lastUpdated: new Date().toISOString()
		});
		showToast('File downloaded');
	}

	async function handleImport(e: Event) {
		const input = e.target as HTMLInputElement;
		const file = input.files?.[0];
		if (!file) return;
		try {
			const data = await importFromJSONL(file);
			loadData(data);
			showToast('File loaded successfully');
		} catch {
			showToast('Error loading file');
		}
		input.value = '';
	}
</script>

<div class="flex flex-wrap items-center gap-2">
	<button
		onclick={handleSave}
		class="inline-flex items-center gap-2 rounded-lg bg-accent px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-accent-hover"
	>
		<Save size={16} />
		Save to browser
	</button>
	<button
		onclick={handleExport}
		class="inline-flex items-center gap-2 rounded-lg bg-theme-secondary px-4 py-2 text-sm font-medium text-theme transition-colors hover:bg-theme-tertiary"
	>
		<Download size={16} />
		Save to file
	</button>
	<button
		onclick={() => fileInput.click()}
		class="inline-flex items-center gap-2 rounded-lg bg-theme-secondary px-4 py-2 text-sm font-medium text-theme transition-colors hover:bg-theme-tertiary"
	>
		<Upload size={16} />
		Load from file
	</button>
	<input
		bind:this={fileInput}
		type="file"
		accept=".jsonl"
		onchange={handleImport}
		class="hidden"
	/>
</div>
