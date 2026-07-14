const express = require('express');
const passport = require('passport');
const UserController = require('../controllers/user.controller');
const validatorHandler = require('../middlewares/validator.handler');
const { checkApiKey, checkRoles } = require('../middlewares/auth.handler');
const { createUserSchema, updateUserSchema, getUserSchema } = require('../schemas/user.schema');

const apiRouter = express.Router();
const viewRouter = express.Router();
const controller = new UserController();

// API JSON (prefijo /api/v1/users) - Protegido
apiRouter.get('/',
  checkApiKey,
  passport.authenticate('jwt', { session: false }),
  controller.findAll.bind(controller),
);

apiRouter.get('/:id',
  checkApiKey,
  passport.authenticate('jwt', { session: false }),
  validatorHandler(getUserSchema, 'params'),
  controller.findOne.bind(controller),
);

apiRouter.post('/',
  checkApiKey,
  passport.authenticate('jwt', { session: false }),
  checkRoles('admin'),
  validatorHandler(createUserSchema, 'body'),
  controller.create.bind(controller),
);

apiRouter.patch('/:id',
  checkApiKey,
  passport.authenticate('jwt', { session: false }),
  checkRoles('admin'),
  validatorHandler(getUserSchema, 'params'),
  validatorHandler(updateUserSchema, 'body'),
  controller.update.bind(controller),
);

apiRouter.delete('/:id',
  checkApiKey,
  passport.authenticate('jwt', { session: false }),
  checkRoles('admin'),
  validatorHandler(getUserSchema, 'params'),
  controller.delete.bind(controller),
);

// Vistas EJS (prefijo /users) - Público
viewRouter.get('/list', controller.renderList.bind(controller));

module.exports = { apiRouter, viewRouter };
