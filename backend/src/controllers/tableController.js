const Table = require('../models/Table');
const QRCode = require('qrcode');
const { v4: uuidv4 } = require('uuid');

class TableController {
  async generateTables(req, res, next) {
    try {
      const { numberOfTables } = req.body;

      if (!numberOfTables || numberOfTables < 1) {
        return res.status(400).json({ error: 'Número de mesas inválido' });
      }

      const tables = [];

      for (let i = 1; i <= numberOfTables; i++) {
        const qrCode = uuidv4();
        try {
          const table = await Table.create(i, qrCode);
          tables.push(table);
        } catch (err) {
          // Si la mesa ya existe, la ignoramos
          if (!err.message.includes('UNIQUE')) {
            throw err;
          }
        }
      }

      res.json({
        message: `${tables.length} mesas generadas exitosamente`,
        tables
      });
    } catch (error) {
      next(error);
    }
  }

  async getAllTables(req, res, next) {
    try {
      const tables = await Table.getAll();
      res.json(tables);
    } catch (error) {
      next(error);
    }
  }

  async getTableByQR(req, res, next) {
    try {
      const { qrCode } = req.params;
      const table = await Table.findByQRCode(qrCode);

      if (!table) {
        return res.status(404).json({ error: 'Mesa no encontrada' });
      }

      res.json(table);
    } catch (error) {
      next(error);
    }
  }

  async generateQRImage(req, res, next) {
    try {
      const { qrCode } = req.params;
      const table = await Table.findByQRCode(qrCode);

      if (!table) {
        return res.status(404).json({ error: 'Mesa no encontrada' });
      }

      const url = `${process.env.APP_URL}/table/${qrCode}`;
      const qrImage = await QRCode.toDataURL(url);

      res.json({
        tableNumber: table.table_number,
        qrCode: table.qr_code,
        qrImage,
        url
      });
    } catch (error) {
      next(error);
    }
  }
}

module.exports = new TableController();