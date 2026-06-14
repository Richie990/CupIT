/*
  ═══════════════════════════════════════════════════════════════
  CupIT — Shared Data Definitions  (shared.js)
  ═══════════════════════════════════════════════════════════════

  PURPOSE:
    Single source of truth for the cupping vocabulary and the
    user's cupping preferences (presets).

  USAGE:
    Loaded on every page after config.js:
      <script src="config.js"></script>
      <script src="shared.js"></script>
    Globals on `window`, accessible from any subsequent script.

  WHAT'S DEFINED:
    Catalog (the vocabulary):
      window.WHEEL              — flavour wheel families + specifics
      window.ALL_PARAMS         — every attribute a cupper can capture
      window.SCALE_FIELDS       — derived: just the scale-type attributes

    Presets (the configurations):
      window.SYSTEM_PRESETS     — built-in presets (SCA, QC, Casual)
      window.DEFAULT_PRESET_ID  — id of the system preset used when a
                                  user has nothing saved (currently 'casual')
      window.loadPresets(userId)
                                — returns { default_id, presets: [...] }
                                  with system presets merged in
      window.savePresets(userId, data)
                                — writes back to profiles.cupping_defaults
      window.getActivePreset(presetsData)
                                — returns the currently-default preset
      window.applyPresetGlobals(preset)
                                — mutates window.WHEEL, ALL_PARAMS,
                                  SCALE_FIELDS to match a preset's overrides

  BACKWARDS-COMPAT HELPERS (Phase 1/2/3):
    window.DEFAULT_CUPPING_DEFAULTS, window.loadCuppingDefaults,
    window.saveCuppingDefaults — kept working so the existing
    cupping.html and account.html editor keep functioning until
    Phase 4C migrates them. Internally these now operate on the
    user's "default preset" within the new multi-preset shape.

  ATTRIBUTE SCHEMA:
    Each entry in ALL_PARAMS has:
      id           : stable key
      label        : display name
      type         : 'flavours' | 'textarea' | 'scale'
      options      : pill labels (for scale)
      placeholder  : placeholder text (for textarea)

  PRESETS ADD A 'presentation' LAYER:
    Inside a preset, each scale attribute gets per-preset overrides:
      presentation : 'pills' | 'slider'
      options      : custom pill labels (pills mode)
      scoreMin     : numeric lower bound (slider, or hidden score for pills)
      scoreMax     : numeric upper bound
      scoreStep    : numeric increment (typically 0.25 for SCA-style)
    Pills use equal-spaced hidden scores between scoreMin and scoreMax.

  DATA STORAGE FOR A CUPPED ATTRIBUTE:
    Whatever the presentation, the stored value is always numeric:
      { value: 7.33, label: 'Bright' }   (pills mode)
      { value: 8.5 }                      (slider mode)
    label is only present for pill-mode entries.

  TO ADD A NEW ATTRIBUTE:
    Append to ALL_PARAMS. Choose a sensible default presentation +
    score range in the preset definitions where you want it.
  ═══════════════════════════════════════════════════════════════
*/


// ═══════════════════════════════════════════════════════════════
//  1. CATALOG — the vocabulary every preset draws from
// ═══════════════════════════════════════════════════════════════

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

// All attributes the app understands. Presets pick which ones to enable
// and how to present them (pills vs slider, custom score ranges, etc.).
// Adding a new attribute here makes it available everywhere; it won't be
// shown to users unless a preset enables it.
window.ALL_PARAMS = [
  { id:'flavours',  label:'Flavour Notes', type:'flavours' },
  { id:'notes',     label:'Tasting Notes', type:'textarea', placeholder:'Free-form impressions...' },

  { id:'fragrance', label:'Fragrance',  type:'scale', options:['Faint','Delicate','Moderate','Intense','Complex'] },
  { id:'dry_aroma', label:'Dry Aroma',  type:'scale', options:['Faint','Delicate','Moderate','Intense','Complex'] },
  { id:'wet_aroma', label:'Wet Aroma',  type:'scale', options:['Faint','Delicate','Moderate','Intense','Complex'] },
  { id:'acidity',   label:'Acidity',    type:'scale', options:['Low','Mild','Bright','Sharp','Vibrant'] },
  { id:'sweetness', label:'Sweetness',  type:'scale', options:['Subtle','Balanced','Pronounced','Honeyed','Syrupy'] },
  { id:'body',      label:'Body',       type:'scale', options:['None','Light','Round','Full','Syrupy'] },
  { id:'balance',   label:'Balance',    type:'scale', options:['Disjointed','Acceptable','Harmonious','Complete'] },
  { id:'aftertaste',label:'Aftertaste', type:'scale', options:['Short','Medium','Long','Lingering'] },
  { id:'overall',   label:'Overall',    type:'scale', options:['Poor','Fair','Good','Excellent','Outstanding'] },
];

