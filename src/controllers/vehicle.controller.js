const VehicleService = require('../services/vehicle.service');

const service = new VehicleService();

class VehicleController {
  async findAll(req, res, next) {
    try { res.json(await service.find()); } catch (error) { next(error); }
  }

  async findOne(req, res, next) {
    try { res.json(await service.findOne(req.params.id)); } catch (error) { next(error); }
  }

  async create(req, res, next) {
    try { res.status(201).json(await service.create(req.body)); } catch (error) { next(error); }
  }

  async update(req, res, next) {
    try { res.json(await service.update(req.params.id, req.body)); } catch (error) { next(error); }
  }

  async softDelete(req, res, next) {
    try { res.json(await service.softDelete(req.params.id)); } catch (error) { next(error); }
  }

  async reactivate(req, res, next) {
    try { res.json(await service.reactivate(req.params.id)); } catch (error) { next(error); }
  }

  async renderList(req, res, next) {
    try {
      const vehicles = await service.find();
      res.render('vehicles/list', {
        vehicles,
        user: req.user,
        token: req.cookies.token,
        title: 'Vehículos',
      });
    } catch (error) {
      next(error);
    }
  }
}

module.exports = VehicleController;
