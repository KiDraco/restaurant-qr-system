const pdfParse = require('pdf-parse');

// Canonical menu categories: normalized header -> display label.
// Normalization = strip accents, uppercase, collapse whitespace.
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

const CATEGORY_BY_KEY = new Map(CATEGORIES.map((c) => [c.key, c.label]));

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
  /^N\.?\s*°?\s*\d+\b/, // edition markers ("N°1", "N 1")
  /^\d{1,2}$/, // page numbers
];

function normalize(line) {
  return line
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toUpperCase()
    .replace(/\s+/g, ' ')
    .trim();
}

function categoryLabelFor(norm) {
  return CATEGORY_BY_KEY.get(norm) || null;
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

// A line that continues the previous item's description rather than
// starting a new item: lowercase start, trailing period, very long,
// or list/bullet style. Only applies when a name is already pending.
function isDescriptionContinuation(line) {
  if (/^[(\-•·]/.test(line)) return true;
  if (line.length > 60) return true;
  if (line.endsWith('.')) return true;
  return /^[a-záéíóúñü]/.test(line);
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
  let skippedNoPrice = 0;
  let skippedExtraPrice = 0;
  let uncategorized = 0;

  let currentCategory = null;
  let names = []; // [{ name, description }]
  let prices = []; // [int]

  function flushSection() {
    const count = Math.min(names.length, prices.length);
    for (let i = 0; i < count; i++) {
      const entry = names[i];
      if (!entry.name || prices[i] <= 0) {
        skippedNoPrice++;
        continue;
      }
      rows.push({
        name: entry.name,
        description: entry.description,
        price: prices[i],
        category: currentCategory || 'General',
      });
      if (!currentCategory) uncategorized++;
    }
    if (names.length > prices.length) skippedNoPrice += names.length - prices.length;
    if (prices.length > names.length) skippedExtraPrice += prices.length - names.length;
    names = [];
    prices = [];
  }

  for (const line of lines) {
    const norm = normalize(line);

    const label = categoryLabelFor(norm);
    if (label) {
      flushSection();
      currentCategory = label;
      continue;
    }
    if (isNoise(norm)) continue;

    const standalone = parseStandalonePrice(line);
    if (standalone !== null) {
      prices.push(standalone);
      continue;
    }

    const inline = splitInlinePrice(line);
    if (inline) {
      names.push({ name: inline.name, description: '' });
      prices.push(inline.price);
      continue;
    }

    if (names.length > 0 && isDescriptionContinuation(line)) {
      const last = names[names.length - 1];
      last.description = last.description ? `${last.description} ${line}` : line;
      continue;
    }

    // Orphan lowercase/description-style line with no pending name: skip,
    // it cannot be reliably attached to an item.
    if (names.length === 0 && isDescriptionContinuation(line)) continue;

    names.push({ name: line, description: '' });
  }
  flushSection();

  if (skippedNoPrice > 0) warnings.push(`${skippedNoPrice} rows skipped: no price found`);
  if (skippedExtraPrice > 0) warnings.push(`${skippedExtraPrice} prices ignored: no matching item name`);
  if (uncategorized > 0) warnings.push(`${uncategorized} items have no category (assigned to "General")`);

  return { rows, warnings };
}

// PDF buffer -> { text, rows, warnings }. Throws on unreadable PDFs.
async function parsePdfBuffer(buffer) {
  const data = await pdfParse(buffer);
  const text = data.text || '';
  const { rows, warnings } = parseMenuText(text);
  return { text, rows, warnings };
}

module.exports = { parseMenuText, parsePdfBuffer, CATEGORIES };
