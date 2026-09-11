// PDF parser using pdfjs-dist with Y-coordinate row grouping.
//
// WHY this exists: pdf-parse extracts text in a non-visual order for
// multi-column/designed menus (LACADÉ), producing disconnected name and
// price blocks. pdfjs-dist exposes each text item's Y position, so items
// and their prices can be matched by ROW (same visual line), and section
// headers can be recognized by joining letter-spaced fragments at the
// same Y coordinate.
//
// Reading order: pdfjs Y increases upward (origin bottom-left), so rows
// are sorted Y DESCENDING to read the page top-down.
//
// API contract mirrors backend/src/services/pdfParser.js:
//   parsePdfBuffer(buffer) -> Promise<{ rows, warnings, details }>
//   rows: [{ name, description, price, category }]

const pdfjs = require('pdfjs-dist/legacy/build/pdf.mjs');

// Canonical menu categories: spaceless-normalized header -> display label.
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
CATEGORY_BY_KEY.set('ENTRADASPARRI', 'Entradas');

const WINE_SUBGROUPS = [
  { key: 'DELACASA', label: 'De la casa' },
  { key: 'ESCORIHUELAGASCON', label: 'Escorihuela Gascón' },
  { key: 'SALENTEIN', label: 'Salentein' },
  { key: 'CATENAZAPATA', label: 'Catena Zapata' },
  { key: 'CHAMPAGNES', label: 'Champagnes' },
];
const WINE_SUBGROUP_BY_KEY = new Map(WINE_SUBGROUPS.map((s) => [s.key, s.label]));

// Rows joined-clean enough to be a category header or note.
const HEADER_NOTE_PATTERNS = [
  /TODAS SON PARA COMPARTIR/,
  /CON PAPAS Y BATATAS FRITAS/,
  /NO INCLUYE GUARNICION/,
  /SUGERENCIAS DEL CHEF/,
  /ELEGI A TU GUSTO/,
];

const FLAT_PRICE_SIGNAL = /TODOSLOSPLATOS|TODOSLOSEPLATOS|PRECIOUNICO|TODOALMISMOPRECIO/;

// Row noise (normalized spaceless): markers, footers, portion headers.
const NOISE_PATTERNS = [
  /^VEGGIE$/,
  /MEDIOS?DE PAGO/,
  /SERVICIODEMESA/,
  /DESCUENTO/,
  /SOCIOS?/,
  /BODEGON/,
  /LACADE/,
  /INSTAGRAM/,
  /WHATSAPP/,
  /SEGUINOS/,
  /CONTACTO/,
  /TEL(EFONO)?/,
  /\.COM/,
  /ESTAESLA/,
  /TESIGUE/,
  /TODASPARTES/,
  /PROPINA/,
  /CUBIERTO/,
  /EFECTIVO/,
  /TARJETA/,
  /^PARA\d+PERSONAS?$/,
  /PARACOMPARTIR/,
  /^CONPAPASY BATATASFRITAS\.?$/,
  /^TU MESA/,
  /^MENU$/,
  /^N\.?\d+/,
  /^\d{1,2}$/,
  /^MUCHACHOS/,
  /^OFRECEMOS/,
  /^SUGERENCIAS/,
  /^ELEG[IÍ]/,
  /^NO INCLUYE/,
];

// Fold a row's text into one line. In pdfjs, letter-spaced headers come as
// separate text items at the same Y ("E N", "T", "R", ...). Removing ALL
// whitespace yields "ENTRADAS".
function normalizedTextOf(parts) {
  return parts
    .join('')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toUpperCase()
    .replace(/\s+/g, '');
}

// Known note suffixes appended to a section header.
const HEADER_NOTES = [
  'TODASSONPARACOMPARTIR',
  'CONPAPASYBATATASFRITAS',
  'CONPAPASY',
  'CONPAPAS',
  'BATATASFRITAS',
  'NOINCLUYEGUARNICION',
  'SUGERENCIASDELCHEF',
  'ELEGIATUGUSTO',
  'PARACOMPARTIR',
  'DELCHEF',
  'TODOSLOSPLATOS',
  'HASTALOS12ANOS',
  'HASTA12ANOS',
];

function categoryLabelForSpaceless(spaceless) {
  // Exact match or known compound header.
  if (CATEGORY_BY_KEY.has(spaceless)) return CATEGORY_BY_KEY.get(spaceless);
  // Known note suffixes appended to a header.
  for (const note of HEADER_NOTES) {
    if (spaceless.length > note.length && spaceless.endsWith(note)) {
      const base = spaceless.slice(0, spaceless.length - note.length);
      if (CATEGORY_BY_KEY.has(base)) return CATEGORY_BY_KEY.get(base);
    }
  }
  // Header whose note fragment sits on a SEPARATE visual row/column while the
  // category word itself begins the row text ("MILANESAS CON PAPAS Y" pieces).
  for (const note of HEADER_NOTES) {
    if (spaceless.startsWith(note) && note.length > 4) {
      return null; // pure note fragment → treated as noise by caller
    }
  }
  return null;
}

