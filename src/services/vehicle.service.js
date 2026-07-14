const boom = require('@hapi/boom');
const { models } = require('../libs/sequelize');

class VehicleService {
  async find(onlyActive = false) {
    const where = onlyActive ? { isActive: true } : {};
    return await models.Vehicle.findAll({
      where,
      include: [{ model: models.Category, as: 'category' }],
      order: [['plate', 'ASC']],
    });
  }

  async findOne(id) {
    const vehicle = await models.Vehicle.findByPk(id, {
      include: [{ model: models.Category, as: 'category' }],
    });
    if (!vehicle) throw boom.notFound('Vehicle not found');
    return vehicle;
  }

  async findByPlate(plate) {
    const vehicle = await models.Vehicle.findOne({
      where: { plate },
      include: [{ model: models.Category, as: 'category' }],
    });
    if (!vehicle) throw boom.notFound('Vehicle not found');
    return vehicle;
  }

  async create(data) {
    const existing = await models.Vehicle.findOne({ where: { plate: data.plate } });
    if (existing) throw boom.conflict('Vehicle with this plate already exists');

    const category = await models.Category.findByPk(data.categoryId);
    if (!category || !category.isActive) throw boom.notFound('Category not found or inactive');

    return await models.Vehicle.create(data);
  }

  async update(id, changes) {
    const vehicle = await this.findOne(id);
    if (changes.plate) delete changes.plate;
    return await vehicle.update(changes);
  }

  async softDelete(id) {
    const vehicle = await this.findOne(id);
    return await vehicle.update({ isActive: false });
  }

  async reactivate(id) {
    const vehicle = await models.Vehicle.findByPk(id);
    if (!vehicle) throw boom.notFound('Vehicle not found');
    return await vehicle.update({ isActive: true });
  }
}

module.exports = VehicleService;
