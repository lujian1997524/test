const { User, Worker } = require('./src/models');

async function linkUsersToWorkers() {
  try {
    console.log('开始关联用户和工人...');
    
    // 获取所有用户
    const users = await User.findAll();
    
    for (const user of users) {
      // 通过姓名查找对应的工人
      const worker = await Worker.findOne({
        where: { name: user.name }
      });
      
      if (worker) {
        // 更新用户的workerId
        await user.update({ workerId: worker.id });
        console.log(`✅ 用户 ${user.name} 已关联到工人 ${worker.name} (ID: ${worker.id})`);
      } else {
        console.log(`⚠️  用户 ${user.name} 没有找到对应的工人记录`);
      }
    }
    
    console.log('用户工人关联完成！');
    
  } catch (error) {
    console.error('关联用户和工人时出错:', error);
  } finally {
    process.exit(0);
  }
}

linkUsersToWorkers();