window.SCALE_FIELDS = window.ALL_PARAMS
  .filter(p => p.type === 'scale')
  .map(p => ({ id: p.id, label: p.label, options: p.options }));


// ═══════════════════════════════════════════════════════════════
//  2. SYSTEM PRESETS — built-in, read-only
// ═══════════════════════════════════════════════════════════════

window.SYSTEM_PRESETS = [
  {
    id:           'system:casual',
    name:         'Casual / Quick',
    description:  'The lightest possible cupping. Pills only, no scores. Great for casual tasting with friends or fast quality checks where speed is the priority.',
    system:       true,
    activeParams: ['flavours','notes'],
    passes:       1,
    wheel:        null,
    scales:       {},
  },
  {
    id:           'system:qc',
    name:         'QC / Production',
    description:  'Daily quality-control cupping. Covers the essentials a roaster needs to confirm a batch is on profile, without slowing down. Pills with hidden scores so you can still compare batches if you want.',
    system:       true,
    activeParams: ['flavours','notes','acidity','body','aftertaste'],
    passes:       1,
    wheel:        null,
    scales: {
      acidity:    { presentation:'pills', scoreMin:6, scoreMax:10, scoreStep:0.25 },
      body:       { presentation:'pills', scoreMin:6, scoreMax:10, scoreStep:0.25 },
      aftertaste: { presentation:'pills', scoreMin:6, scoreMax:10, scoreStep:0.25 },
    },
  },
  {
    id:           'system:sca',
    name:         'SCA Q-Grader',
    description:  'Specialty Coffee Association cupping protocol. Eight attributes scored 6.00–10.00 in 0.25 increments. Three temperature passes (hot ~70°C, warm ~55°C, cool ~38°C). Designed for trained Q-graders evaluating samples for purchase or scoring competition coffees.',
    system:       true,
    activeParams: ['flavours','notes','fragrance','acidity','sweetness','body','balance','aftertaste','overall'],
    passes:       3,
    wheel:        null,
    scales: {
      fragrance:  { presentation:'slider', scoreMin:6, scoreMax:10, scoreStep:0.25 },
      acidity:    { presentation:'slider', scoreMin:6, scoreMax:10, scoreStep:0.25 },
      sweetness:  { presentation:'slider', scoreMin:6, scoreMax:10, scoreStep:0.25 },
      body:       { presentation:'slider', scoreMin:6, scoreMax:10, scoreStep:0.25 },
      balance:    { presentation:'slider', scoreMin:6, scoreMax:10, scoreStep:0.25 },
      aftertaste: { presentation:'slider', scoreMin:6, scoreMax:10, scoreStep:0.25 },
      overall:    { presentation:'slider', scoreMin:6, scoreMax:10, scoreStep:0.25 },
    },
  },
];

window.DEFAULT_PRESET_ID = 'system:casual';


// ═══════════════════════════════════════════════════════════════
//  3. SCORE HELPERS
// ═══════════════════════════════════════════════════════════════

// Equal-spaced score for the pill at index `idx` among `count` pills
// on a [min, max] range.
window.pillScore = function(idx, count, min, max) {
  if (count <= 1) return min;
  return min + (idx / (count - 1)) * (max - min);
};

// Effective config for an attribute under a given preset: merges the
// catalog (ALL_PARAMS) defaults with the preset's per-attribute overrides.
window.resolveAttr = function(preset, attrId) {
  const catalog = window.ALL_PARAMS.find(p => p.id === attrId);
  if (!catalog) return null;
  const override = preset.scales?.[attrId] || {};
  return {
    id:           attrId,
    label:        catalog.label,
    type:         catalog.type,
    options:      override.options    || catalog.options,
    placeholder:  catalog.placeholder,
    presentation: override.presentation || 'pills',
    scoreMin:     override.scoreMin   ?? 6,
    scoreMax:     override.scoreMax   ?? 10,
    scoreStep:    override.scoreStep  ?? 0.25,
  };
};


// ═══════════════════════════════════════════════════════════════
//  4. PRESET LOAD / SAVE
// ═══════════════════════════════════════════════════════════════

