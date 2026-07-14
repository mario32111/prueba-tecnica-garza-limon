const boom = require('@hapi/boom');
const { models } = require('../libs/sequelize');
const { Op } = require('sequelize');
const XLSX = require('xlsx');

class ParkingService {
  async registerEntry(plate, categoryId, userId) {
    const activeRecord = await models.ParkingRecord.findOne({
      where: { plate, status: 'active' },
    });
    if (activeRecord) {
      throw boom.conflict('Plate already has an active parking record');
    }

    const category = await models.Category.findByPk(categoryId);
    if (!category || !category.isActive) {
      throw boom.notFound('Category not found or inactive');
    }

    const record = await models.ParkingRecord.create({
      plate,
      categoryId,
      registeredBy: userId,
      status: 'active',
    });

    return record;
  }

  async registerExit(plate) {
    const record = await models.ParkingRecord.findOne({
      where: { plate, status: 'active' },
      include: [{ model: models.Category, as: 'category' }],
    });

    if (!record) {
      throw boom.notFound('No active parking record found for this plate');
    }

    const now = new Date();
    const entryTime = new Date(record.entryTime);
    const diffMs = now.getTime() - entryTime.getTime();
    const totalMinutes = Math.ceil(diffMs / 60000);
    const pricePerMinute = parseFloat(record.category.pricePerMinute);
    const totalCost = totalMinutes * pricePerMinute;

    await record.update({
      exitTime: now,
      totalMinutes,
      totalCost,
      status: 'completed',
    });

    return record;
  }

  async findActive() {
    const records = await models.ParkingRecord.findAll({
      where: { status: 'active' },
      include: [
        { model: models.Category, as: 'category' },
        { model: models.User, as: 'registeredByUser', attributes: ['id', 'name'] },
      ],
      order: [['entryTime', 'ASC']],
    });
    return records;
  }

  async findAll(filters = {}) {
    const where = {};
    const categoryWhere = {};

    if (filters.plate) {
      where.plate = { [Op.iLike]: `%${filters.plate}%` };
    }
    if (filters.dateFrom || filters.dateTo) {
      where.entryTime = {};
      if (filters.dateFrom) {
        where.entryTime[Op.gte] = new Date(filters.dateFrom);
      }
      if (filters.dateTo) {
        where.entryTime[Op.lte] = new Date(filters.dateTo);
      }
    }
    if (filters.categoryId) {
      where.categoryId = filters.categoryId;
    }
    if (filters.status) {
      where.status = filters.status;
    }
    if (filters.minCost !== undefined || filters.maxCost !== undefined) {
      where.totalCost = {};
      if (filters.minCost !== undefined) {
        where.totalCost[Op.gte] = parseFloat(filters.minCost);
      }
      if (filters.maxCost !== undefined) {
        where.totalCost[Op.lte] = parseFloat(filters.maxCost);
      }
    }
    if (filters.minMinutes !== undefined || filters.maxMinutes !== undefined) {
      where.totalMinutes = {};
      if (filters.minMinutes !== undefined) {
        where.totalMinutes[Op.gte] = parseInt(filters.minMinutes);
      }
      if (filters.maxMinutes !== undefined) {
        where.totalMinutes[Op.lte] = parseInt(filters.maxMinutes);
      }
    }

    let order = [['entryTime', 'DESC']];
    if (filters.sortBy) {
      order = [[filters.sortBy, filters.sortOrder || 'ASC']];
    }

    const records = await models.ParkingRecord.findAll({
      where,
      include: [
        { model: models.Category, as: 'category' },
        { model: models.User, as: 'registeredByUser', attributes: ['id', 'name'] },
      ],
      order,
    });
    return records;
  }

  async findByPlate(plate) {
    const records = await models.ParkingRecord.findAll({
      where: { plate: { [Op.iLike]: `%${plate}%` } },
      include: [
        { model: models.Category, as: 'category' },
        { model: models.User, as: 'registeredByUser', attributes: ['id', 'name'] },
      ],
      order: [['entryTime', 'DESC']],
    });
    if (!records || records.length === 0) {
      throw boom.notFound('No records found for this plate');
    }
    return records;
  }

  async exportToExcel(filters = {}) {
    const records = await this.findAll(filters);

    const data = records.map((r) => ({
      Placa: r.plate,
      Categoria: r.category ? r.category.name : '',
      Entrada: new Date(r.entryTime).toLocaleString(),
      Salida: r.exitTime ? new Date(r.exitTime).toLocaleString() : 'Activo',
      Minutos: r.totalMinutes || 0,
      Costo: parseFloat(r.totalCost || 0),
      Estado: r.status === 'active' ? 'Activo' : 'Completado',
      RegistradoPor: r.registeredByUser ? r.registeredByUser.name : '',
    }));

    const worksheet = XLSX.utils.json_to_sheet(data);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Reporte');

    return XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' });
  }
}

module.exports = ParkingService;
