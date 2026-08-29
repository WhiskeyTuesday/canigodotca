<script lang="ts">
	import SaveLoadButtons from './SaveLoadButtons.svelte';
</script>

<footer class="border-t border-theme px-4 py-6">
	<div class="mx-auto max-w-3xl space-y-4">
		<SaveLoadButtons />

		<div class="space-y-2 border-t border-theme pt-4 text-xs text-theme-muted">
			<p>
				This tool is for informational purposes only and does not constitute legal, tax, or medical advice. Rules may change without notice. Always verify with official government sources and consult a qualified professional before making decisions based on this information.
			</p>
			<p>
				&copy; {new Date().getFullYear()} canigo.ca &mdash; canigo is a project of <a href="https://www.elijasorensen.com" target="_blank" rel="noopener" class="underline hover:text-accent">Elija Sorensen</a> be good to each other, stay cool.
			</p>
			<p>
				Please report any bugs via <a href="mailto:hello@elijasorensen.com" class="underline hover:text-accent">email</a> or <a href="https://github.com/whiskeytuesday/canigodotca" target="_blank" rel="noopener" class="underline hover:text-accent">GitHub</a>.
			</p>
		</div>
	</div>
</footer>
