const express = require('express');
const router = express.Router();
const { Op } = require('sequelize');
const { Project, Worker, Material, Drawing, User, ThicknessSpec } = require('../models');
const { authenticate } = require('../middleware/auth');

// 获取系统统计数据
router.get('/stats', authenticate, async (req, res) => {
  try {
    // 项目统计
    const projectStats = await Project.findAll({
      attributes: [
        'status',
        [Project.sequelize.fn('COUNT', Project.sequelize.col('id')), 'count']
      ],
      group: ['status']
    });

    // 总项目数
    const totalProjects = await Project.count();

    // 工人统计
    const totalWorkers = await Worker.count();
    
    // 工人工作负载统计（分配的项目数）
    const workerWorkload = await Project.findAll({
      attributes: [
        'assignedWorkerId',
        [Project.sequelize.fn('COUNT', Project.sequelize.col('Project.id')), 'projectCount']
      ],
      include: [
        {
          model: Worker,
          as: 'assignedWorker',
          attributes: ['id', 'name', 'department']
        }
      ],
      where: {
        assignedWorkerId: {
          [Op.not]: null
        }
      },
      group: ['assignedWorkerId', 'assignedWorker.id'],
      order: [[Project.sequelize.literal('projectCount'), 'DESC']],
      limit: 10
    });

    // 板材状态统计
    const materialStats = await Material.findAll({
      attributes: [
        'status',
        [Material.sequelize.fn('COUNT', Material.sequelize.col('id')), 'count']
      ],
      group: ['status']
    });

    // 厚度规格使用统计
    const thicknessUsage = await Material.findAll({
      attributes: [
        'thicknessSpecId',
        [Material.sequelize.fn('COUNT', Material.sequelize.col('Material.id')), 'usage']
      ],
      include: [
        {
          model: ThicknessSpec,
          as: 'thicknessSpec',
          attributes: ['id', 'thickness', 'unit', 'materialType']
        }
      ],
      group: ['thicknessSpecId', 'thicknessSpec.id'],
      order: [[Material.sequelize.fn('COUNT', Material.sequelize.col('Material.id')), 'DESC']],
      limit: 10
    });

    // 图纸统计
    const totalDrawings = await Drawing.count();
    const drawingsPerProject = await Drawing.findAll({
      attributes: [
        'projectId',
        [Drawing.sequelize.fn('COUNT', Drawing.sequelize.col('Drawing.id')), 'drawingCount']
      ],
      include: [
        {
          model: Project,
          as: 'project',
          attributes: ['id', 'name']
        }
      ],
      group: ['projectId', 'project.id'],
      order: [[Drawing.sequelize.fn('COUNT', Drawing.sequelize.col('Drawing.id')), 'DESC']],
      limit: 5
    });

    // 最近活动统计
    const recentProjects = await Project.findAll({
      limit: 5,
      order: [['updatedAt', 'DESC']],
      include: [
        {
          model: User,
          as: 'creator',
          attributes: ['id', 'name']
        },
        {
          model: Worker,
          as: 'assignedWorker',
          attributes: ['id', 'name']
        }
      ]
    });

    // 完成度统计
    const completionStats = await Project.findAll({
      attributes: [
        'id',
        'name',
        [
          Project.sequelize.literal(`
            (SELECT COUNT(*) FROM materials WHERE materials.project_id = Project.id AND materials.status = 'completed') * 100.0 / 
            NULLIF((SELECT COUNT(*) FROM materials WHERE materials.project_id = Project.id), 0)
          `),
          'completionRate'
        ]
      ],
      having: Project.sequelize.literal('completionRate IS NOT NULL'),
      order: [[Project.sequelize.literal('completionRate'), 'DESC']],
      limit: 10
    });

    res.json({
      success: true,
      stats: {
        projects: {
          total: totalProjects,
          byStatus: projectStats.reduce((acc, item) => {
            acc[item.status] = parseInt(item.dataValues.count);
            return acc;
          }, {})
        },
        workers: {
          total: totalWorkers,
          workload: workerWorkload.map(item => ({
            worker: item.assignedWorker,
            projectCount: parseInt(item.dataValues.projectCount)
          }))
        },
        materials: {
          byStatus: materialStats.reduce((acc, item) => {
            acc[item.status] = parseInt(item.dataValues.count);
            return acc;
          }, {}),
          thicknessUsage: thicknessUsage.map(item => ({
            spec: item.thicknessSpec,
            usage: parseInt(item.dataValues.usage)
          }))
        },
        drawings: {
          total: totalDrawings,
          perProject: drawingsPerProject.map(item => ({
            project: item.Project,
            count: parseInt(item.dataValues.drawingCount)
          }))
        },
        recent: {
          projects: recentProjects
        },
        completion: completionStats.map(item => ({
          id: item.id,
          name: item.name,
          rate: parseFloat(item.dataValues.completionRate || 0)
        }))
      }
    });

  } catch (error) {
    console.error('获取统计数据失败:', error);
    res.status(500).json({
      error: '获取统计数据失败',
      details: error.message
    });
  }
});

