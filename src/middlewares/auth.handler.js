const boom = require('@hapi/boom');
const jwt = require('jsonwebtoken');
const { config } = require('../config/config');

function checkApiKey(req, res, next) {
  const apiKey = req.headers['api'] || req.query.api;
  if (apiKey === config.apiKey) {
    next();
  } else {
    next(boom.unauthorized('apiKey is required'));
  }
}

function extractTokenFromQuery(req, res, next) {
  if (req.query.token && !req.headers.authorization) {
    req.headers.authorization = 'Bearer ' + req.query.token;
  }
  next();
}

function checkRoles(...roles) {
  return (req, res, next) => {
    const user = req.user;
    if (roles.includes(user.role)) {
      next();
    } else {
      next(boom.unauthorized('This role is not allowed'));
    }
  };
}

function checkJwtView(req, res, next) {
  const token = req.cookies.token;
  if (!token) {
    return res.redirect('/auth/login');
  }
  try {
    const payload = jwt.verify(token, config.jwtSecret);
    req.user = payload;
    next();
  } catch (error) {
    res.clearCookie('token');
    return res.redirect('/auth/login');
  }
}

function attachUser(req, res, next) {
  const token = req.cookies.token;
  if (token) {
    try {
      const payload = jwt.verify(token, config.jwtSecret);
      req.user = payload;
    } catch (error) {
      req.user = null;
    }
  } else {
    req.user = null;
  }
  next();
}

module.exports = { checkApiKey, checkRoles, checkJwtView, attachUser, extractTokenFromQuery };