function categoryLabelFor(norm) {
  return categoryLabelForSpaceless(norm);
}

function wineSubgroupFor(norm) {
  if (WINE_SUBGROUP_BY_KEY.has(norm)) return WINE_SUBGROUP_BY_KEY.get(norm);
  return null;
}

// Clean a name: strip trailing icon residue / markers.
function cleanName(name) {
  return String(name)
    .replace(/\s+/g, ' ')
    .replace(/\s*\([A-Za-z]\)$/, '')
    // Slogan/letter-spaced decoration fragments glued to a row.
    .replace(/\s*M\s*U\s*C\s*H\s*A\s*C\s*H\s*O\s*S\s*\.*\s*$/i, '')
    .replace(/[^\p{L}\p{N}()[\]"'.:,+&-]+$/u, '')
    .trim();
}

// Extract the first $NNNN price from a row's joined text. Returns int or null.
function extractRowPrice(text) {
  const m = /\$\s*([\d.,]{3,8})/.exec(text);
  if (!m) return null;
  const value = parseInt(m[1].replace(/[.,]/g, ''), 10);
  if (!Number.isFinite(value) || value <= 0) return null;
  if (String(value).length < 3 || String(value).length > 6) return null;
  return value;
}

// True when a row is a portion/noise/note line rather than a menu item.
function isRowNoise(spaceless) {
  if (spaceless.length < 2) return true;
  if (/^[^A-Z0-9]+$/.test(spaceless)) return true;
  if (HEADER_NOTES.some((n) => n.length > 4 && spaceless.startsWith(n))) return true;
  return NOISE_PATTERNS.some((re) => re.test(spaceless));
}

// True when the row continues the previous item's description (no price,
// prose-like or starts with a preposition / lowercase).
function isDescriptionRow(text) {
  const t = text.trim();
  if (/^[(\-•·&]/.test(t)) return true;
  if (t.length > 60) return true;
  if (t.endsWith('.') || t.endsWith(',')) return true;
  if (/^[a-záéíóúñü]/.test(t)) return true;
  if (/^(CON|DE|Y|SIN|PARA|AL|DEL|A)\b/.test(t.toUpperCase())) return true;
  // Capitalized fragment with a trailing prep/conjunction or "de/el" tail —
  // "Rellena de morrón,", "Verdes, palta, huevo,", "Whisky escocés, almíbar de"
  if (/,\s*$/.test(t)) return true;
  if (/\b(de|del|al|con|sin|y|para|en|a)\s*$/.test(t.toLowerCase())) return true;
  // Multi-word prose starting uppercase with no price: "Vodka, óleo de naranja y lima"
  const words = t.split(/\s+/).filter(Boolean).length;
  if (words >= 4) return true;
  return false;
}

// ── Core ──

// Group a page's text items into visual rows by Y proximity, top-down.
function buildRows(textItems) {
  const items = textItems
    .map((it) => ({ y: Math.round(it.transform[5]), str: it.str.trim() }))
    .filter((it) => it.str.length > 0);

  // Sort top-down: pdfjs Y increases upward, so descending Y = page top first.
  items.sort((a, b) => b.y - a.y);

  const rows = []; // [{ y, parts: [str], text }]
  const Y_GAP = 18;
  for (const item of items) {
    const last = rows[rows.length - 1];
    if (last && Math.abs(last.y - item.y) <= Y_GAP) {
      last.parts.push(item.str);
    } else {
      rows.push({ y: item.y, parts: [item.str] });
    }
  }

  // Join parts into one text; keep original joined order.
  for (const row of rows) {
    row.text = row.parts.join(' ');
  }
  return rows;
}

// Parse one page's rows into { rows, wineSubgroup tracking }.
function parsePageRows(rows) {
  const out = [];
  let currentCategory = null;
  let flatPrice = null; // active flat price for the current section
  let pendingFlat = null; // flat price seen in a subtitle row, applied to next header section
  let currentWine = null;
  let sawHeader = false;

  // Active section buffer: items collected since the last header.
  const sectionItems = []; // [{ name, description, price, hasPrice }]
  let sectionCategory = null;
  let sectionFlat = false;
  let lastItem = null; // for description attachment (preceding item in this section)

  const flushSection = () => {
    if (!sectionCategory || sectionItems.length === 0) return;
    for (const item of sectionItems) {
      out.push({ ...item, category: sectionCategory });
    }
    sectionItems.length = 0;
  };

  const appendItem = (item) => {
    const prev = sectionItems[sectionItems.length - 1];
    if (prev && prev.description === '' && !prev.hasPrice && !item.hasPrice) {
      // Row without price right after an item without price: description.
      prev.description = item.name;
      return;
    }
    if (prev && item.description && !prev.hasPrice) {
      prev.description = prev.description
        ? `${prev.description} ${item.description}`
        : item.description;
      return;
    }
    sectionItems.push(item);
    lastItem = item;
  };

  for (const row of rows) {
    const spaceless = normalizedTextOf(row.parts);
    const text = row.text.trim();

    // 1. Section header (exact or suffixed)?
    const label = categoryLabelFor(spaceless);
    if (label) {
      flushSection();
      sectionCategory = label;
      sectionFlat = false;
      sectionItems.length = 0;
      lastItem = null;
      currentWine = null; // category header always clears wine subgroup
      // A pending subtitle flat price applies to this section.
      if (pendingFlat) {
        sectionFlat = true;
        flatPrice = pendingFlat;
        pendingFlat = null;
      }
      sawHeader = true;
      continue;
    }

    // 2. Wine subgroup header?
    const subgroup = wineSubgroupFor(spaceless);
    if (subgroup) {
      if (sectionCategory !== 'Vinos') {
        flushSection();
        sectionCategory = 'Vinos';
        sectionItems.length = 0;
      }
      currentWine = subgroup;
      continue;
    }

    // 3. Flat-price subtitle ("TODOS LOS PLATOS $17500"). In top-down Y
    //    reading order this row comes AFTER the section header it belongs to
    //    (header at higher Y, subtitle just below, items under it), so it
    //    applies to the CURRENT open section; keep a pending copy for the
    //    rare case a subtitle precedes its header.
    if (FLAT_PRICE_SIGNAL.test(spaceless)) {
      const price = extractRowPrice(text);
      if (price) {
        if (sectionCategory) {
          sectionFlat = true;
          flatPrice = price;
        } else {
          pendingFlat = price;
        }
      }
      continue;
    }

    // 4. Noise / metadata row.
    if (isRowNoise(spaceless)) continue;

    // 5. Extract inline price from the row text.
    const rowPrice = extractRowPrice(text);
    const nameText = rowPrice !== null ? text.replace(/\$\s*[\d.,]{3,8}/, '') : text;
    // VEGGIE is a dietary marker in the same visual row, not part of the name.
    const cleaned = cleanName(nameText).replace(/\bVEGGIE\b/g, '').replace(/\s{2,}/g, ' ').trim();

    if (!cleaned) continue;

    // 6. Description-only row (no price, prose-like): attach to previous item.
    //    In a flat-price section, however, an un-priced row IS an item (the
    //    section price applies below), not a description.
    if (rowPrice === null && !(sectionFlat && flatPrice) && isDescriptionRow(text)) {
      const prev = sectionItems[sectionItems.length - 1];
      if (prev) {
        prev.description = prev.description ? `${prev.description} ${text}` : text;
      }
      continue;
    }

    // 7. Regular item. Price comes from the row, the section flat price,
    //    or nothing (later reported as skipped).
    const price =
      rowPrice !== null ? rowPrice : sectionFlat && flatPrice ? flatPrice : 0;
    const description = currentWine ? (currentWine) : '';
    appendItem({ name: cleaned, description, price, hasPrice: price > 0 });
  }

  flushSection();
  return out;
}

// ── Public API ──

// PDF buffer -> { rows, warnings, details }. Throws on unreadable PDFs.
async function parsePdfBuffer(buffer) {
  // pdfjs rejects Buffer (even though Buffer extends Uint8Array) and requires a
  // plain Uint8Array; copying always is the safe path for both buffer types.
  const pdfData = new Uint8Array(buffer);
  const pdf = await pdfjs.getDocument({ data: pdfData }).promise;

  const allRows = [];
  let skippedNoPrice = 0;

  for (let p = 1; p <= pdf.numPages; p++) {
    const page = await pdf.getPage(p);
    const textContent = await page.getTextContent();
    const rows = buildRows(textContent.items);
    const pageRows = parsePageRows(rows);
    for (const r of pageRows) {
      if (r.price === 0) {
        skippedNoPrice++;
        allRows.push({ name: r.name, description: r.description, price: 0, category: r.category });
      } else {
        allRows.push({ name: r.name, description: r.description, price: r.price, category: r.category });
      }
    }
  }

  const warnings = [];
  const details = [];
  if (skippedNoPrice > 0) {
    warnings.push(`${skippedNoPrice} rows skipped: no price found`);
    details.push({ type: 'no_price', names: allRows.filter((r) => r.price === 0).map((r) => r.name) });
  }
  // Remove zero-price rows from the result: they are incomplete items.
  const rows = allRows.filter((r) => r.price > 0);

  return { rows, warnings, details };
}

module.exports = { parsePdfBuffer };