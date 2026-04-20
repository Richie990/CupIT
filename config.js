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

// Exposed globally so pages can pass it to realtime.setAuth for anon sessions
window.SUPABASE_ANON_KEY = SUPABASE_ANON_KEY;

// Define track() immediately as a no-op so any page script that calls
// track() before config.js fully runs never throws a ReferenceError.
// It gets replaced below with the real implementation once Supabase loads.
window.track = function() {};

// Initialise Supabase and replace track() with the real implementation.
// Wrapped in try/catch so a CDN failure never breaks the page.
try {
  window.supabaseClient = supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
    realtime: {
      params: {
        eventsPerSecond: 10,
      },
    },
  });

  // ── ANALYTICS ──
  // Inserts an event into the analytics table.
  // user_id is included if a session exists, otherwise the event is anonymous.
  window.track = async function(event, metadata = {}) {
    try {
      let user_id = null;
      try {
        const { data: { session } } = await window.supabaseClient.auth.getSession();
        if (session) user_id = session.user.id;
      } catch(e) { /* no session, continue anonymously */ }

      await window.supabaseClient.from('analytics').insert({
        user_id,
        event,
        metadata,
      });
    } catch(e) {
      // Fail silently — analytics should never break the page
      console.warn('[CupIT analytics] Failed to track event:', event, e.message);
    }
  };

} catch(e) {
  console.warn('[CupIT] Supabase failed to initialise:', e.message);
}
