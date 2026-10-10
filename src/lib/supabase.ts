import { createClient } from '@supabase/supabase-js';

// Configurações padrão fornecidas pelo projeto
const DEFAULT_SUPABASE_URL = 'https://unzzrlcminkudoolooer.supabase.co';
const DEFAULT_SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVuenpybGNtaW5rdWRvb2xvb2VyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTEzMDk4MzgsImV4cCI6MjEwNjg4NTgzOH0.zx-nnqUDFzGGdY7kHLXtBcFKCkVjWOR355p8a76FRz8';

const supabaseUrl = (import.meta.env.VITE_SUPABASE_URL || '').trim() || DEFAULT_SUPABASE_URL;
const supabaseAnonKey = (import.meta.env.VITE_SUPABASE_ANON_KEY || '').trim() || DEFAULT_SUPABASE_ANON_KEY;

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: false,
    storage: window.localStorage,
  },
});
