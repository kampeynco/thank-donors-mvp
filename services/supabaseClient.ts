import { createClient } from '@supabase/supabase-js';

// Default URL and Key (Project: rvcyplkgglrrwtsdskyj)
const DEFAULT_URL = 'https://rvcyplkgglrrwtsdskyj.supabase.co';
const DEFAULT_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJ2Y3lwbGtnZ2xycnd0c2Rza3lqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjU0MDcyMzIsImV4cCI6MjA4MDk4MzIzMn0.E_21wPNCcqdBy6NuTKe9-fhRpqBp8v3I82GzxKZ5aT0';

let url = DEFAULT_URL;
let key = DEFAULT_KEY;

// Attempt to override with environment variables if available
// This is wrapped in try/catch to safely handle different runtimes (Node, Deno, Browser)
try {
  // @ts-ignore
  if (typeof process !== 'undefined' && process.env) {
    // @ts-ignore
    if (process.env.SBASE_URL) url = process.env.SBASE_URL;
    // @ts-ignore
    if (process.env.SBASE_ANON_KEY) key = process.env.SBASE_ANON_KEY;
  }
} catch (e) {
  // Ignore env access errors
}

// Validate Key
if (!key || key === 'MISSING_ANON_KEY') {
    console.warn('Supabase Anon Key is missing or invalid. Auth will fail.');
}

export const supabase = createClient(url, key);