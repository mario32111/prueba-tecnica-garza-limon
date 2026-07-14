const express = require('express');
const passport = require('passport');
const VehicleController = require('../controllers/vehicle.controller');
const validatorHandler = require('../middlewares/validator.handler');
const { checkApiKey, checkRoles, checkJwtView } = require('../middlewares/auth.handler');
const { createVehicleSchema, updateVehicleSchema, getVehicleSchema } = require('../schemas/vehicle.schema');

const apiRouter = express.Router();
const viewRouter = express.Router();
const controller = new VehicleController();

apiRouter.get('/',
  checkApiKey,
  passport.authenticate('jwt', { session: false }),
  controller.findAll.bind(controller),
);

apiRouter.get('/:id',
  checkApiKey,
  passport.authenticate('jwt', { session: false }),
  validatorHandler(getVehicleSchema, 'params'),
  controller.findOne.bind(controller),
);

apiRouter.post('/',
  checkApiKey,
  passport.authenticate('jwt', { session: false }),
  checkRoles('admin'),
  validatorHandler(createVehicleSchema, 'body'),
  controller.create.bind(controller),
);

apiRouter.patch('/:id',
  checkApiKey,
  passport.authenticate('jwt', { session: false }),
  checkRoles('admin'),
  validatorHandler(getVehicleSchema, 'params'),
  validatorHandler(updateVehicleSchema, 'body'),
  controller.update.bind(controller),
);

apiRouter.delete('/:id',
  checkApiKey,
  passport.authenticate('jwt', { session: false }),
  checkRoles('admin'),
  validatorHandler(getVehicleSchema, 'params'),
  controller.softDelete.bind(controller),
);

apiRouter.patch('/:id/reactivate',
  checkApiKey,
  passport.authenticate('jwt', { session: false }),
  checkRoles('admin'),
  validatorHandler(getVehicleSchema, 'params'),
  controller.reactivate.bind(controller),
);

viewRouter.get('/list', checkJwtView, controller.renderList.bind(controller));

module.exports = { apiRouter, viewRouter };
