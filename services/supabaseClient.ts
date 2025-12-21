import { createClient } from '@supabase/supabase-js';

// Use environment variables for Supabase configuration
const sbaseUrl = import.meta.env.SBASE_URL;
const sbaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

// Validate configuration
if (!sbaseUrl || !sbaseAnonKey) {
    console.warn('Sbase URL or Anon Key is missing. Check your environment variables.');
}

export const supabase = createClient(sbaseUrl || '', sbaseAnonKey || '');