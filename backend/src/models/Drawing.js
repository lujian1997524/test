const { DataTypes } = require('sequelize');
const { sequelize } = require('../utils/database');

const Drawing = sequelize.define('Drawing', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  projectId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    field: 'project_id',
    comment: '项目ID',
    references: {
      model: 'projects',
      key: 'id'
    }
  },
  filename: {
    type: DataTypes.STRING(255),
    allowNull: false,
    comment: '文件名'
  },
  originalFilename: {
    type: DataTypes.STRING(255),
    allowNull: false,
    field: 'original_filename',
    comment: '原始文件名'
  },
  filePath: {
    type: DataTypes.STRING(500),
    allowNull: false,
    field: 'file_path',
    comment: '文件路径'
  },
  fileSize: {
    type: DataTypes.INTEGER,
    allowNull: true,
    field: 'file_size',
    comment: '文件大小'
  },
  fileType: {
    type: DataTypes.STRING(50),
    allowNull: true,
    field: 'file_type',
    comment: '文件类型'
  },
  version: {
    type: DataTypes.INTEGER,
    allowNull: false,
    defaultValue: 1,
    comment: '版本号'
  },
  uploadedBy: {
    type: DataTypes.INTEGER,
    allowNull: true,
    field: 'uploaded_by',
    comment: '上传人',
    references: {
      model: 'users',
      key: 'id'
    }
  },
  uploadTime: {
    type: DataTypes.DATE,
    allowNull: false,
    defaultValue: DataTypes.NOW,
    field: 'upload_time',
    comment: '上传时间'
  },
  isCurrentVersion: {
    type: DataTypes.BOOLEAN,
    allowNull: false,
    defaultValue: true,
    field: 'is_current_version',
    comment: '是否当前版本'
  },
  description: {
    type: DataTypes.TEXT,
    allowNull: true,
    comment: '图纸描述'
  }
}, {
  tableName: 'drawings',
  comment: '图纸表',
  indexes: [
    {
      fields: ['project_id']
    },
    {
      fields: ['filename']
    },
    {
      fields: ['uploaded_by']
    },
    {
      fields: ['is_current_version']
    }
  ]
});

module.exports = Drawing;