const { User, UserSchema } = require('./user.model');
const { Category, CategorySchema } = require('./category.model');
const { ParkingRecord, ParkingRecordSchema } = require('./parking-record.model');

function setupModels(sequelize) {
  User.init(UserSchema, User.config(sequelize));
  Category.init(CategorySchema, Category.config(sequelize));
  ParkingRecord.init(ParkingRecordSchema, ParkingRecord.config(sequelize));

  User.associate(sequelize.models);
  Category.associate(sequelize.models);
  ParkingRecord.associate(sequelize.models);
}

module.exports = setupModels;
