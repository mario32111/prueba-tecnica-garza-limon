const Joi = require('joi');

const id = Joi.number().integer();
const name = Joi.string().min(3).max(50);
const description = Joi.string().max(255).allow('', null);
const pricePerMinute = Joi.number().min(0).precision(2);

const createCategorySchema = Joi.object({
  name: name.required(),
  description: description.optional(),
  pricePerMinute: pricePerMinute.required(),
});

const updateCategorySchema = Joi.object({
  name: name.optional(),
  description: description.optional(),
  pricePerMinute: pricePerMinute.optional(),
  isActive: Joi.boolean().optional(),
});

const getCategorySchema = Joi.object({
  id: id.required(),
});

module.exports = { createCategorySchema, updateCategorySchema, getCategorySchema };
