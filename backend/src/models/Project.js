const { DataTypes } = require('sequelize');
const { sequelize } = require('../utils/database');

const Project = sequelize.define('Project', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  name: {
    type: DataTypes.STRING(200),
    allowNull: false,
    comment: '项目名称'
  },
  description: {
    type: DataTypes.TEXT,
    allowNull: true,
    comment: '项目描述'
  },
  status: {
    type: DataTypes.ENUM('pending', 'in_progress', 'completed', 'cancelled'),
    allowNull: false,
    defaultValue: 'pending',
    comment: '项目状态'
  },
  priority: {
    type: DataTypes.ENUM('low', 'medium', 'high', 'urgent'),
    allowNull: false,
    defaultValue: 'medium',
    comment: '优先级'
  },
  startDate: {
    type: DataTypes.DATEONLY,
    allowNull: true,
    field: 'start_date',
    comment: '开始日期'
  },
  endDate: {
    type: DataTypes.DATEONLY,
    allowNull: true,
    field: 'end_date',
    comment: '结束日期'
  },
  createdBy: {
    type: DataTypes.INTEGER,
    allowNull: true,
    field: 'created_by',
    comment: '创建人',
    references: {
      model: 'users',
      key: 'id'
    }
  },
  assignedWorkerId: {
    type: DataTypes.INTEGER,
    allowNull: true,
    field: 'assigned_worker_id',
    comment: '负责工人',
    references: {
      model: 'workers',
      key: 'id'
    }
  }
}, {
  tableName: 'projects',
  comment: '项目表',
  indexes: [
    {
      fields: ['name']
    },
    {
      fields: ['status']
    },
    {
      fields: ['priority']
    },
    {
      fields: ['created_by']
    },
    {
      fields: ['assigned_worker_id']
    }
  ]
});

module.exports = Project;