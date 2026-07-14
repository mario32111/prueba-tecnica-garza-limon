const { DataTypes, Model } = require('sequelize');

const VEHICLE_TABLE = 'vehicles';

const VehicleSchema = {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
    allowNull: false,
  },
  plate: {
    type: DataTypes.STRING(20),
    allowNull: false,
    unique: true,
  },
  categoryId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    field: 'category_id',
  },
  isActive: {
    type: DataTypes.BOOLEAN,
    allowNull: false,
    defaultValue: true,
    field: 'is_active',
  },
  createdAt: {
    type: DataTypes.DATE,
    allowNull: false,
    defaultValue: DataTypes.NOW,
    field: 'created_at',
  },
  updatedAt: {
    type: DataTypes.DATE,
    allowNull: false,
    defaultValue: DataTypes.NOW,
    field: 'updated_at',
  },
};

class Vehicle extends Model {
  static associate(models) {
    this.belongsTo(models.Category, {
      foreignKey: 'category_id',
      as: 'category',
    });
    this.hasMany(models.ParkingRecord, {
      foreignKey: 'plate',
      sourceKey: 'plate',
      as: 'parkingRecords',
    });
  }

  static config(sequelize) {
    return {
      sequelize,
      tableName: VEHICLE_TABLE,
      modelName: 'Vehicle',
      timestamps: true,
    };
  }
}

module.exports = { VEHICLE_TABLE, VehicleSchema, Vehicle };
