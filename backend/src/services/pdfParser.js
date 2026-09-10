const pdfParse = require('pdf-parse');

// Canonical menu categories: spaceless-normalized header -> display label.
// Normalization = strip accents, uppercase, remove ALL whitespace, so
// letter-spaced PDF headers ("E N T R A D A S", "M E N Ú   K I D S") match.
const CATEGORIES = [
  { key: 'ENTRADAS', label: 'Entradas' },
  { key: 'MILANESAS', label: 'Milanesas' },
  { key: 'PASTAS', label: 'Pastas' },
  { key: 'SALSAS', label: 'Salsas' },
  { key: 'PRINCIPALES', label: 'Principales' },
  { key: 'TORTILLAS', label: 'Tortillas' },
  { key: 'PARRILLA', label: 'Parrilla' },
  { key: 'GUARNICIONES', label: 'Guarniciones' },
  { key: 'MENU KIDS', label: 'Menú Kids' },
  { key: 'ENSALADAS', label: 'Ensaladas' },
  { key: 'POSTRES', label: 'Postres' },
  { key: 'BEBIDAS', label: 'Bebidas' },
  { key: 'CERVEZAS', label: 'Cervezas' },
  { key: 'TRAGOS', label: 'Tragos' },
  { key: 'VINOS', label: 'Vinos' },
  { key: 'MERCHANDISING', label: 'Merchandising' },
];

const CATEGORY_BY_KEY = new Map();
for (const c of CATEGORIES) CATEGORY_BY_KEY.set(c.key.replace(/\s+/g, ''), c.label);
// Compound headers seen in the wild map to a canonical category.
CATEGORY_BY_KEY.set('ENTRADASPARRI', 'Entradas');

// Appended notes seen on restaurant category headers. Stripped BEFORE
// header lookup (accent/case/space-insensitive via the normalized +
// spaceless forms) so e.g. "MILANESAS CON PAPAS Y BATATAS FRITAS" splits
// as MILANESAS. A strip only applies when the remainder is EXACTLY a known
// category — never generic prefix matching, so an item like "Parrillada
// completa" can never become a PARRILLA header.
const HEADER_NOTE_SUFFIXES = [
  'TODAS SON PARA COMPARTIR',
  'CON PAPAS Y BATATAS FRITAS',
  'NO INCLUYE GUARNICION',
  'SUGERENCIAS DEL CHEF',
  'ELEGI A TU GUSTO',
];

// Word-level note phrases for fragment detection (normalized,
// accent-stripped, uppercase). A line whose words form a STRICT contiguous
// subsequence of one of these is a torn-off note fragment, never an item.
// Entries with an `anchor` only match when the line contains that word:
// bare "12 AÑOS" is a legit wine-age description, only "HASTA ... 12 AÑOS"
// residue is note noise.
const NOTE_PHRASES = [
  { words: ['TODAS', 'SON', 'PARA', 'COMPARTIR'], anchor: null },
  { words: ['CON', 'PAPAS', 'Y', 'BATATAS', 'FRITAS'], anchor: null },
  { words: ['NO', 'INCLUYE', 'GUARNICION'], anchor: null },
  { words: ['SUGERENCIAS', 'DEL', 'CHEF'], anchor: null },
  { words: ['ELEGI', 'A', 'TU', 'GUSTO'], anchor: null },
  { words: ['TODOS', 'LOS', 'PLATOS'], anchor: null },
  { words: ['HASTA', 'LOS', '12', 'ANOS'], anchor: 'HASTA' },
  { words: ['HASTA', '12', 'ANOS'], anchor: 'HASTA' },
];
// Wine subgroup labels: subcategories of VINOS, never items. When one is
// seen, following rows keep category "Vinos" with "[Subgroup]" prefixed to
// the description.
const WINE_SUBGROUPS = [
  { key: 'DELACASA', label: 'De la casa' },
  { key: 'ESCORIHUELAGASCON', label: 'Escorihuela Gascón' },
  { key: 'SALENTEIN', label: 'Salentein' },
  { key: 'CATENAZAPATA', label: 'Catena Zapata' },
  { key: 'CHAMPAGNES', label: 'Champagnes' },
];

const WINE_SUBGROUP_BY_KEY = new Map(WINE_SUBGROUPS.map((s) => [s.key, s.label]));

