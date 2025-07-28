const { MaterialInventory, ThicknessSpec, Worker } = require('./src/models');

async function createInventoryData() {
  try {
    console.log('开始创建库存数据...');
    
    // 获取现有的厚度规格和工人
    const thicknessSpecs = await ThicknessSpec.findAll();
    const workers = await Worker.findAll();
    
    // 找到高春强和郭金义
    const gaoChunqiang = workers.find(w => w.name === '高春强');
    const guoJinyi = workers.find(w => w.name === '郭金义');
    
    if (!gaoChunqiang || !guoJinyi) {
      console.log('警告：未找到高春强或郭金义，将使用现有工人');
    }
    
    console.log(`找到 ${thicknessSpecs.length} 个厚度规格`);
    console.log(`找到 ${workers.length} 个工人`);
    
    // 创建库存数据
    const inventoryData = [];
    
    // 为每个厚度规格创建多条库存记录
    for (const spec of thicknessSpecs) {
      // 高春强的库存
      if (gaoChunqiang) {
        inventoryData.push({
          materialType: spec.materialType,
          thicknessSpecId: spec.id,
          specification: `${spec.thickness}${spec.unit} ${spec.materialType}板`,
          totalQuantity: Math.floor(Math.random() * 50) + 20, // 20-70张
          usedQuantity: Math.floor(Math.random() * 10), // 0-10张已用
          ownerWorkerId: gaoChunqiang.id,
          location: '仓库A区',
          serialNumber: `INV-${spec.id}-${gaoChunqiang.id}-001`,
          notes: `${gaoChunqiang.name}负责管理的${spec.materialType}板材库存`
        });
      }
      
      // 郭金义的库存
      if (guoJinyi) {
        inventoryData.push({
          materialType: spec.materialType,
          thicknessSpecId: spec.id,
          specification: `${spec.thickness}${spec.unit} ${spec.materialType}板`,
          totalQuantity: Math.floor(Math.random() * 40) + 15, // 15-55张
          usedQuantity: Math.floor(Math.random() * 5), // 0-5张已用
          ownerWorkerId: guoJinyi.id,
          location: '仓库B区',
          serialNumber: `INV-${spec.id}-${guoJinyi.id}-001`,
          notes: `${guoJinyi.name}负责管理的${spec.materialType}板材库存`
        });
      }
      
      // 公共库存（无归属工人）
      inventoryData.push({
        materialType: spec.materialType,
        thicknessSpecId: spec.id,
        specification: `${spec.thickness}${spec.unit} ${spec.materialType}板`,
        totalQuantity: Math.floor(Math.random() * 30) + 10, // 10-40张
        usedQuantity: Math.floor(Math.random() * 3), // 0-3张已用
        ownerWorkerId: null,
        location: '公共仓库',
        serialNumber: `INV-${spec.id}-PUBLIC-001`,
        notes: `公共${spec.materialType}板材库存，所有工人可使用`
      });
    }
    
    // 计算剩余数量并批量创建
    for (const data of inventoryData) {
      data.remainingQuantity = data.totalQuantity - data.usedQuantity;
      
      const inventory = await MaterialInventory.create(data);
      console.log(`✅ 创建库存记录: ${inventory.specification} - 总量${inventory.totalQuantity}张，剩余${inventory.remainingQuantity}张`);
    }
    
    console.log(`\n库存数据创建完成！共创建 ${inventoryData.length} 条库存记录`);
    
    // 显示汇总信息
    const summary = await MaterialInventory.findAll({
      attributes: [
        'materialType',
        [MaterialInventory.sequelize.fn('COUNT', '*'), 'count'],
        [MaterialInventory.sequelize.fn('SUM', MaterialInventory.sequelize.col('total_quantity')), 'totalQuantity'],
        [MaterialInventory.sequelize.fn('SUM', MaterialInventory.sequelize.col('remaining_quantity')), 'remainingQuantity']
      ],
      group: ['materialType'],
      raw: true
    });
    
    console.log('\n库存汇总:');
    summary.forEach(item => {
      console.log(`${item.materialType}: ${item.count}条记录，总量${item.totalQuantity}张，剩余${item.remainingQuantity}张`);
    });
    
  } catch (error) {
    console.error('创建库存数据时出错:', error);
  } finally {
    process.exit(0);
  }
}

createInventoryData();