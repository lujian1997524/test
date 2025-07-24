require('dotenv').config();
const { sequelize } = require('./src/utils/database');
const models = require('./src/models');

async function createSampleData() {
  try {
    console.log('开始创建示例数据...');
    
    const { ThicknessSpec, Project, Material, User, Worker } = models;
    
    // 先检查用户和工人
    const users = await User.findAll();
    const workers = await Worker.findAll();
    
    console.log(`用户数量: ${users.length}, 工人数量: ${workers.length}`);
    
    // 创建厚度规格
    const thicknessSpecs = await ThicknessSpec.bulkCreate([
      { thickness: 1.0, unit: 'mm', materialType: '不锈钢', sortOrder: 1 },
      { thickness: 1.5, unit: 'mm', materialType: '不锈钢', sortOrder: 2 },
      { thickness: 2.0, unit: 'mm', materialType: '不锈钢', sortOrder: 3 },
      { thickness: 3.0, unit: 'mm', materialType: '不锈钢', sortOrder: 4 },
      { thickness: 5.0, unit: 'mm', materialType: '不锈钢', sortOrder: 5 },
      { thickness: 1.0, unit: 'mm', materialType: '碳钢', sortOrder: 6 },
      { thickness: 2.0, unit: 'mm', materialType: '碳钢', sortOrder: 7 },
      { thickness: 3.0, unit: 'mm', materialType: '碳钢', sortOrder: 8 },
    ]);
    
    console.log(`✅ 创建了 ${thicknessSpecs.length} 个厚度规格`);
    
    // 创建示例项目
    const projects = await Project.bulkCreate([
      {
        name: '激光切割设备外壳项目',
        description: '为新型激光切割设备设计和制造外壳组件',
        priority: 'high',
        status: 'in_progress',
        startDate: new Date('2025-01-15'),
        endDate: new Date('2025-02-28'),
        createdBy: users[0].id, // 高春强
        assignedWorkerId: workers.length > 0 ? workers[0].id : null // 高长春
      },
      {
        name: '工业控制柜生产',
        description: '批量生产工业自动化控制柜的钣金件',
        priority: 'medium',
        status: 'pending',
        startDate: new Date('2025-02-01'),
        endDate: new Date('2025-03-15'),
        createdBy: users[0].id
      },
      {
        name: '精密零部件加工',
        description: '高精度要求的小批量精密零部件加工',
        priority: 'urgent',
        status: 'pending',
        createdBy: users.length > 1 ? users[1].id : users[0].id // 杨伟
      }
    ]);
    
    console.log(`✅ 创建了 ${projects.length} 个示例项目`);
    
    // 为第一个项目创建板材记录
    const materials = await Material.bulkCreate([
      {
        projectId: projects[0].id,
        thicknessSpecId: thicknessSpecs[0].id, // 1.0mm 不锈钢
        quantity: 10,
        status: 'completed',
        completedDate: new Date(),
        completedBy: workers.length > 0 ? workers[0].id : null,
        notes: '外壳侧板'
      },
      {
        projectId: projects[0].id,
        thicknessSpecId: thicknessSpecs[2].id, // 2.0mm 不锈钢
        quantity: 5,
        status: 'in_progress',
        notes: '底板'
      },
      {
        projectId: projects[0].id,
        thicknessSpecId: thicknessSpecs[3].id, // 3.0mm 不锈钢
        quantity: 3,
        status: 'pending',
        notes: '支撑框架'
      }
    ]);
    
    console.log(`✅ 创建了 ${materials.length} 个板材记录`);
    
    console.log('🎉 示例数据创建完成！');
    
  } catch (error) {
    console.error('❌ 创建示例数据失败:', error);
  } finally {
    await sequelize.close();
    process.exit(0);
  }
}

createSampleData();