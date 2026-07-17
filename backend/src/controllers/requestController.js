const Request = require('../models/Request');

class RequestController {
  async createRequest(req, res, next) {
    try {
      const { tableNumber, requestType } = req.body;

      if (!tableNumber || !requestType) {
        return res.status(400).json({ error: 'Datos incompletos' });
      }

      if (!['call_waiter', 'request_bill'].includes(requestType)) {
        return res.status(400).json({ error: 'Tipo de solicitud inválido' });
      }

      const request = await Request.create(tableNumber, requestType);

      res.json({
        message: 'Solicitud creada exitosamente',
        requestId: request.id,
        tableNumber,
        requestType
      });
    } catch (error) {
      next(error);
    }
  }

  async getPendingRequests(req, res, next) {
    try {
      const requests = await Request.getPending();
      res.json(requests);
    } catch (error) {
      next(error);
    }
  }

  async attendRequest(req, res, next) {
    try {
      const { id } = req.params;
      const success = await Request.markAsAttended(id);

      if (!success) {
        return res.status(404).json({ error: 'Solicitud no encontrada' });
      }

      res.json({ message: 'Solicitud marcada como atendida' });
    } catch (error) {
      next(error);
    }
  }

  async getStats(req, res, next) {
    try {
      const requestStats = await Request.getStats();
      res.json(requestStats);
    } catch (error) {
      next(error);
    }
  }
}

module.exports = new RequestController();