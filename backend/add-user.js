require('dotenv').config();
const { sequelize } = require('./src/utils/database');
const models = require('./src/models');

async function addUser() {
  try {
    console.log('开始添加新用户...');
    
    const { User } = models;
    
    // 检查蔺晓杰是否已经存在
    const existingUser = await User.findOne({ where: { name: '蔺晓杰' } });
    
    if (existingUser) {
      console.log('⚠️ 用户"蔺晓杰"已存在，跳过创建');
    } else {
      // 创建新用户
      await User.create({
        name: '蔺晓杰',
        role: 'operator'
      });
      
      console.log('✅ 用户"蔺晓杰"创建成功');
    }
    
    // 显示所有用户
    const users = await User.findAll();
    console.log('👥 当前用户列表:');
    users.forEach(user => {
      console.log(`- ${user.name} (${user.role})`);
    });
    
  } catch (error) {
    console.error('❌ 添加用户失败:', error);
  } finally {
    await sequelize.close();
    process.exit(0);
  }
}

addUser();