// Lines matching any of these (on the normalized form) are menu noise,
// never items: payment/promo/contact footers, portion headers, markers.
const NOISE_PATTERNS = [
  /^[\(\[]?\s*VEGGIE\s*[\)\]]?$/, // standalone VEGGIE marker
  /MEDIOS? DE PAGO/,
  /SERVICIO DE MESA/,
  /DESCUENTO/,
  /SOCIOS?/,
  /BODEGON/,
  /LACADE/,
  /INSTAGRAM/,
  /WHATSAPP/,
  /SEGUINOS/,
  /CONTACTO/,
  /\bTEL(EFONO)?\b/,
  /@/, // emails / social handles
  /\.COM\b/,
  /ESTA ES LA/,
  /TE SIGUE/,
  /TODAS PARTES/,
  /PROPINA/,
  /CUBIERTO/,
  /EFECTIVO/,
  /TARJETA/,
  /^PARA \d+ PERSONAS?$/, // portion headers ("Para 2 personas")
  /PARA COMPARTIR/, // share notes ("TODAS SON PARA COMPARTIR")
  /^CON PAPAS Y BATATAS FRITAS\.?$/, // section note (anchored: "Con batatas fritas." descriptions survive)
  /TU MESA/, // marketing ("¿TU MESA? DE LACADÉ...")
  /\b\d{4,}\s*[-\s]\s*\d{3,}\b/, // phone fragments ("112590-2215"); prices never contain dashes/spaces inside digits
  /^(VEGGIE|VEGANO?A?|VEGETARIANO?A?|SIN TACC|GLUTEN FREE|APTO CELIACO|CELIACO)$/, // lone diet markers
  /^N\.?\s*°?\s*\d+\b/, // edition markers ("N°1", "N 1")
  /^\d{1,2}$/, // page numbers
];

// A line stating one price for the whole section ("TODOS LOS PLATOS
// $17500" over the KIDS items): never an item, its price fans out to
// every name in the section (see flushSection). Compared spaceless so
// letter-spaced variants match too.
const FLAT_PRICE_SIGNAL = /TODOSLOSPLATOS|PRECIOUNICO|TODOALMISMOPRECIO/;

// Surcharge lines ("SERVICIO DE MESA"): a detached price on the very next
// line belongs to the surcharge, not to any item, so it is dropped together
// with the line instead of becoming an orphan price.
const SURCHARGE_NOISE = /SERVICIODEMESA|CUBIERTO|PROPINA|RECARGO/;

function normalize(line) {
  return line
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toUpperCase()
    .replace(/\s+/g, ' ')
    .trim();
}

function categoryLabelFor(norm) {
  return CATEGORY_BY_KEY.get(norm.replace(/\s+/g, '')) || null;
}

function wineSubgroupFor(norm) {
  return WINE_SUBGROUP_BY_KEY.get(norm.replace(/\s+/g, '')) || null;
}

// Suffixed header lookup: strip a known appended note, then exact-match
// the remainder. Compared spaceless so letter-spaced headers match too.
// Returns { label, flat } or null. `flat` marks kids single-price headers
// ("TODOS LOS PLATOS", optional price follows) whose price fans out.
// The remainder must be EXACTLY a known category — this is allowlist
// suffix-stripping, not prefix matching.
function suffixedHeaderLabelFor(norm) {
  const spaceless = norm.replace(/\s+/g, '');
  for (const note of HEADER_NOTE_SUFFIXES) {
    const noteSpaceless = note.replace(/\s+/g, '');
    const idx = spaceless.indexOf(noteSpaceless);
    if (idx > 0) {
      const label = CATEGORY_BY_KEY.get(spaceless.slice(0, idx));
      if (label) return { label, flat: false };
    }
  }
  // Kids single-price suffix: price may follow on the same line.
  {
    const idx = spaceless.indexOf('TODOSLOSPLATOS');
    if (idx > 0) {
      const label = CATEGORY_BY_KEY.get(spaceless.slice(0, idx));
      if (label) return { label, flat: true };
    }
  }
  // Kids age-limit suffix ("HASTA 12 AÑOS" / "HASTA LOS 12 AÑOS").
  {
    const m = /HASTA(?:LOS)?12ANOS/.exec(spaceless);
    if (m && m.index > 0) {
      const label = CATEGORY_BY_KEY.get(spaceless.slice(0, m.index));
      if (label) return { label, flat: false };
    }
  }
  return null;
}

