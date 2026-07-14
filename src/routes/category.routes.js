const express = require('express');
const passport = require('passport');
const CategoryController = require('../controllers/category.controller');
const validatorHandler = require('../middlewares/validator.handler');
const { checkApiKey, checkRoles, checkJwtView } = require('../middlewares/auth.handler');
const { createCategorySchema, updateCategorySchema, getCategorySchema } = require('../schemas/category.schema');

const apiRouter = express.Router();
const viewRouter = express.Router();
const controller = new CategoryController();

apiRouter.get('/',
  checkApiKey,
  passport.authenticate('jwt', { session: false }),
  controller.findAll.bind(controller),
);

apiRouter.get('/:id',
  checkApiKey,
  passport.authenticate('jwt', { session: false }),
  validatorHandler(getCategorySchema, 'params'),
  controller.findOne.bind(controller),
);

apiRouter.post('/',
  checkApiKey,
  passport.authenticate('jwt', { session: false }),
  checkRoles('admin'),
  validatorHandler(createCategorySchema, 'body'),
  controller.create.bind(controller),
);

apiRouter.patch('/:id',
  checkApiKey,
  passport.authenticate('jwt', { session: false }),
  checkRoles('admin'),
  validatorHandler(getCategorySchema, 'params'),
  validatorHandler(updateCategorySchema, 'body'),
  controller.update.bind(controller),
);

apiRouter.delete('/:id',
  checkApiKey,
  passport.authenticate('jwt', { session: false }),
  checkRoles('admin'),
  validatorHandler(getCategorySchema, 'params'),
  controller.softDelete.bind(controller),
);

viewRouter.get('/list', checkJwtView, checkRoles('admin'), controller.renderList.bind(controller));

module.exports = { apiRouter, viewRouter };
