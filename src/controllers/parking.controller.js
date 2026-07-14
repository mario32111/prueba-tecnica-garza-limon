const ParkingService = require('../services/parking.service');
const CategoryService = require('../services/category.service');

const parkingService = new ParkingService();
const categoryService = new CategoryService();

class ParkingController {
  async createEntry(req, res, next) {
    try {
      const { plate, categoryId } = req.body;
      const record = await parkingService.registerEntry(plate, categoryId, req.user.sub);
      res.status(201).json(record);
    } catch (error) {
      next(error);
    }
  }

  async createExit(req, res, next) {
    try {
      const { plate } = req.body;
      const record = await parkingService.registerExit(plate);
      res.json(record);
    } catch (error) {
      next(error);
    }
  }

  async findActive(req, res, next) {
    try {
      const records = await parkingService.findActive();
      res.json(records);
    } catch (error) {
      next(error);
    }
  }

  async findAll(req, res, next) {
    try {
      const filters = req.query;
      const records = await parkingService.findAll(filters);
      res.json(records);
    } catch (error) {
      next(error);
    }
  }

  async findByPlate(req, res, next) {
    try {
      const { plate } = req.params;
      const records = await parkingService.findByPlate(plate);
      res.json(records);
    } catch (error) {
      next(error);
    }
  }

  async exportExcel(req, res, next) {
    try {
      const filters = req.query;
      const buffer = await parkingService.exportToExcel(filters);
      res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
      res.setHeader('Content-Disposition', 'attachment; filename=reporte_estacionamiento.xlsx');
      res.send(buffer);
    } catch (error) {
      next(error);
    }
  }

  async exportPlateExcel(req, res, next) {
    try {
      const { plate } = req.params;
      const buffer = await parkingService.exportToExcel({ plate, status: undefined });
      res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
      res.setHeader('Content-Disposition', `attachment; filename=reporte_${plate}.xlsx`);
      res.send(buffer);
    } catch (error) {
      next(error);
    }
  }

  async renderDashboard(req, res, next) {
    try {
      const records = await parkingService.findActive();
      const categories = await categoryService.find();
      res.render('parking/dashboard', {
        records,
        categories,
        user: req.user,
        token: req.cookies.token,
        title: 'Panel de Estacionamiento',
      });
    } catch (error) {
      next(error);
    }
  }

  async renderReports(req, res, next) {
    try {
      const categories = await categoryService.find();
      res.render('parking/reports', {
        categories,
        user: req.user,
        token: req.cookies.token,
        title: 'Reportes',
      });
    } catch (error) {
      next(error);
    }
  }
}

module.exports = ParkingController;