// 获取图表数据
router.get('/charts', authenticate, async (req, res) => {
  try {
    const { period = '7d' } = req.query;
    
    // 根据期间参数计算开始日期
    const now = new Date();
    let startDate;
    switch (period) {
      case '1d':
        startDate = new Date(now.getTime() - 24 * 60 * 60 * 1000);
        break;
      case '7d':
        startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        break;
      case '30d':
        startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
        break;
      default:
        startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    }

    // 项目创建趋势
    const projectTrend = await Project.findAll({
      attributes: [
        [Project.sequelize.fn('DATE', Project.sequelize.col('createdAt')), 'date'],
        [Project.sequelize.fn('COUNT', Project.sequelize.col('id')), 'count']
      ],
      where: {
        createdAt: {
          [Op.gte]: startDate
        }
      },
      group: [Project.sequelize.fn('DATE', Project.sequelize.col('createdAt'))],
      order: [[Project.sequelize.fn('DATE', Project.sequelize.col('createdAt')), 'ASC']]
    });

    // 材料完成趋势
    const materialTrend = await Material.findAll({
      attributes: [
        [Material.sequelize.fn('DATE', Material.sequelize.col('updatedAt')), 'date'],
        'status',
        [Material.sequelize.fn('COUNT', Material.sequelize.col('id')), 'count']
      ],
      where: {
        updatedAt: {
          [Op.gte]: startDate
        }
      },
      group: [
        Material.sequelize.fn('DATE', Material.sequelize.col('updatedAt')),
        'status'
      ],
      order: [[Material.sequelize.fn('DATE', Material.sequelize.col('updatedAt')), 'ASC']]
    });

    // 图纸上传趋势
    const drawingTrend = await Drawing.findAll({
      attributes: [
        [Drawing.sequelize.fn('DATE', Drawing.sequelize.col('upload_time')), 'date'],
        [Drawing.sequelize.fn('COUNT', Drawing.sequelize.col('id')), 'count']
      ],
      where: {
        uploadTime: {
          [Op.gte]: startDate
        }
      },
      group: [Drawing.sequelize.fn('DATE', Drawing.sequelize.col('upload_time'))],
      order: [[Drawing.sequelize.fn('DATE', Drawing.sequelize.col('upload_time')), 'ASC']]
    });

    res.json({
      success: true,
      charts: {
        projectTrend: projectTrend.map(item => ({
          date: item.dataValues.date,
          count: parseInt(item.dataValues.count)
        })),
        materialTrend: materialTrend.map(item => ({
          date: item.dataValues.date,
          status: item.status,
          count: parseInt(item.dataValues.count)
        })),
        drawingTrend: drawingTrend.map(item => ({
          date: item.dataValues.date,
          count: parseInt(item.dataValues.count)
        }))
      }
    });

  } catch (error) {
    console.error('获取图表数据失败:', error);
    res.status(500).json({
      error: '获取图表数据失败',
      details: error.message
    });
  }
});

module.exports = router;