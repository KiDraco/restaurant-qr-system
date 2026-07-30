const XLSX = require('xlsx');

class ExcelParser {
  static parse(buffer) {
    const workbook = XLSX.read(buffer, { type: 'buffer' });
    const sheetName = workbook.SheetNames[0];
    const sheet = workbook.Sheets[sheetName];
    const data = XLSX.utils.sheet_to_json(sheet, { defval: '' });

    if (!data || data.length === 0) {
      return { columns: [], preview: [], totalRows: 0 };
    }

    const columns = Object.keys(data[0]).map((key) => ({
      key,
      label: key.trim(),
      sample: String(data[0][key]).slice(0, 50),
    }));

    const preview = data.slice(0, 10);

    const suggestions = ExcelParser._suggestMapping(columns);

    return { columns, preview, totalRows: data.length, suggestions };
  }

  static _suggestMapping(columns) {
    const mapping = { name: null, price: null, category: null, description: null };

    for (const col of columns) {
      const label = col.label.toLowerCase();
      if (/nombre|name|producto|item|plato|bebida/.test(label) && !mapping.name) {
        mapping.name = col.key;
      } else if (/(^precio|price|costo|valor|importe)/.test(label) && !mapping.price) {
        mapping.price = col.key;
      } else if (/categoria|category|tipo|seccion|rubro/.test(label) && !mapping.category) {
        mapping.category = col.key;
      } else if (/descripcion|description|detalle/.test(label) && !mapping.description) {
        mapping.description = col.key;
      }
    }

    return mapping;
  }
}

module.exports = ExcelParser;
