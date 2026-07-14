const CategoryService = require('../services/category.service');

const service = new CategoryService();

class CategoryController {
  async findAll(req, res, next) {
    try {
      const categories = await service.find();
      res.json(categories);
    } catch (error) {
      next(error);
    }
  }

  async findOne(req, res, next) {
    try {
      const { id } = req.params;
      const category = await service.findOne(id);
      res.json(category);
    } catch (error) {
      next(error);
    }
  }

  async create(req, res, next) {
    try {
      const body = req.body;
      const category = await service.create(body);
      res.status(201).json(category);
    } catch (error) {
      next(error);
    }
  }

  async update(req, res, next) {
    try {
      const { id } = req.params;
      const body = req.body;
      const category = await service.update(id, body);
      res.json(category);
    } catch (error) {
      next(error);
    }
  }

  async softDelete(req, res, next) {
    try {
      const { id } = req.params;
      const result = await service.softDelete(id);
      res.json(result);
    } catch (error) {
      next(error);
    }
  }

  async renderList(req, res, next) {
    try {
      const categories = await service.find();
      res.render('categories/list', { categories, user: req.user, token: req.cookies.token, title: 'Categorías' });
    } catch (error) {
      next(error);
    }
  }
}

module.exports = CategoryController;
