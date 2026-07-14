const express = require('express');
const passport = require('passport');
const AuthController = require('../controllers/auth.controller');
const validatorHandler = require('../middlewares/validator.handler');
const { loginSchema, registerSchema } = require('../schemas/auth.schema');

const apiRouter = express.Router();
const viewRouter = express.Router();
const controller = new AuthController();

// API JSON (prefijo /api/v1/auth)
apiRouter.post('/login',
  validatorHandler(loginSchema, 'body'),
  passport.authenticate('local', { session: false }),
  controller.login.bind(controller),
);

apiRouter.post('/register',
  validatorHandler(registerSchema, 'body'),
  controller.register.bind(controller),
);

// Vistas EJS (prefijo /auth)
viewRouter.get('/login', controller.renderLogin.bind(controller));

module.exports = { apiRouter, viewRouter };
