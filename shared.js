/*
  ═══════════════════════════════════════════════════════════════
  CupIT — Shared Data Definitions  (shared.js)
  ═══════════════════════════════════════════════════════════════

  PURPOSE:
    Single source of truth for the cupping vocabulary used across
    the app. Previously these arrays were duplicated in cupping.html,
    join.html and history.html, which meant changes had to be made
    in 2–4 places in lockstep.

  USAGE:
    Every page that uses any of these globals loads this file via:
      <script src="shared.js"></script>
    Load order is: supabase-js → config.js → shared.js → page script.
    The values are exposed on `window` so they are accessible from
    any subsequent script without imports.

  WHAT'S DEFINED:
    window.WHEEL          The flavour wheel — families and specifics.
    window.ALL_PARAMS     Every field a cupper can capture — the
                          master list of sensory params.
    window.SCALE_FIELDS   Derived from ALL_PARAMS: just the scale-type
                          fields (Body, Dry/Wet Aroma, Aftertaste).
    window.DEFAULT_CUPPING_DEFAULTS
                          The factory-default cupping profile. Used
                          as a fallback when a user has no saved
                          defaults yet.
    window.loadCuppingDefaults(userId)
                          Async helper that returns the user's saved
                          defaults from profiles.cupping_defaults, or
                          DEFAULT_CUPPING_DEFAULTS if none exist.

  TO ADD A NEW SCALE FIELD:
    Append to ALL_PARAMS with type:'scale' and an options array.
    SCALE_FIELDS picks it up automatically.

  TO ADD A NEW FLAVOUR FAMILY:
    Push a new object into WHEEL with id, emoji, name, specifics.
  ═══════════════════════════════════════════════════════════════
*/

// ── FLAVOUR WHEEL ──
window.WHEEL = [
  { id:'fruity',  emoji:'🍓', name:'Fruity',          specifics:['Blackberry','Raspberry','Blueberry','Strawberry','Lemon','Lime','Orange','Grapefruit','Peach','Apricot','Cherry','Mango','Pineapple','Passion Fruit','Raisin','Prune'] },
  { id:'floral',  emoji:'🌸', name:'Floral',          specifics:['Jasmine','Rose','Lavender','Orange Blossom','Elderflower','Black Tea','Chamomile'] },
  { id:'sweet',   emoji:'🍯', name:'Sweet',           specifics:['Vanilla','Cream','Caramel','Toffee','Honey','Brown Sugar','Maple Syrup','Dark Chocolate','Milk Chocolate','Cocoa'] },
  { id:'nutty',   emoji:'🥜', name:'Nutty',           specifics:['Almond','Hazelnut','Peanut','Walnut','Pecan','Cocoa Powder'] },
  { id:'spices',  emoji:'🌶', name:'Spices',          specifics:['Cinnamon','Cardamom','Nutmeg','Ginger','Clove','Pepper'] },
  { id:'roasted', emoji:'🔥', name:'Roasted',         specifics:['Malt','Toast','Biscuit','Smoky','Ashy','Bitter'] },
  { id:'veggie',  emoji:'🌿', name:'Veggie / Earthy', specifics:['Grass','Green Tea','Herb','Mushroom','Earthy','Woody','Cedar'] },
  { id:'sour',    emoji:'🍋', name:'Sour / Fermented',specifics:['Citric','Bright','Sour','Tangy','Winey','Yeasty','Funky'] },
];

// ── ALL CUPPING PARAMS ──
window.ALL_PARAMS = [
  { id:'flavours',  label:'Flavour Notes', type:'flavours' },
  { id:'notes',     label:'Tasting Notes', type:'textarea', placeholder:'Free-form impressions...' },
  { id:'body',      label:'Body',          type:'scale',    options:['None','Light','Round','Full','Syrupy'] },
  { id:'dry_aroma', label:'Dry Aroma',     type:'scale',    options:['Faint','Delicate','Moderate','Intense','Complex'] },
  { id:'wet_aroma', label:'Wet Aroma',     type:'scale',    options:['Faint','Delicate','Moderate','Intense','Complex'] },
  { id:'aftertaste',label:'Aftertaste',    type:'scale',    options:['Short','Medium','Long','Lingering'] },
];

