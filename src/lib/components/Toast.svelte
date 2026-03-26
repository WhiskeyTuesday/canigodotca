<script lang="ts">
	import { getToast } from '$lib/stores.svelte';

	const toast = $derived(getToast());
</script>

{#if toast.visible}
	<div
		class="fixed bottom-4 left-1/2 z-50 -translate-x-1/2 rounded-lg bg-gray-900 px-4 py-2 text-sm text-white shadow-lg transition-opacity"
		role="status"
	>
		{toast.message}
	</div>
{/if}
