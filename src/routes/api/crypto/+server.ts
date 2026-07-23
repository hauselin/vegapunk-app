import { ENCRYPTION_IV, ENCRYPTION_KEY } from "$env/static/private";
import { logger } from '$lib/logger';
import type { RequestHandler } from './$types';
import { encrypt } from './utils';

export const POST: RequestHandler = (async ({ request }): Promise<Response> => {
	try {
		const response = await request.json();
		const { text } = response;
		const ciphertext = encrypt(ENCRYPTION_KEY, ENCRYPTION_IV, text);
		return new Response(JSON.stringify({
			ciphertext
		}), { status: 200, headers: { 'Content-Type': 'application/json' } });
	} catch (error) {
		logger.error(error, "Error handling request for /api/crypto");
		return new Response("Internal Server Error", { status: 500 });
	}

}) satisfies RequestHandler;