function migrateLegacyShape(legacy) {
  if (legacy && Array.isArray(legacy.presets)) return legacy;
  if (legacy && (legacy.activeParams || legacy.passes || legacy.wheel || legacy.scales)) {
    const migratedId = 'user_' + Math.random().toString(36).slice(2, 10);

    // Convert old-shape scales (just option arrays keyed by id) into the
    // new wrapped shape with presentation + score range.
    const wrappedScales = {};
    if (legacy.scales && typeof legacy.scales === 'object') {
      Object.entries(legacy.scales).forEach(([id, opts]) => {
        if (Array.isArray(opts) && opts.length >= 2) {
          wrappedScales[id] = {
            presentation: 'pills',
            options:      opts,
            scoreMin:     6,
            scoreMax:     10,
            scoreStep:    0.25,
          };
        }
      });
    }

    return {
      default_id: migratedId,
      presets: [{
        id:           migratedId,
        name:         'My setup',
        description:  '',
        system:       false,
        activeParams: legacy.activeParams || ['flavours','notes'],
        passes:       legacy.passes       || 1,
        wheel:        legacy.wheel        || null,
        scales:       wrappedScales,
      }],
    };
  }
  return { default_id: window.DEFAULT_PRESET_ID, presets: [] };
}

function mergeSystemPresets(data) {
  const userPresets = (data.presets || []).filter(p => !String(p.id).startsWith('system:'));
  const systems     = JSON.parse(JSON.stringify(window.SYSTEM_PRESETS));
  return {
    default_id: data.default_id || window.DEFAULT_PRESET_ID,
    presets:    [...userPresets, ...systems],
  };
}

window.loadPresets = async function(userId) {
  const fallback = () => mergeSystemPresets({ default_id: window.DEFAULT_PRESET_ID, presets: [] });
  if (!userId || !window.supabaseClient) return fallback();

  try {
    const { data, error } = await window.supabaseClient
      .from('profiles')
      .select('cupping_defaults')
      .eq('user_id', userId)
      .single();
    if (error) {
      console.warn('[loadPresets] falling back:', error.message);
      return fallback();
    }
    if (!data || !data.cupping_defaults) return fallback();
    return mergeSystemPresets(migrateLegacyShape(data.cupping_defaults));
  } catch (e) {
    console.warn('[loadPresets] threw:', e.message);
    return fallback();
  }
};

window.savePresets = async function(userId, data) {
  if (!userId)                return { ok: false, error: 'No user id' };
  if (!window.supabaseClient) return { ok: false, error: 'No supabase client' };

  const userPresets = (data.presets || []).filter(p => !String(p.id).startsWith('system:'));
  const payload = {
    default_id: data.default_id || window.DEFAULT_PRESET_ID,
    presets:    userPresets,
  };

  try {
    const { error } = await window.supabaseClient
      .from('profiles')
      .update({ cupping_defaults: payload })
      .eq('user_id', userId);
    if (error) return { ok: false, error: error.message };
    return { ok: true };
  } catch (e) {
    return { ok: false, error: e.message };
  }
};

window.getActivePreset = function(data) {
  if (!data || !data.presets?.length) return null;
  return data.presets.find(p => p.id === data.default_id) || data.presets[0];
};

window.applyPresetGlobals = function(preset) {
  if (!preset) return;
  if (Array.isArray(preset.wheel) && preset.wheel.length > 0) {
    window.WHEEL = preset.wheel;
  }
  if (preset.scales && typeof preset.scales === 'object') {
    Object.entries(preset.scales).forEach(([id, override]) => {
      if (!override.options || override.options.length < 2) return;
      const p = window.ALL_PARAMS.find(x => x.id === id && x.type === 'scale');
      if (p) p.options = override.options;
    });
  }
  window.SCALE_FIELDS = window.ALL_PARAMS
    .filter(p => p.type === 'scale')
    .map(p => ({ id: p.id, label: p.label, options: p.options }));
};


// ═══════════════════════════════════════════════════════════════
//  6. SESSION SCHEMA SNAPSHOT
// ═══════════════════════════════════════════════════════════════
// When a host creates a session, we snapshot the preset they used into
// cupping_sessions.schema. This means guests and history rendering use
// the exact config the session was cupped with — even if the host later
// edits or deletes that preset.
//
// The snapshot fully resolves each active scale attribute (presentation,
// options, score range) so readers don't need access to the preset or
// even ALL_PARAMS to render correctly.

window.buildSessionSchema = function(preset) {
  if (!preset) return null;

  const scales = {};
  (preset.activeParams || []).forEach(attrId => {
    const catalog = window.ALL_PARAMS.find(p => p.id === attrId);
    if (!catalog || catalog.type !== 'scale') return;
    const r = window.resolveAttr(preset, attrId);
    scales[attrId] = {
      label:        r.label,
      presentation: r.presentation,
      options:      r.options,
      scoreMin:     r.scoreMin,
      scoreMax:     r.scoreMax,
      scoreStep:    r.scoreStep,
    };
  });

  return {
    presetId:     preset.id || null,
    presetName:   preset.name || '',
    activeParams: [...(preset.activeParams || [])],
    passes:       preset.passes || 1,
    wheel:        preset.wheel || null, // null = standard window.WHEEL
    scales:       scales,
  };
};

