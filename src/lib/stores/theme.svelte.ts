import { browser } from '$app/environment';

const STORAGE_KEY = 'uroscan-theme';

/** Dark-mode state, persisted to localStorage and reflected on <html class="dark">. */
function createThemeStore() {
	let dark = $state(false);

	if (browser) {
		dark = document.documentElement.classList.contains('dark');
	}

	function apply() {
		if (!browser) return;
		document.documentElement.classList.toggle('dark', dark);
		try {
			localStorage.setItem(STORAGE_KEY, dark ? 'dark' : 'light');
		} catch {
			/* storage may be unavailable (private mode) */
		}
	}

	return {
		get dark() {
			return dark;
		},
		toggle() {
			dark = !dark;
			apply();
		},
		set(value: boolean) {
			dark = value;
			apply();
		}
	};
}

export const themeStore = createThemeStore();
