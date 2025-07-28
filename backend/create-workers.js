const { Worker, User } = require('./src/models');

async function createWorkers() {
  try {
    console.log('开始创建高春强和郭金义的工人记录...');
    
    // 创建高春强工人记录
    const gaoChunqiang = await Worker.create({
      name: '高春强',
      phone: '13800138001',
      email: 'gaochunqiang@company.com',
      department: '生产部',
      position: '班组长',
      skillTags: '激光切割,板材管理,质量控制',
      notes: '经验丰富的班组长，负责生产计划和板材库存管理',
      status: 'active'
    });
    
    console.log(`✅ 创建工人记录: ${gaoChunqiang.name} (ID: ${gaoChunqiang.id})`);
    
    // 创建郭金义工人记录
    const guoJinyi = await Worker.create({
      name: '郭金义',
      phone: '13800138002',
      email: 'guojinyi@company.com',
      department: '生产部',
      position: '操作员',
      skillTags: '激光切割,板材加工,设备维护',
      notes: '熟练的激光切割操作员，负责日常生产作业',
      status: 'active'
    });
    
    console.log(`✅ 创建工人记录: ${guoJinyi.name} (ID: ${guoJinyi.id})`);
    
    // 更新用户记录的workerId
    const userGao = await User.findOne({ where: { name: '高春强' } });
    if (userGao) {
      await userGao.update({ workerId: gaoChunqiang.id });
      console.log(`✅ 关联用户 ${userGao.name} 到工人记录`);
    }
    
    // 检查是否有郭金义用户，如果没有则创建
    let userGuo = await User.findOne({ where: { name: '郭金义' } });
    if (!userGuo) {
      userGuo = await User.create({
        name: '郭金义',
        role: 'operator',
        workerId: guoJinyi.id
      });
      console.log(`✅ 创建用户记录: ${userGuo.name}`);
    } else {
      await userGuo.update({ workerId: guoJinyi.id });
      console.log(`✅ 关联用户 ${userGuo.name} 到工人记录`);
    }
    
    console.log('\n工人和用户记录创建完成！');
    
  } catch (error) {
    console.error('创建工人记录时出错:', error);
  } finally {
    process.exit(0);
  }
}

createWorkers();