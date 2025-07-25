/**
 * 添加过往项目相关字段的数据库迁移脚本
 * 执行命令: node add-past-project-fields.js
 */

const mysql = require('mysql2/promise');

// 数据库配置
const dbConfig = {
  host: 'localhost',
  port: 3330,
  user: 'laser_user',
  password: 'laser_pass',
  database: 'laser_cutting_db'
};

async function addPastProjectFields() {
  let connection;
  
  try {
    console.log('🔗 连接数据库...');
    connection = await mysql.createConnection(dbConfig);
    
    console.log('📋 检查projects表结构...');
    
    // 检查字段是否已存在
    const [columns] = await connection.execute(`
      SELECT COLUMN_NAME 
      FROM INFORMATION_SCHEMA.COLUMNS 
      WHERE TABLE_SCHEMA = ? AND TABLE_NAME = 'projects'
      AND COLUMN_NAME IN ('is_past_project', 'moved_to_past_at', 'moved_to_past_by')
    `, [dbConfig.database]);
    
    const existingColumns = columns.map(row => row.COLUMN_NAME);
    console.log('✅ 现有过往项目相关字段:', existingColumns);
    
    // 要添加的字段
    const fieldsToAdd = [
      {
        name: 'is_past_project',
        sql: 'ALTER TABLE projects ADD COLUMN is_past_project BOOLEAN DEFAULT FALSE COMMENT "是否为过往项目"'
      },
      {
        name: 'moved_to_past_at',
        sql: 'ALTER TABLE projects ADD COLUMN moved_to_past_at DATETIME NULL COMMENT "移动到过往项目的时间"'
      },
      {
        name: 'moved_to_past_by',
        sql: 'ALTER TABLE projects ADD COLUMN moved_to_past_by INT NULL COMMENT "移动到过往项目的操作人ID"'
      }
    ];
    
    // 添加字段
    for (const field of fieldsToAdd) {
      if (!existingColumns.includes(field.name)) {
        try {
          console.log(`➕ 添加字段: ${field.name}`);
          await connection.execute(field.sql);
          console.log(`✅ ${field.name} 字段添加成功`);
        } catch (error) {
          console.error(`❌ ${field.name} 字段添加失败:`, error.message);
          throw error;
        }
      } else {
        console.log(`⏭️  ${field.name} 字段已存在，跳过`);
      }
    }
    
    // 添加外键约束
    console.log('🔗 添加外键约束...');
    try {
      await connection.execute(`
        ALTER TABLE projects 
        ADD CONSTRAINT fk_projects_moved_to_past_by 
        FOREIGN KEY (moved_to_past_by) REFERENCES users(id) ON DELETE SET NULL
      `);
      console.log('✅ moved_to_past_by外键约束添加成功');
    } catch (error) {
      if (error.code === 'ER_DUP_KEYNAME') {
        console.log('⏭️  moved_to_past_by外键约束已存在，跳过');
      } else {
        console.log('⚠️  moved_to_past_by外键约束添加失败:', error.message);
      }
    }
    
    // 添加索引
    console.log('📊 添加索引...');
    const indexesToAdd = [
      {
        name: 'idx_projects_is_past_project',
        sql: 'CREATE INDEX idx_projects_is_past_project ON projects(is_past_project)'
      },
      {
        name: 'idx_projects_past_project_date',
        sql: 'CREATE INDEX idx_projects_past_project_date ON projects(is_past_project, moved_to_past_at)'
      }
    ];
    
    for (const index of indexesToAdd) {
      try {
        console.log(`📊 添加索引: ${index.name}`);
        await connection.execute(index.sql);
        console.log(`✅ ${index.name} 索引添加成功`);
      } catch (error) {
        if (error.code === 'ER_DUP_KEYNAME') {
          console.log(`⏭️  ${index.name} 索引已存在，跳过`);
        } else {
          console.error(`❌ ${index.name} 索引添加失败:`, error.message);
        }
      }
    }
    
    // 验证字段和索引
    console.log('🔍 验证添加的字段和索引...');
    const [finalColumns] = await connection.execute(`
      SELECT COLUMN_NAME, DATA_TYPE, IS_NULLABLE, COLUMN_DEFAULT, COLUMN_COMMENT
      FROM INFORMATION_SCHEMA.COLUMNS 
      WHERE TABLE_SCHEMA = ? AND TABLE_NAME = 'projects'
      AND COLUMN_NAME IN ('is_past_project', 'moved_to_past_at', 'moved_to_past_by')
      ORDER BY COLUMN_NAME
    `, [dbConfig.database]);
    
    console.log('📋 过往项目相关字段详情:');
    finalColumns.forEach(col => {
      console.log(`  - ${col.COLUMN_NAME}: ${col.DATA_TYPE} | ${col.IS_NULLABLE} | ${col.COLUMN_DEFAULT} | ${col.COLUMN_COMMENT}`);
    });
    
    const [indexes] = await connection.execute(`
      SELECT INDEX_NAME, COLUMN_NAME
      FROM INFORMATION_SCHEMA.STATISTICS 
      WHERE TABLE_SCHEMA = ? AND TABLE_NAME = 'projects'
      AND INDEX_NAME LIKE '%past%'
      ORDER BY INDEX_NAME, SEQ_IN_INDEX
    `, [dbConfig.database]);
    
    console.log('📊 过往项目相关索引:');
    indexes.forEach(idx => {
      console.log(`  - ${idx.INDEX_NAME}: ${idx.COLUMN_NAME}`);
    });
    
    console.log('🎉 过往项目字段迁移完成！');
    
  } catch (error) {
    console.error('❌ 迁移失败:', error);
    process.exit(1);
  } finally {
    if (connection) {
      await connection.end();
      console.log('🔐 数据库连接已关闭');
    }
  }
}

addPastProjectFields().catch(console.error);