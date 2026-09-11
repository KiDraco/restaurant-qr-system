const fs = require('fs');
const path = require('path');
const { parsePdfBuffer } = require('../services/pdfParserJsDist.js');

// Real LACADÉ menu PDF. The pdf-parse text-only parser mapped only 52 rows
// from this file because pdf-parse emits disconnected name/price blocks.
// The Y-coordinate parser must map the whole menu with correct categories.
const PDF_FIXTURE = path.join(__dirname, 'BodegonAKD.pdf');

describe('pdfParserJsDist.parsePdfBuffer (real PDF)', () => {
  it('maps the full LACADÉ menu with priced, categorized rows', async () => {
    const buffer = fs.readFileSync(PDF_FIXTURE);
    const { rows, warnings, details } = await parsePdfBuffer(buffer);

    // The old parser produced 52; the layout-aware parser must produce the
    // full menu (>= 100 rows) with no ill-formed rows.
    expect(rows.length).toBeGreaterThanOrEqual(100);

    const bad = rows.filter((r) => !r.name || !r.category || !Number.isInteger(r.price) || r.price <= 0);
    expect(bad).toEqual([]);

    const byCat = {};
    for (const r of rows) byCat[r.category] = (byCat[r.category] || 0) + 1;

    // Categories that a two-column menu should keep separated.
    expect(byCat['Ensaladas']).toBeGreaterThanOrEqual(1);
    expect(byCat['Parrilla']).toBeGreaterThanOrEqual(1);
    expect(byCat['Vinos']).toBeGreaterThanOrEqual(1);
    expect(byCat['Menú Kids']).toBeGreaterThanOrEqual(1);

    // Kids flat price: every child item is $17500 (no price on its row).
    const kids = rows.filter((r) => r.category === 'Menú Kids');
    expect(kids.length).toBeGreaterThanOrEqual(1);
    for (const kid of kids) {
      expect(kid.price).toBe(17500);
    }

    // Category counts should not be absurd (text parser merged everything
    // under Ensaladas previously).
    expect(Object.keys(byCat).length).toBeGreaterThanOrEqual(12);

    // A skipped-name list is allowed only as a diagnostic, never a crash.
    expect(warnings).toBeInstanceOf(Array);
    expect(details).toBeInstanceOf(Array);
  });
});