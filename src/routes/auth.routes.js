const express = require('express');
const passport = require('passport');
const AuthController = require('../controllers/auth.controller');
const validatorHandler = require('../middlewares/validator.handler');
const { loginSchema, registerSchema } = require('../schemas/auth.schema');

const apiRouter = express.Router();
const viewRouter = express.Router();
const controller = new AuthController();

apiRouter.post('/login',
  validatorHandler(loginSchema, 'body'),
  passport.authenticate('local', { session: false }),
  controller.login.bind(controller),
);

apiRouter.post('/register',
  validatorHandler(registerSchema, 'body'),
  controller.register.bind(controller),
);

viewRouter.get('/login', controller.renderLogin.bind(controller));

viewRouter.post('/login',
  validatorHandler(loginSchema, 'body'),
  passport.authenticate('local', { session: false }),
  controller.loginView.bind(controller),
);

viewRouter.get('/logout', controller.logout.bind(controller));

module.exports = { apiRouter, viewRouter };
