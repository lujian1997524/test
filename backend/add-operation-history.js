// 添加操作历史表的数据库迁移脚本
const { sequelize } = require('./src/utils/database');

async function addOperationHistoryTable() {
  try {
    console.log('🔄 开始添加操作历史表...');
    
    // 创建操作历史表
    await sequelize.query(`
      CREATE TABLE IF NOT EXISTS operation_history (
        id INT PRIMARY KEY AUTO_INCREMENT,
        project_id INT NOT NULL COMMENT '项目ID',
        operation_type ENUM('material_update', 'drawing_upload', 'project_update', 'project_create', 'project_delete') NOT NULL COMMENT '操作类型',
        operation_description VARCHAR(500) NOT NULL COMMENT '操作描述',
        details JSON COMMENT '操作详细信息',
        operated_by INT NOT NULL COMMENT '操作人ID',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
        FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE,
        FOREIGN KEY (operated_by) REFERENCES users(id)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='操作历史表';
    `);

    // 添加索引以提高查询性能（检查是否存在再创建）
    try {
      await sequelize.query(`
        CREATE INDEX idx_operation_history_project_id ON operation_history(project_id);
      `);
    } catch (error) {
      if (!error.message.includes('Duplicate key name')) {
        console.warn('创建project_id索引失败:', error.message);
      }
    }
    
    try {
      await sequelize.query(`
        CREATE INDEX idx_operation_history_operated_by ON operation_history(operated_by);
      `);
    } catch (error) {
      if (!error.message.includes('Duplicate key name')) {
        console.warn('创建operated_by索引失败:', error.message);
      }
    }
    
    try {
      await sequelize.query(`
        CREATE INDEX idx_operation_history_created_at ON operation_history(created_at);
      `);
    } catch (error) {
      if (!error.message.includes('Duplicate key name')) {
        console.warn('创建created_at索引失败:', error.message);
      }
    }

    console.log('✅ 操作历史表创建成功！');

    // 为现有项目创建一些初始操作历史记录
    console.log('🔄 为现有项目创建初始操作历史记录...');
    
    await sequelize.query(`
      INSERT INTO operation_history (project_id, operation_type, operation_description, details, operated_by)
      SELECT 
        p.id,
        'project_create',
        CONCAT('创建项目: ', p.name),
        JSON_OBJECT(
          'projectName', p.name,
          'status', p.status,
          'priority', p.priority
        ),
        COALESCE(p.created_by, 1)
      FROM projects p
      WHERE NOT EXISTS (
        SELECT 1 FROM operation_history oh 
        WHERE oh.project_id = p.id AND oh.operation_type = 'project_create'
      );
    `);

    console.log('✅ 初始操作历史记录创建完成！');
    
  } catch (error) {
    console.error('❌ 添加操作历史表失败:', error);
    throw error;
  }
}

// 直接执行迁移
if (require.main === module) {
  addOperationHistoryTable()
    .then(() => {
      console.log('🎉 操作历史表迁移完成！');
      process.exit(0);
    })
    .catch((error) => {
      console.error('💥 迁移失败:', error);
      process.exit(1);
    });
}

module.exports = addOperationHistoryTable;