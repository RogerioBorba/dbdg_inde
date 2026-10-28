import { defineEnvVars } from '@sveltejs/kit/env';

// @migration-task Review usage of dynamic environment variables. They fall back to the empty string if not present, which may not be what you want.
export const variables = defineEnvVars({
	GEMINI_API_KEY: { schema: (input) => input ?? '' },
	AI_API_KEY: { schema: (input) => input ?? '' },
	OPENAI_API_KEY: { schema: (input) => input ?? '' }
});
