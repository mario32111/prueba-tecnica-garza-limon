const UserService = require('../services/user.service');

const service = new UserService();

class UserController {
  async findAll(req, res, next) {
    try {
      const users = await service.find();
      res.json(users);
    } catch (error) {
      next(error);
    }
  }

  async findOne(req, res, next) {
    try {
      const { id } = req.params;
      const user = await service.findOne(id);
      res.json(user);
    } catch (error) {
      next(error);
    }
  }

  async create(req, res, next) {
    try {
      const body = req.body;
      const user = await service.create(body);
      res.status(201).json(user);
    } catch (error) {
      next(error);
    }
  }

  async update(req, res, next) {
    try {
      const { id } = req.params;
      const body = req.body;
      const user = await service.update(id, body);
      res.json(user);
    } catch (error) {
      next(error);
    }
  }

  async delete(req, res, next) {
    try {
      const { id } = req.params;
      const result = await service.delete(id);
      res.json(result);
    } catch (error) {
      next(error);
    }
  }

  async renderList(req, res, next) {
    try {
      const users = await service.find();
      res.render('users/list', {
        users,
        user: req.user,
        token: req.cookies.token,
        title: 'Usuarios',
      });
    } catch (error) {
      next(error);
    }
  }
}

module.exports = UserController;
