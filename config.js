/*
  ═══════════════════════════════════════════════════════════════
  CupIT — Supabase Configuration  (config.js)
  ═══════════════════════════════════════════════════════════════

  PURPOSE:
    Single source of truth for Supabase credentials and client
    initialisation. All pages reference this file so keys only
    need to be updated in one place.

  SETUP:
    1. Replace SUPABASE_URL with your project URL from:
       Supabase Dashboard → Project Settings → API → Project URL
    2. Replace SUPABASE_ANON_KEY with your anon key from:
       Supabase Dashboard → Project Settings → API → anon public

  SECURITY NOTE:
    The anon key is safe to include here and commit to GitHub.
    It is designed to be public. Your data is protected by
    Row Level Security (RLS) policies in Supabase, not by
    hiding this key. Never put your service_role key here.

  USAGE:
    Every HTML page loads this file via:
      <script src="config.js"></script>
    The supabase client is then available globally as:
      window.supabaseClient
  ═══════════════════════════════════════════════════════════════
*/

// ── Replace these two values with your own ──
const SUPABASE_URL      = 'https://xlfyhohxotldmfetezel.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InhsZnlob2h4b3RsZG1mZXRlemVsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzUzMTU2MzIsImV4cCI6MjA5MDg5MTYzMn0._yCwdVRHbnle9SlGuGEGXtCnpZwMYhn9xT2vI-Jeclk';

// Initialise the Supabase client and attach to window so all
// pages can access it as window.supabaseClient
window.supabaseClient = supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
