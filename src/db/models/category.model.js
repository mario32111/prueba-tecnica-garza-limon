const { DataTypes, Model } = require('sequelize');

const CATEGORY_TABLE = 'categories';

const CategorySchema = {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
    allowNull: false,
  },
  name: {
    type: DataTypes.STRING(50),
    unique: true,
    allowNull: false,
  },
  description: {
    type: DataTypes.TEXT,
    allowNull: true,
  },
  pricePerMinute: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: false,
    defaultValue: 0.00,
    field: 'price_per_minute',
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

class Category extends Model {
  static associate(models) {
    this.hasMany(models.ParkingRecord, {
      foreignKey: 'category_id',
      as: 'parkingRecords',
    });
  }

  static config(sequelize) {
    return {
      sequelize,
      tableName: CATEGORY_TABLE,
      modelName: 'Category',
      timestamps: true,
    };
  }
}

module.exports = { CATEGORY_TABLE, CategorySchema, Category };
