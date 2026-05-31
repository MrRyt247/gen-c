import { redirect } from '@sveltejs/kit';

/** The app opens on the dashboard; the auth guard sends signed-out users to sign in. */
export const load = () => {
	redirect(307, '/dashboard');
};
