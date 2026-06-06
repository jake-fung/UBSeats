import { createClient } from '@supabase/supabase-js';
import type { Database } from '@/supabase/schema/database.types';

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;
const SUPABASE_KEY = import.meta.env.VITE_SUPABASE_KEY;

if (!SUPABASE_URL || !SUPABASE_KEY) {
    throw new Error('Missing Supabase credentials');
}

export const supabase = createClient<Database>(SUPABASE_URL, SUPABASE_KEY);