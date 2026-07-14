const express = require('express');

function routerApi(app) {
  const router = express.Router();

  router.get('/', (req, res) => {
    res.json({ message: 'API v1 running', version: '1.0.0' });
  });

  // API JSON routes under /api/v1
  const { apiRouter: userApiRouter } = require('./user.routes');
  router.use('/users', userApiRouter);

  const { apiRouter: authApiRouter } = require('./auth.routes');
  router.use('/auth', authApiRouter);

  app.use('/api/v1', router);

  // View routes (EJS)
  const { viewRouter: userViewRouter } = require('./user.routes');
  app.use('/users', userViewRouter);

  const { viewRouter: authViewRouter } = require('./auth.routes');
  app.use('/auth', authViewRouter);
}

module.exports = routerApi;
