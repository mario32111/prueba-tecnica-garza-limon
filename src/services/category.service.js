const boom = require('@hapi/boom');
const { models } = require('../libs/sequelize');

class CategoryService {
  async find() {
    const categories = await models.Category.findAll({
      where: { isActive: true },
      order: [['id', 'ASC']],
    });
    return categories;
  }

  async findOne(id) {
    const category = await models.Category.findByPk(id);
    if (!category) {
      throw boom.notFound('category not found');
    }
    return category;
  }

  async create(data) {
    const category = await models.Category.create(data);
    return category;
  }

  async update(id, changes) {
    const category = await this.findOne(id);
    const updatedCategory = await category.update(changes);
    return updatedCategory;
  }

  async delete(id) {
    const category = await this.findOne(id);
    const count = await models.ParkingRecord.count({
      where: { categoryId: id },
    });
    if (count > 0) {
      throw boom.conflict('Cannot delete category with associated parking records');
    }
    await category.destroy();
    return { id };
  }

  async softDelete(id) {
    const category = await this.findOne(id);
    await category.update({ isActive: false });
    return { id, isActive: false };
  }
}

module.exports = CategoryService;
