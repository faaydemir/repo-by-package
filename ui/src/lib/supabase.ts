import { Database } from '@/types/supabase';
import { createClient } from '@supabase/supabase-js';
import fetchRetry from 'fetch-retry';

// Retry only for network errors, timeouts, and 5xx server errors
const fetchWithRetry = fetchRetry(fetch, {
	retries: 2,
	retryDelay: (attempt) => Math.pow(2, attempt) * 1000, // Exponential backoff: 1s, 2s, 4s
	retryOn: (attempt, error, response) => {
		// Retry on network errors (no response)
		if (error !== null) return true;

		// Retry on 5xx server errors (server issues)
		if (response && response.status >= 500) return true;

		// Retry on 408 (Request Timeout) and 429 (Too Many Requests)
		if (response && (response.status === 408 || response.status === 429)) return true;

		// Don't retry on 4xx client errors (except 408 and 429)
		return false;
	},
});

if (!process.env.NEXT_PUBLIC_SUPABASE_URL) {
	throw new Error('Missing env.NEXT_PUBLIC_SUPABASE_URL');
}
if (!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
	throw new Error('Missing env.NEXT_PUBLIC_SUPABASE_ANON_KEY');
}

export const supabase = createClient<Database>(
	process.env.NEXT_PUBLIC_SUPABASE_URL,
	process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
	{
		global: {
			fetch: fetchWithRetry,
		},
	},
);
