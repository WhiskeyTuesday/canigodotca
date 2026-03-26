<script lang="ts">
	import { Plane } from '@lucide/svelte';
	import ThemeToggle from './ThemeToggle.svelte';
</script>

<header class="sticky top-0 z-10 border-b border-theme bg-theme px-4 py-3">
	<div class="mx-auto flex max-w-3xl items-center justify-between">
		<div class="flex items-center gap-2">
			<span class="text-2xl">🇨🇦</span>
			<Plane size={24} class="text-accent" />
			<div>
				<h1 class="text-lg font-bold leading-tight">Can I Go?</h1>
				<p class="text-xs text-theme-muted">Where did the time go?</p>
			</div>
		</div>
		<ThemeToggle />
	</div>
</header>
