import type { UserSettings } from '$lib/types';

export function applyTheme(theme: UserSettings['theme']) {
	if (typeof document === 'undefined') return;
	if (theme === 'system') {
		document.documentElement.removeAttribute('data-theme');
	} else {
		document.documentElement.setAttribute('data-theme', theme);
	}
}
