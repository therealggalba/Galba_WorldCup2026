import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_SPORTS_URL || import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_SPORTS_ANON_KEY || import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error("Las variables de entorno VITE_SUPABASE_URL/VITE_SUPABASE_SPORTS_URL o sus correspondientes ANON_KEY no están configuradas.");
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
