<script lang="ts">
	import { Sun, Moon, CloudMoon } from '@lucide/svelte';
	import { getSettings, setSettings } from '$lib/stores.svelte';
	import { applyTheme } from '$lib/theme';

	const settings = $derived(getSettings());
	type ThemeOption = 'light' | 'dim' | 'dark';
	const options: ThemeOption[] = ['light', 'dim', 'dark'];

	function resolvedTheme(): ThemeOption {
		if (settings.theme === 'system') {
			if (typeof window !== 'undefined' && window.matchMedia('(prefers-color-scheme: dark)').matches) {
				return 'dark';
			}
			return 'light';
		}
		return settings.theme as ThemeOption;
	}

	function cycleTheme() {
		const current = resolvedTheme();
		const idx = options.indexOf(current);
		const next = options[(idx + 1) % options.length];
		setSettings({ theme: next });
		applyTheme(next);
	}
</script>

<button
	onclick={cycleTheme}
	class="flex items-center gap-1 rounded-lg p-2 transition-colors hover:bg-theme-tertiary"
	aria-label="Toggle theme"
>
	{#if resolvedTheme() === 'light'}
		<Sun size={20} />
	{:else if resolvedTheme() === 'dim'}
		<CloudMoon size={20} />
	{:else}
		<Moon size={20} />
	{/if}
</button>