// Torn-off note fragment: every word of the line appears as a STRICT
// contiguous run inside one known note phrase (e.g. "CON PAPAS Y" or
// "BATATAS FRITAS" inside "CON PAPAS Y BATATAS FRITAS"). Real descriptions
// carry lowercase letters or a terminal period ("Con batatas fritas.") and
// are exempt — only ALL-CAPS residue is fragment noise. Single words are
// exempt too (too risky: "Chef", "Soda" could be real items).
function isNoteFragment(line, norm) {
  if (/[a-záéíóúñü]/.test(line)) return false;
  if (line.trim().endsWith('.')) return false;
  const words = norm
    .replace(/[^A-Z0-9\s]/g, '')
    .split(/\s+/)
    .filter(Boolean);
  if (words.length < 2) return false;
  return NOTE_PHRASES.some(({ words: phrase, anchor }) => {
    if (words.length >= phrase.length) return false;
    if (anchor && !words.includes(anchor)) return false;
    for (let i = 0; i + words.length <= phrase.length; i++) {
      let ok = true;
      for (let j = 0; j < words.length; j++) {
        if (phrase[i + j] !== words[j]) {
          ok = false;
          break;
        }
      }
      if (ok) return true;
    }
    return false;
  });
}

// Strip trailing diet-icon residue and stray symbols from item names.
// Keeps meaningful suffixes like "(600gr)"; removes "(V)" markers and
// trailing runs of symbols left by icon fonts.
function cleanName(name) {
  return String(name)
    .replace(/\s+/g, ' ')
    .replace(/\s*\([A-Za-z]\)$/, '')
    .replace(/[^\p{L}\p{N}()[\]"'.:,+&-]+$/u, '')
    .trim();
}

function isNoise(norm) {
  if (norm.length < 2) return true;
  if (/^[^A-Z0-9]+$/.test(norm)) return true; // symbols only
  return NOISE_PATTERNS.some((re) => re.test(norm));
}

// Standalone price line: "$4000", "$ 13.500", "13500".
// With "$" accept 3-6 digits; bare numbers need 4-6 digits so stray
// page/footnote numbers are not mistaken for prices.
// Returns the integer price in ARS, or null.
function parseStandalonePrice(line) {
  const compact = line.replace(/[\s.,]/g, '');
  const withSign = /^\$(\d{3,6})$/.exec(compact);
  if (withSign) {
    const value = parseInt(withSign[1], 10);
    return value > 0 ? value : null;
  }
  // Bare numbers: reject anything carrying letters or unit/edition marks
  // ("600gr", "1.75L", "700cc", "12 AÑOS", "N°1") so only pure 4-6 digit
  // amounts qualify as detached prices.
  if (/[\p{L}°º]/u.test(line)) return null;
  if (/^\d{4,6}$/.test(compact)) {
    const value = parseInt(compact, 10);
    return value > 0 ? value : null;
  }
  return null;
}

// Inline "Name $NNNN" line. Returns { name, price } or null.
function splitInlinePrice(line) {
  const m = /^(.*?)\s+\$\s?([\d.,]{3,8})\s*$/.exec(line);
  if (!m || !m[1].trim()) return null;
  const value = parseInt(m[2].replace(/[.,]/g, ''), 10);
  if (!Number.isFinite(value) || value <= 0) return null;
  if (String(value).length < 3 || String(value).length > 6) return null;
  return { name: m[1].trim(), price: value };
}

function isDescriptionLikeName(name) {
  const norm = normalize(name).replace(/[^A-Z0-9\s]/g, '');
  const firstWord = norm.split(/\s+/)[0];
  const DESCRIPTION_STARTERS = ['CON', 'DE', 'Y', 'SIN', 'PARA'];
  if (DESCRIPTION_STARTERS.some(s => norm.startsWith(s + ' ') || norm === s)) return true;
  if (firstWord && /^[a-záéíóúñü]/.test(firstWord)) return true;
  // Digit-starting or unit-marker lines are descriptions, not dish names
  if (/^\d/.test(firstWord)) return true;
  return false;
}

// A line that continues the previous item's description rather than
// starting a new item. Strong signals (lowercase start, trailing period,
// very long, list/bullet style) always attach to a pending name. A short
// uppercase line without period (e.g. "Con batatas fritas") is only a
// continuation when the previous name is still unmatched AND there are
// already prices in the section (interleaved format). In block format
// (no prices yet), all uppercase lines are treated as names.
function isDescriptionContinuation(line, { unmatched, nextIsPrice, priceCount }) {
  if (/^[(\-•·]/.test(line)) return true;
  if (line.length > 60) return true;
  if (line.endsWith('.')) return true;
  if (/^[a-záéíóúñü]/.test(line)) return true;
  if (line.length <= 60 && unmatched && priceCount > 0 && !nextIsPrice) return true;
  return false;
}

// Pure text -> rows heuristic. Deterministic, no I/O: unit-test this.
// Layout assumption (matches real menus like LACADÉ): within a category
// section, item names come as their own lines and prices as detached
// "$NNNN" lines, so names and prices are aligned sequentially per section.
function parseMenuText(text) {
  const lines = String(text || '')
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter((l) => l.length > 0);

  const rows = [];
  const warnings = [];
  const details = [];
  let skippedNoPrice = 0;
  let skippedExtraPrice = 0;
  let uncategorized = 0;
  const noPriceNames = [];
  const orphanEntries = []; // [{ prices, category }]

  let currentCategory = null;
  let sawHeader = false; // any category/subgroup header seen yet
  let headerlessRows = []; // inline rows emitted before the first header
  let sectionFlatPrice = false; // single-price-for-all signal seen in section
  let wineSubgroup = null;
  let names = []; // [{ name, description }]
  let prices = []; // [int]

  function withSubgroup(description) {
    if (!wineSubgroup) return description;
    const prefix = `[${wineSubgroup}]`;
    return description ? `${prefix} ${description}` : prefix;
  }

  // First header below leading content adopts it: headerless inline rows
  // are re-categorized and detached buffers are kept (not flushed) so they
  // pair under the new category instead of "General".
  function adoptFirstHeader(label) {
    for (const row of headerlessRows) row.category = label;
    uncategorized -= headerlessRows.length;
    headerlessRows = [];
    currentCategory = label;
    sawHeader = true;
    wineSubgroup = null;
  }

  function flushSection() {
    const cat = currentCategory || 'General';
    // Merge description-like names into previous names when there
    // are more names than prices (e.g. block format where a name
    // like "Con batatas fritas" follows its item "Milanesa clásica").
    if (names.length > prices.length) {
      let i = 0;
      while (i < names.length && names.length > prices.length) {
        if (i + 1 < names.length && isDescriptionLikeName(names[i + 1].name)) {
          names[i].description = names[i].description
            ? `${names[i].description} ${names[i + 1].name}`
            : names[i + 1].name;
          names.splice(i + 1, 1);
        } else {
          i++;
        }
      }
    }
    // Single-price-for-all section (KIDS "TODOS LOS PLATOS $17500"):
    // exactly 1 price fans out to every name instead of zipping 1:1.
    const flatAll =
      (cat === 'Menú Kids' || sectionFlatPrice) && prices.length === 1 && names.length > 1;
    const count = flatAll ? names.length : Math.min(names.length, prices.length);
    for (let i = 0; i < count; i++) {
      const entry = names[i];
      const price = flatAll ? prices[0] : prices[i];
      if (!entry.name || !(price > 0)) {
        skippedNoPrice++;
        noPriceNames.push(entry.name || '(empty)');
        continue;
      }
      rows.push({
        name: entry.name,
        description: withSubgroup(entry.description),
        price,
        category: cat,
      });
      if (!currentCategory) uncategorized++;
    }
    if (!flatAll) {
      if (names.length > prices.length) {
        skippedNoPrice += names.length - prices.length;
        for (let i = prices.length; i < names.length; i++) noPriceNames.push(names[i].name);
      }
      if (prices.length > names.length) {
        skippedExtraPrice += prices.length - names.length;
        orphanEntries.push({ prices: prices.slice(names.length), category: cat });
      }
    }
    names = [];
    prices = [];
    sectionFlatPrice = false;
  }

  function nextIsPrice(idx) {
    const next = lines[idx + 1];
    if (next === undefined) return false;
    return parseStandalonePrice(next) !== null || splitInlinePrice(next) !== null;
  }

  for (let idx = 0; idx < lines.length; idx++) {
    const line = lines[idx];
    const norm = normalize(line);
    const spaceless = norm.replace(/\s+/g, '');

    const label = categoryLabelFor(norm);
    if (label) {
      if (sawHeader) { flushSection(); currentCategory = label; wineSubgroup = null; }
      else { adoptFirstHeader(label); }
      continue;
    }
    const suffixed = suffixedHeaderLabelFor(norm);
    if (suffixed) {
      if (sawHeader) { flushSection(); currentCategory = suffixed.label; wineSubgroup = null; }
      else { adoptFirstHeader(suffixed.label); }
      if (suffixed.flat || suffixed.label === 'Menú Kids') {
        const pm = /\$\s*([\d.,]{3,8})/.exec(line);
        if (pm) { const value = parseInt(pm[1].replace(/[.,]/g, ''), 10); if (Number.isFinite(value) && value > 0 && String(value).length >= 3 && String(value).length <= 6) { prices.push(value); sectionFlatPrice = true; } }
      }
      continue;
    }
    const subgroup = wineSubgroupFor(norm);
    if (subgroup) {
      if (sawHeader) {
        flushSection();
        currentCategory = 'Vinos';
      } else {
        adoptFirstHeader('Vinos');
      }
      wineSubgroup = subgroup;
      continue;
    }
    if (isNoteFragment(line, norm)) continue;
    if (isNoise(norm)) {
      // A detached price glued to a surcharge line is the surcharge's own
      // amount: drop it with the line so it never becomes an orphan.
      if (SURCHARGE_NOISE.test(spaceless)) {
        const nxt = lines[idx + 1];
        if (nxt !== undefined && parseStandalonePrice(nxt) !== null) idx++;
      }
      continue;
    }

    // Single-price-for-all section ("TODOS LOS PLATOS $17500"):
    // price fans out to every name in the section instead of zipping 1:1.
    if (FLAT_PRICE_SIGNAL.test(spaceless)) {
      const found = CATEGORIES.find((c) => spaceless.includes(c.key.replace(/\s+/g, '')));
      if (found && found.label !== currentCategory) {
        if (sawHeader) { flushSection(); currentCategory = found.label; wineSubgroup = null; }
        else { adoptFirstHeader(found.label); }
      }
      const pm = /\$\s*([\d.,]{3,8})/.exec(line);
      if (pm) {
        const value = parseInt(pm[1].replace(/[.,]/g, ''), 10);
        if (Number.isFinite(value) && value > 0 && String(value).length >= 3 && String(value).length <= 6) {
          prices.push(value);
        }
      }
      sectionFlatPrice = true;
      continue;
    }

    const standalone = parseStandalonePrice(line);
    if (standalone !== null) {
      prices.push(standalone);
      continue;
    }

    const inline = splitInlinePrice(line);
    if (inline) {
      // Same-line "name ... $price" pairs are emitted immediately so their
      // price can never be stolen by (or steal from) detached names.
      const name = cleanName(inline.name);
      if (name) {
        const row = {
          name,
          description: withSubgroup(''),
          price: inline.price,
          category: currentCategory || 'General',
        };
        rows.push(row);
        if (!currentCategory) {
          uncategorized++;
          headerlessRows.push(row);
        }
      } else {
        skippedNoPrice++;
        noPriceNames.push(inline.name || '(empty)');
      }
      continue;
    }

    // Under a single-price-for-all fan-out every name already has its price,
    // so nothing is "waiting" and later names must not collapse into
    // descriptions of the previous item.
    const fanOut = (currentCategory === 'Menú Kids' || sectionFlatPrice) && prices.length > 0;
    const ctx = { unmatched: names.length > prices.length && !fanOut, nextIsPrice: nextIsPrice(idx), priceCount: prices.length };
    if (names.length > 0 && isDescriptionContinuation(line, ctx)) {
      const last = names[names.length - 1];
      last.description = last.description ? `${last.description} ${line}` : line;
      continue;
    }

    // Orphan lowercase/description-style line with no pending name: skip,
    // it cannot be reliably attached to an item.
    if (names.length === 0 && isDescriptionContinuation(line, ctx)) continue;

    names.push({ name: cleanName(line), description: '' });
  }
  flushSection();

  if (skippedNoPrice > 0) warnings.push(`${skippedNoPrice} rows skipped: no price found`);
  if (skippedExtraPrice > 0) warnings.push(`${skippedExtraPrice} prices ignored: no matching item name`);
  if (uncategorized > 0) warnings.push(`${uncategorized} items have no category (assigned to "General")`);

  // Actionable details: same facts as the string summaries above, but with
  // the actual values so the importer can show what needs fixing. The
  // `warnings` strings stay untouched for backward compatibility.
  if (noPriceNames.length > 0) details.push({ type: 'no_price', names: noPriceNames });
  for (const entry of orphanEntries) {
    details.push({ type: 'orphan_price', prices: entry.prices, category: entry.category });
  }
  const generalNames = rows.filter((r) => r.category === 'General').map((r) => r.name);
  if (generalNames.length > 0) details.push({ type: 'no_category', names: generalNames });

  return { rows, warnings, details };
}

// PDF buffer -> { text, rows, warnings, details }. Throws on unreadable PDFs.
async function parsePdfBuffer(buffer) {
  const data = await pdfParse(buffer);
  const text = data.text || '';
  const { rows, warnings, details } = parseMenuText(text);
  return { text, rows, warnings, details };
}

module.exports = { parseMenuText, parsePdfBuffer, CATEGORIES };
