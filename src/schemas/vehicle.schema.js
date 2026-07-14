const Joi = require('joi');

const plate = Joi.string().min(3).max(20);
const categoryId = Joi.number().integer().min(1);

const createVehicleSchema = Joi.object({
  plate: plate.required(),
  categoryId: categoryId.required(),
});

const updateVehicleSchema = Joi.object({
  plate: plate,
  categoryId: categoryId.required(),
});

const getVehicleSchema = Joi.object({
  id: Joi.number().integer().min(1).required(),
});

module.exports = { createVehicleSchema, updateVehicleSchema, getVehicleSchema };
