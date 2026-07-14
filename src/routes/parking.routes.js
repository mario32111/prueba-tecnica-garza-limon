const express = require('express');
const passport = require('passport');
const ParkingController = require('../controllers/parking.controller');
const validatorHandler = require('../middlewares/validator.handler');
const { checkApiKey, checkRoles, checkJwtView, extractTokenFromQuery } = require('../middlewares/auth.handler');
const { createEntrySchema, createExitSchema, reportQuerySchema } = require('../schemas/parking.schema');

const apiRouter = express.Router();
const viewRouter = express.Router();
const controller = new ParkingController();

apiRouter.get('/',
  checkApiKey,
  passport.authenticate('jwt', { session: false }),
  validatorHandler(reportQuerySchema, 'query'),
  controller.findAll.bind(controller),
);

apiRouter.get('/active',
  checkApiKey,
  passport.authenticate('jwt', { session: false }),
  controller.findActive.bind(controller),
);

apiRouter.get('/plate/:plate',
  checkApiKey,
  passport.authenticate('jwt', { session: false }),
  controller.findByPlate.bind(controller),
);

apiRouter.post('/entry',
  checkApiKey,
  passport.authenticate('jwt', { session: false }),
  checkRoles('admin', 'employee'),
  validatorHandler(createEntrySchema, 'body'),
  controller.createEntry.bind(controller),
);

apiRouter.post('/exit',
  checkApiKey,
  passport.authenticate('jwt', { session: false }),
  checkRoles('admin', 'employee'),
  validatorHandler(createExitSchema, 'body'),
  controller.createExit.bind(controller),
);

apiRouter.get('/export',
  checkApiKey,
  extractTokenFromQuery,
  passport.authenticate('jwt', { session: false }),
  checkRoles('admin'),
  controller.exportExcel.bind(controller),
);

apiRouter.get('/export/:plate',
  checkApiKey,
  extractTokenFromQuery,
  passport.authenticate('jwt', { session: false }),
  checkRoles('admin'),
  controller.exportPlateExcel.bind(controller),
);

viewRouter.get('/dashboard', checkJwtView, controller.renderDashboard.bind(controller));

viewRouter.get('/reports', checkJwtView, checkRoles('admin'), controller.renderReports.bind(controller));

module.exports = { apiRouter, viewRouter };
