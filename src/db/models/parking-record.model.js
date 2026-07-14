const { DataTypes, Model } = require('sequelize');

const PARKING_RECORD_TABLE = 'parking_records';

const ParkingRecordSchema = {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
    allowNull: false,
  },
  plate: {
    type: DataTypes.STRING(20),
    allowNull: false,
  },
  entryTime: {
    type: DataTypes.DATE,
    allowNull: false,
    defaultValue: DataTypes.NOW,
    field: 'entry_time',
  },
  exitTime: {
    type: DataTypes.DATE,
    allowNull: true,
    field: 'exit_time',
  },
  totalMinutes: {
    type: DataTypes.INTEGER,
    allowNull: true,
    field: 'total_minutes',
  },
  totalCost: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: true,
    field: 'total_cost',
  },
  categoryId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    field: 'category_id',
    references: {
      model: 'categories',
      key: 'id',
    },
  },
  registeredBy: {
    type: DataTypes.INTEGER,
    allowNull: false,
    field: 'registered_by',
    references: {
      model: 'users',
      key: 'id',
    },
  },
  status: {
    type: DataTypes.STRING(20),
    allowNull: false,
    defaultValue: 'active',
    validate: {
      isIn: [['active', 'completed']],
    },
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

class ParkingRecord extends Model {
  static associate(models) {
    this.belongsTo(models.User, {
      foreignKey: 'registered_by',
      as: 'registeredByUser',
    });
    this.belongsTo(models.Category, {
      foreignKey: 'category_id',
      as: 'category',
    });
  }

  static config(sequelize) {
    return {
      sequelize,
      tableName: PARKING_RECORD_TABLE,
      modelName: 'ParkingRecord',
      timestamps: true,
    };
  }
}

module.exports = { PARKING_RECORD_TABLE, ParkingRecordSchema, ParkingRecord };
