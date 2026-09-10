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
});
