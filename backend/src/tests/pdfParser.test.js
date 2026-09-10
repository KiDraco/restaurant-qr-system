const { parseMenuText } = require('../services/pdfParser');

const SAMPLE_MENU = `ENTRADAS
Empanada de carne
$4000
Provoleta
Rellena de morrón, panceta & pesto.
$13500
MEDIOS DE PAGO
Efectivo y tarjetas
MILANESAS
Milanesa clásica
Con batatas fritas.
$33500
ENSALADAS
Ensalada veggie
VEGGIE
$4000
Para 2 personas
MENÚ KIDS
Nuggets con papas
$4000
BODEGON.LACADE
ESTA ES LA N°1 QUE TE SIGUE A TODAS PARTES`;

describe('pdfParser.parseMenuText', () => {
  it('aligns names with detached prices per category and skips noise', () => {
    const { rows, warnings } = parseMenuText(SAMPLE_MENU);

    expect(rows).toEqual([
      { name: 'Empanada de carne', description: '', price: 4000, category: 'Entradas' },
      { name: 'Provoleta', description: 'Rellena de morrón, panceta & pesto.', price: 13500, category: 'Entradas' },
      { name: 'Milanesa clásica', description: 'Con batatas fritas.', price: 33500, category: 'Milanesas' },
      { name: 'Ensalada veggie', description: '', price: 4000, category: 'Ensaladas' },
      { name: 'Nuggets con papas', description: '', price: 4000, category: 'Menú Kids' },
    ]);
    expect(Array.isArray(warnings)).toBe(true);
  });

  it('drops names without prices and never invents prices', () => {
    const { rows, warnings } = parseMenuText('POSTRES\nFlan casero\nHelado\n$4000');

    expect(rows).toEqual([
      { name: 'Flan casero', description: '', price: 4000, category: 'Postres' },
    ]);
    expect(warnings.join(' ')).toMatch(/no price found/);
  });

  it('handles accent-less category variants, inline prices and thousand separators', () => {
    const { rows } = parseMenuText('MENU KIDS\nNuggets $4500\nPARRILLA\nBife de chorizo\n$13.500');

    expect(rows).toEqual([
      { name: 'Nuggets', description: '', price: 4500, category: 'Menú Kids' },
      { name: 'Bife de chorizo', description: '', price: 13500, category: 'Parrilla' },
    ]);
  });

  it('returns no rows for noise-only text', () => {
    const { rows } = parseMenuText('MEDIOS DE PAGO\nSERVICIO DE MESA\nPara 2 personas\nN°1');

    expect(rows).toEqual([]);
  });

  it('matches letter-spaced headers and the ENTRADAS PARRI alias', () => {
    const text = `E N T R A D A S
Empanada de carne
$4000
E N T R A D A S   P A R R I
Provoleta
$13500
M E N Ú   K I D S
Nuggets con papas
$4500`;

    const { rows } = parseMenuText(text);

    expect(rows).toEqual([
      { name: 'Empanada de carne', description: '', price: 4000, category: 'Entradas' },
      { name: 'Provoleta', description: '', price: 13500, category: 'Entradas' },
      { name: 'Nuggets con papas', description: '', price: 4500, category: 'Menú Kids' },
    ]);
  });

  it('zips detached name and price blocks without crossing sections', () => {
    const text = `T O R T I L L A S
Tortilla de papa
Tortilla rellena
$4000
$13500
P A R R I L L A
Bife de chorizo (600gr)
$13500`;

    const { rows, warnings } = parseMenuText(text);

    expect(rows).toEqual([
      { name: 'Tortilla de papa', description: '', price: 4000, category: 'Tortillas' },
      { name: 'Tortilla rellena', description: '', price: 13500, category: 'Tortillas' },
      { name: 'Bife de chorizo (600gr)', description: '', price: 13500, category: 'Parrilla' },
    ]);
    expect(warnings).toEqual([]);
  });

  it('keeps wine subgroups as VINOS with description prefix, never items', () => {
    const text = `V I N O S
DE LA CASA
Tinto de la casa
$4000
ESCORIHUELA GASCÓN
Malbec reserva
Con notas de frutos rojos.
$13500
CHAMPAGNES
Extra brut
$13500`;

    const { rows } = parseMenuText(text);

    expect(rows).toEqual([
      { name: 'Tinto de la casa', description: '[De la casa]', price: 4000, category: 'Vinos' },
      { name: 'Malbec reserva', description: '[Escorihuela Gascón] Con notas de frutos rojos.', price: 13500, category: 'Vinos' },
      { name: 'Extra brut', description: '[Champagnes]', price: 13500, category: 'Vinos' },
    ]);
  });

  it('attaches uppercase continuations without period and drops portion/noise lines', () => {
    const text = `MILANESAS
Milanesa clásica
Con batatas fritas
Milanesa napolitana
$33500
$34000
Para 2 personas
TODAS SON PARA COMPARTIR
CON PAPAS Y BATATAS FRITAS
MEDIOS DE PAGO
BODEGON.LACADE 112590-2215
¿TU MESA? DE LACADÉ
ESTA ES LA N°1 QUE TE SIGUE A TODAS PARTES
DESCUENTO PARA SOCIOS`;

    const { rows } = parseMenuText(text);

    expect(rows).toEqual([
      { name: 'Milanesa clásica', description: 'Con batatas fritas', price: 33500, category: 'Milanesas' },
      { name: 'Milanesa napolitana', description: '', price: 34000, category: 'Milanesas' },
    ]);
  });

  it('pairs inline prices immediately without stealing detached prices', () => {
    const { rows } = parseMenuText('POSTRES\nFlan casero\nHelado $4000\n$4500');

    expect(rows).toEqual([
      { name: 'Helado', description: '', price: 4000, category: 'Postres' },
      { name: 'Flan casero', description: '', price: 4500, category: 'Postres' },
    ]);
  });

  it('keeps weight suffixes and strips trailing icon residue from names', () => {
    const { rows } = parseMenuText('PARRILLA\nBife de chorizo (500gr) ●\nMilanesa (V)\n$13500\n$33500');

    expect(rows).toEqual([
      { name: 'Bife de chorizo (500gr)', description: '', price: 13500, category: 'Parrilla' },
      { name: 'Milanesa', description: '', price: 33500, category: 'Parrilla' },
    ]);
  });

  it('replicates a single KIDS flat price to every item in the section', () => {
    const text = `MENÚ KIDS
TODOS LOS PLATOS $17500
Milanesa con papas fritas
Chicken fingers
Ñoquis`;

    const { rows, warnings } = parseMenuText(text);

    expect(rows).toEqual([
      { name: 'Milanesa con papas fritas', description: '', price: 17500, category: 'Menú Kids' },
      { name: 'Chicken fingers', description: '', price: 17500, category: 'Menú Kids' },
      { name: 'Ñoquis', description: '', price: 17500, category: 'Menú Kids' },
    ]);
    expect(warnings).toEqual([]);
  });

  it('replicates a lone detached KIDS price across all names', () => {
    const { rows, warnings } = parseMenuText('MENÚ KIDS\nMilanesa con papas fritas\nChicken fingers\n$17500');

    expect(rows).toEqual([
      { name: 'Milanesa con papas fritas', description: '', price: 17500, category: 'Menú Kids' },
      { name: 'Chicken fingers', description: '', price: 17500, category: 'Menú Kids' },
    ]);
    expect(warnings).toEqual([]);
  });

  it('drops SERVICIO DE MESA with its price instead of orphaning it', () => {
    const text = `PARRILLA
Bife de chorizo
$13500
SERVICIO DE MESA $2500
POSTRES
Flan casero
$4000`;

    const { rows, warnings, details } = parseMenuText(text);

    expect(rows).toEqual([
      { name: 'Bife de chorizo', description: '', price: 13500, category: 'Parrilla' },
      { name: 'Flan casero', description: '', price: 4000, category: 'Postres' },
    ]);
    expect(warnings).toEqual([]);
    expect(details).toEqual([]);
  });

  it('drops a detached price glued to a surcharge line', () => {
    const { rows, warnings } = parseMenuText('PARRILLA\nBife de chorizo\n$13500\nSERVICIO DE MESA\n$2500');

    expect(rows).toEqual([
      { name: 'Bife de chorizo', description: '', price: 13500, category: 'Parrilla' },
    ]);
    expect(warnings).toEqual([]);
  });

  it('never treats unit-suffixed or edition numbers as prices', () => {
    const text = `BEBIDAS
Agua con gas
12 AÑOS
1.75L
600gr
N°1
$4000`;

    const { rows, warnings, details } = parseMenuText(text);

    expect(rows).toEqual([
      { name: 'Agua con gas', description: '12 AÑOS 1.75L 600gr', price: 4000, category: 'Bebidas' },
    ]);
    expect(warnings).toEqual([]);
    expect(details).toEqual([]);
  });

  it('assigns leading names before any header to the first header below', () => {
    const text = `Empanada de carne
$4000
ENTRADAS
Provoleta
$13500`;

    const { rows, warnings } = parseMenuText(text);

    expect(rows).toEqual([
      { name: 'Empanada de carne', description: '', price: 4000, category: 'Entradas' },
      { name: 'Provoleta', description: '', price: 13500, category: 'Entradas' },
    ]);
    expect(warnings).toEqual([]);
  });

  it('re-categorizes leading inline pairs under the first header below', () => {
    const { rows, warnings } = parseMenuText('Flan casero $4000\nPOSTRES\nHelado\n$4500');

    expect(rows).toEqual([
      { name: 'Flan casero', description: '', price: 4000, category: 'Postres' },
      { name: 'Helado', description: '', price: 4500, category: 'Postres' },
    ]);
    expect(warnings).toEqual([]);
  });

  it('reports surplus prices and missing prices as actionable details', () => {
    const text = `MERCHANDISING
Remera
$4000
$5000
POSTRES
Flan sin precio`;

    const { rows, warnings, details } = parseMenuText(text);

    expect(rows).toEqual([
      { name: 'Remera', description: '', price: 4000, category: 'Merchandising' },
    ]);
    expect(details).toContainEqual({ type: 'orphan_price', prices: [5000], category: 'Merchandising' });
    expect(details).toContainEqual({ type: 'no_price', names: ['Flan sin precio'] });
    expect(warnings.join(' ')).toMatch(/prices ignored/);
    expect(warnings.join(' ')).toMatch(/no price found/);
  });
});
