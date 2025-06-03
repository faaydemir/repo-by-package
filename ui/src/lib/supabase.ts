import { Database } from '@/types/supabase';
import { createClient } from '@supabase/supabase-js';
import fetchRetry from 'fetch-retry';
// TODO: retry only for timeout
const fetchWithRetry = fetchRetry(fetch, { retries: 2 });

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
