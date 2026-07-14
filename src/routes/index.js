const express = require('express');

function routerApi(app) {
  const router = express.Router();

  router.get('/', (req, res) => {
    res.json({ message: 'API v1 running', version: '1.0.0' });
  });

  const { apiRouter: userApiRouter } = require('./user.routes');
  router.use('/users', userApiRouter);

  const { apiRouter: authApiRouter } = require('./auth.routes');
  router.use('/auth', authApiRouter);

  const { apiRouter: categoryApiRouter } = require('./category.routes');
  router.use('/categories', categoryApiRouter);

  const { apiRouter: parkingApiRouter } = require('./parking.routes');
  router.use('/parking', parkingApiRouter);

  app.use('/api/v1', router);

  const { viewRouter: userViewRouter } = require('./user.routes');
  app.use('/users', userViewRouter);

  const { viewRouter: authViewRouter } = require('./auth.routes');
  app.use('/auth', authViewRouter);

  const { viewRouter: categoryViewRouter } = require('./category.routes');
  app.use('/categories', categoryViewRouter);

  const { viewRouter: parkingViewRouter } = require('./parking.routes');
  app.use('/parking', parkingViewRouter);

  app.get('/dashboard', (req, res) => {
    const token = req.cookies.token;
    if (!token) return res.redirect('/auth/login');
    try {
      const jwt = require('jsonwebtoken');
      const { config } = require('../config/config');
      const payload = jwt.verify(token, config.jwtSecret);
      req.user = payload;
      req.cookies.token = token;
      const ParkingController = require('../controllers/parking.controller');
      const controller = new ParkingController();
      controller.renderDashboard(req, res, (err) => {
        if (err) {
          console.error('Dashboard error:', err.message);
          res.redirect('/auth/login');
        }
      });
    } catch (error) {
      console.error('Dashboard handler error:', error.message);
      res.redirect('/auth/login');
    }
  });
}

module.exports = routerApi;
