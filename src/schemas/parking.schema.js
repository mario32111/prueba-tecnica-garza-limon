const Joi = require('joi');

const plate = Joi.string().min(3).max(20);
const categoryId = Joi.number().integer().min(1);

const createEntrySchema = Joi.object({
  plate: plate.required(),
  categoryId: categoryId.required(),
});

const createExitSchema = Joi.object({
  plate: plate.required(),
});

const reportQuerySchema = Joi.object({
  dateFrom: Joi.date().iso().optional(),
  dateTo: Joi.date().iso().optional(),
  plate: plate.optional(),
  categoryId: Joi.number().integer().optional(),
  minCost: Joi.number().min(0).precision(2).optional(),
  maxCost: Joi.number().min(0).precision(2).optional(),
  minMinutes: Joi.number().integer().min(0).optional(),
  maxMinutes: Joi.number().integer().min(0).optional(),
  sortBy: Joi.string().valid('plate', 'entry_time', 'exit_time', 'total_cost', 'total_minutes').optional(),
  sortOrder: Joi.string().valid('ASC', 'DESC').optional(),
});

module.exports = { createEntrySchema, createExitSchema, reportQuerySchema };
