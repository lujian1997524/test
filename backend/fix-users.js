require('dotenv').config();
const { sequelize } = require('./src/utils/database');
const models = require('./src/models');

async function fixUserData() {
  try {
    console.log('开始修正用户数据...');
    
    const { User, Worker } = models;
    
    // 清空现有数据
    await User.destroy({ where: {} });
    await Worker.destroy({ where: {} });
    
    // 创建正确的系统用户
    await User.bulkCreate([
      { name: '高春强', role: 'admin' },
      { name: '杨伟', role: 'operator' }
    ]);
    
    // 创建工人记录
    await Worker.create({
      name: '高长春',
      department: '生产部',
      position: '激光切割工',
      status: 'active'
    });
    
    console.log('✅ 用户数据修正完成');
    
    // 显示当前数据
    const users = await User.findAll();
    const workers = await Worker.findAll();
    
    console.log('👥 系统用户列表:');
    users.forEach(user => {
      console.log(`- ${user.name} (${user.role})`);
    });
    
    console.log('👷 工人列表:');
    workers.forEach(worker => {
      console.log(`- ${worker.name} (${worker.department})`);
    });
    
  } catch (error) {
    console.error('❌ 数据修正失败:', error);
  } finally {
    await sequelize.close();
    process.exit(0);
  }
}

fixUserData();