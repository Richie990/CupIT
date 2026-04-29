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
                          Used by cupping.html and join.html for the
                          flavour picker, and by history.html when
                          rendering past selections.
    window.ALL_PARAMS     Every field a cupper can capture — the
                          master list of sensory params.
    window.SCALE_FIELDS   Derived from ALL_PARAMS: just the scale-type
                          fields (Body, Dry/Wet Aroma, Aftertaste).
                          Used by join.html and history.html.

  TO ADD A NEW SCALE FIELD:
    Append to ALL_PARAMS with type:'scale' and an options array.
    SCALE_FIELDS picks it up automatically.

  TO ADD A NEW FLAVOUR FAMILY:
    Push a new object into WHEEL with id, emoji, name, specifics.

  TO ADD A NEW FLAVOUR TO AN EXISTING FAMILY:
    Push the string into the relevant family's specifics array.
  ═══════════════════════════════════════════════════════════════
*/

// ── FLAVOUR WHEEL ──
// Used by the picker on cupping.html and join.html.
// id        : stable key used for filtering open/closed state
// emoji     : shown in the family pill
// name      : display label
// specifics : flavour chips revealed when the family is expanded
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
// Master list of every field a cupper can capture.
// type controls how the field is rendered in cupping.html's buildPanelFields():
//   text     → plain text input
//   select   → dropdown (options array required)
//   flavours → the interactive flavour wheel picker
//   textarea → multi-line free text
//   scale    → qualitative pill selector (options array required)
window.ALL_PARAMS = [
  // ── Default ON ──
  { id:'flavours',  label:'Flavour Notes', type:'flavours' },
  { id:'notes',     label:'Tasting Notes', type:'textarea', placeholder:'Free-form impressions...' },
  // ── Default OFF ──
  { id:'body',      label:'Body',          type:'scale',    options:['None','Light','Round','Full','Syrupy'] },
  { id:'dry_aroma', label:'Dry Aroma',     type:'scale',    options:['Faint','Delicate','Moderate','Intense','Complex'] },
  { id:'wet_aroma', label:'Wet Aroma',     type:'scale',    options:['Faint','Delicate','Moderate','Intense','Complex'] },
  { id:'aftertaste',label:'Aftertaste',    type:'scale',    options:['Short','Medium','Long','Lingering'] },
];

// ── SCALE FIELDS (derived) ──
// Just the scale-type params, in the form join.html and history.html
// expect: { id, label, options }. Derived from ALL_PARAMS so adding a
// new scale field automatically propagates.
window.SCALE_FIELDS = window.ALL_PARAMS
  .filter(p => p.type === 'scale')
  .map(p => ({ id: p.id, label: p.label, options: p.options }));
