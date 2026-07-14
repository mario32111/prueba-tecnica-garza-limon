const Joi = require('joi');

const email = Joi.string().email();
const password = Joi.string().min(6).max(100);

const loginSchema = Joi.object({
  email: email.required(),
  password: password.required(),
});

const registerSchema = Joi.object({
  email: email.required(),
  password: password.required(),
});

module.exports = { loginSchema, registerSchema };