// ── SCALE FIELDS (derived) ──
window.SCALE_FIELDS = window.ALL_PARAMS
  .filter(p => p.type === 'scale')
  .map(p => ({ id: p.id, label: p.label, options: p.options }));


// ═══════════════════════════════════════════════════════════════
//  CUPPING DEFAULTS (Phase 1 — added for per-user customisation)
// ═══════════════════════════════════════════════════════════════

// ── DEFAULT_CUPPING_DEFAULTS ──
// The factory-default cupping profile, used when a user hasn't
// customised anything yet. Mirrors the current hard-coded behaviour
// of cupping.html so nothing changes for users with no profile data.
//
// Shape:
//   activeParams : array of ALL_PARAMS ids that should be ON by default
//   passes       : number of multi-pass evaluations (1 = single pass)
//   wheel        : custom flavour wheel (same shape as window.WHEEL).
//                  null means "use the global WHEEL".
//   scales       : per-scale overrides keyed by param id.
//                  e.g. { body: ['Light','Medium','Heavy'] }
//                  null/missing means "use the option list from ALL_PARAMS".
window.DEFAULT_CUPPING_DEFAULTS = {
  activeParams: ['flavours', 'notes'], // matches cupping.html's current default
  passes:       1,
  wheel:        null, // null = use the global WHEEL
  scales:       {},   // empty = no overrides
};


// ── loadCuppingDefaults(userId) ──
// Fetches the user's saved cupping defaults from profiles.cupping_defaults.
// Returns DEFAULT_CUPPING_DEFAULTS if the column is null, the row is missing,
// the column doesn't exist yet (early dev), or the fetch fails.
// Always returns a complete object — caller never needs to null-check fields.
window.loadCuppingDefaults = async function(userId) {
  // Fallback: factory defaults (deep-cloned so callers can mutate safely)
  const fallback = () => JSON.parse(JSON.stringify(window.DEFAULT_CUPPING_DEFAULTS));

  if (!userId || !window.supabaseClient) return fallback();

  try {
    const { data, error } = await window.supabaseClient
      .from('profiles')
      .select('cupping_defaults')
      .eq('user_id', userId)
      .single();

    if (error) {
      // Could be: column doesn't exist (PGRST204), no profile row, or RLS.
      // Any of these → quietly fall back to factory defaults.
      console.warn('[loadCuppingDefaults] falling back to factory:', error.message);
      return fallback();
    }

    // Null column or empty object → factory
    if (!data || !data.cupping_defaults) return fallback();

    // Merge stored defaults with factory shape so any newly-added keys are
    // automatically populated for users with older saved data. This lets us
    // add new fields to DEFAULT_CUPPING_DEFAULTS later without migrations.
    return Object.assign(fallback(), data.cupping_defaults);
  } catch (e) {
    console.warn('[loadCuppingDefaults] threw:', e.message);
    return fallback();
  }
};


// ── saveCuppingDefaults(userId, defaults) ──
// Writes the user's cupping defaults back to profiles.cupping_defaults.
// Returns { ok: true } on success or { ok: false, error: '...' } on failure.
window.saveCuppingDefaults = async function(userId, defaults) {
  if (!userId)               return { ok: false, error: 'No user id' };
  if (!window.supabaseClient) return { ok: false, error: 'No supabase client' };

  try {
    const { error } = await window.supabaseClient
      .from('profiles')
      .update({ cupping_defaults: defaults })
      .eq('user_id', userId);
    if (error) return { ok: false, error: error.message };
    return { ok: true };
  } catch (e) {
    return { ok: false, error: e.message };
  }
};
