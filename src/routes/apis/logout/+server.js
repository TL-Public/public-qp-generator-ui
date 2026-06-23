import { json } from "@sveltejs/kit";
import { clearAllCookies } from "$lib/utils/helper.js";

export async function POST({ cookies }) {
	try {
		clearAllCookies(cookies);

		return json({}, { status: 200 });
	} catch (err) {
		// fallback error
		return json({ error: err.message || 'Logout failed' }, { status: 500 });
	}
}