// Returns the list of scale attribute descriptors from a session schema,
// in ALL_PARAMS order. Each: { id, label, presentation, options, scoreMin, scoreMax, scoreStep }.
// Falls back to the global SCALE_FIELDS if the session has no schema
// (e.g. older sessions created before Phase 4C).
window.schemaScaleFields = function(schema) {
  if (schema && schema.scales) {
    return window.ALL_PARAMS
      .filter(p => p.type === 'scale' && schema.scales[p.id])
      .map(p => ({ id: p.id, ...schema.scales[p.id] }));
  }
  // Legacy fallback: global scale fields, all pills
  return window.SCALE_FIELDS.map(sf => ({
    id: sf.id, label: sf.label, presentation: 'pills',
    options: sf.options, scoreMin: 6, scoreMax: 10, scoreStep: 0.25,
  }));
};

// Normalises a stored scale value into { value, label } regardless of
// whether it's the new object shape or a legacy bare string/number.
//   { value: 8, label: 'Round' }  → unchanged
//   'Round'                        → { value: null, label: 'Round' }
//   8.5                            → { value: 8.5, label: null }
//   null/undefined                 → null
window.readScaleValue = function(raw) {
  if (raw == null) return null;
  if (typeof raw === 'object') {
    return { value: (raw.value ?? null), label: (raw.label ?? null) };
  }
  if (typeof raw === 'number') return { value: raw, label: null };
  return { value: null, label: String(raw) }; // legacy string
};


// ═══════════════════════════════════════════════════════════════
//  5. BACKWARDS-COMPAT (Phase 1/2/3 helpers)
// ═══════════════════════════════════════════════════════════════
// loadCuppingDefaults / saveCuppingDefaults present the OLD single-
// object shape to existing callers (cupping.html, account.html editor).
// Internally they read from / write to the user's default preset
// within the new multi-preset shape.

window.DEFAULT_CUPPING_DEFAULTS = {
  activeParams: ['flavours', 'notes'],
  passes:       1,
  wheel:        null,
  scales:       {},
};

function legacyScales(scales) {
  const out = {};
  if (!scales) return out;
  Object.entries(scales).forEach(([id, override]) => {
    if (Array.isArray(override.options) && override.options.length >= 2) {
      out[id] = override.options;
    }
  });
  return out;
}

window.loadCuppingDefaults = async function(userId) {
  const fallback = () => JSON.parse(JSON.stringify(window.DEFAULT_CUPPING_DEFAULTS));
  try {
    const presets = await window.loadPresets(userId);
    const active  = window.getActivePreset(presets);
    if (!active) return fallback();
    return {
      activeParams: active.activeParams || ['flavours','notes'],
      passes:       active.passes       || 1,
      wheel:        active.wheel        || null,
      scales:       legacyScales(active.scales),
    };
  } catch (e) {
    console.warn('[loadCuppingDefaults] falling back:', e.message);
    return fallback();
  }
};

window.saveCuppingDefaults = async function(userId, legacy) {
  if (!userId) return { ok: false, error: 'No user id' };

  try {
    const presets = await window.loadPresets(userId);
    let active    = window.getActivePreset(presets);

    if (!active || active.system) {
      const newId = 'user_' + Math.random().toString(36).slice(2, 10);
      active = {
        id:           newId,
        name:         'My setup',
        description:  '',
        system:       false,
        activeParams: legacy.activeParams || ['flavours','notes'],
        passes:       legacy.passes       || 1,
        wheel:        legacy.wheel        || null,
        scales:       {},
      };
      presets.presets.unshift(active);
      presets.default_id = newId;
    } else {
      active.activeParams = legacy.activeParams || active.activeParams;
      active.passes       = legacy.passes       ?? active.passes;
      active.wheel        = legacy.wheel        || null;
    }

    if (legacy.scales && typeof legacy.scales === 'object') {
      Object.entries(legacy.scales).forEach(([id, opts]) => {
        if (!Array.isArray(opts) || opts.length < 2) return;
        const existing = active.scales[id] || {};
        active.scales[id] = {
          presentation: existing.presentation || 'pills',
          options:      opts,
          scoreMin:     existing.scoreMin     ?? 6,
          scoreMax:     existing.scoreMax     ?? 10,
          scoreStep:    existing.scoreStep    ?? 0.25,
        };
      });
    }

    return await window.savePresets(userId, presets);
  } catch (e) {
    return { ok: false, error: e.message };
  }
};
