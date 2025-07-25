const express = require('express');
const { Project, Material, Drawing, ThicknessSpec, Worker, User } = require('../models');
const { Op } = require('sequelize');
const { authenticate, requireOperator, requireAdmin } = require('../middleware/auth');
const sseManager = require('../utils/sseManager');

const router = express.Router();

// 获取项目列表
router.get('/', authenticate, async (req, res) => {
  try {
    const { 
      search, 
      status, 
      priority, 
      page = 1, 
      limit = 20 
    } = req.query;
    
    const whereClause = {
      isPastProject: false // 只获取非过往项目
    };
    
    // 搜索条件
    if (search) {
      whereClause[Op.or] = [
        { name: { [Op.like]: `%${search}%` } },
        { description: { [Op.like]: `%${search}%` } }
      ];
    }
    
    // 状态筛选
    if (status) {
      whereClause.status = status;
    }
    
    // 优先级筛选
    if (priority) {
      whereClause.priority = priority;
    }

    const offset = (parseInt(page) - 1) * parseInt(limit);

    const { count, rows: projects } = await Project.findAndCountAll({
      where: whereClause,
      include: [
        {
          association: 'creator',
          attributes: ['id', 'name']
        },
        {
          association: 'assignedWorker',
          attributes: ['id', 'name', 'department']
        },
        {
          association: 'materials',
          include: ['thicknessSpec']
        }
      ],
      order: [['priority', 'DESC'], ['createdAt', 'DESC']],
      limit: parseInt(limit),
      offset
    });

    res.json({
      projects,
      pagination: {
        total: count,
        page: parseInt(page),
        limit: parseInt(limit),
        pages: Math.ceil(count / parseInt(limit))
      }
    });

  } catch (error) {
    console.error('获取项目列表错误:', error);
    res.status(500).json({
      error: '获取项目列表失败',
      message: error.message
    });
  }
});

// 获取已完成任务（状态为completed且超过1天的项目）
router.get('/completed', authenticate, async (req, res) => {
  try {
    const { workerName, page = 1, limit = 20 } = req.query;
    
    const whereClause = {
      status: 'completed'
    };
    
    // 超过1天的条件
    const oneDayAgo = new Date();
    oneDayAgo.setDate(oneDayAgo.getDate() - 1);
    whereClause.updatedAt = {
      [Op.lt]: oneDayAgo
    };

    const include = [
      {
        association: 'creator',
        attributes: ['id', 'name']
      },
      {
        association: 'assignedWorker',
        attributes: ['id', 'name', 'department']
      },
      {
        association: 'materials',
        include: ['thicknessSpec']
      }
    ];

    // 如果有工人姓名筛选
    if (workerName) {
      include[1].where = {
        name: { [Op.like]: `%${workerName}%` }
      };
      include[1].required = true; // 内连接确保有分配工人
    }

    const offset = (parseInt(page) - 1) * parseInt(limit);

    const { count, rows: projects } = await Project.findAndCountAll({
      where: whereClause,
      include,
      order: [['updatedAt', 'DESC']],
      limit: parseInt(limit),
      offset
    });

    res.json({
      projects,
      pagination: {
        total: count,
        page: parseInt(page),
        limit: parseInt(limit),
        pages: Math.ceil(count / parseInt(limit))
      }
    });

  } catch (error) {
    console.error('获取已完成任务错误:', error);
    res.status(500).json({
      error: '获取已完成任务失败',
      message: error.message
    });
  }
});

// ===== 过往项目相关API =====

// 获取过往项目列表（按月份分组）
router.get('/past', authenticate, async (req, res) => {
  try {
    const { year, month, page = 1, limit = 20 } = req.query;
    
    const whereClause = {
      isPastProject: true
    };
    
    // 如果指定了年月，添加时间范围筛选
    if (year && month) {
      const startDate = new Date(parseInt(year), parseInt(month) - 1, 1);
      const endDate = new Date(parseInt(year), parseInt(month), 0);
      endDate.setHours(23, 59, 59, 999);
      
      whereClause.movedToPastAt = {
        [Op.between]: [startDate, endDate]
      };
    }

    const offset = (parseInt(page) - 1) * parseInt(limit);

    const { count, rows: projects } = await Project.findAndCountAll({
      where: whereClause,
      include: [
        {
          association: 'creator',
          attributes: ['id', 'name']
        },
        {
          association: 'assignedWorker',
          attributes: ['id', 'name', 'department']
        },
        {
          association: 'pastProjectMover',
          attributes: ['id', 'name']
        },
        {
          association: 'materials',
          include: [{
            association: 'thicknessSpec'
          }, {
            association: 'completedByUser',
            attributes: ['id', 'name']
          }]
        }
      ],
      order: [['movedToPastAt', 'DESC']],
      limit: parseInt(limit),
      offset
    });

    // 如果没有指定年月，则按月份分组返回
    if (!year || !month) {
      const groupedByMonth = projects.reduce((acc, project) => {
        const movedDate = new Date(project.movedToPastAt);
        const monthKey = `${movedDate.getFullYear()}-${String(movedDate.getMonth() + 1).padStart(2, '0')}`;
        
        if (!acc[monthKey]) {
          acc[monthKey] = [];
        }
        acc[monthKey].push(project);
        
        return acc;
      }, {});
      
      res.json({
        projectsByMonth: groupedByMonth,
        pagination: {
          total: count,
          page: parseInt(page),
          limit: parseInt(limit),
          pages: Math.ceil(count / parseInt(limit))
        }
      });
    } else {
      res.json({
        projects,
        pagination: {
          total: count,
          page: parseInt(page),
          limit: parseInt(limit),
          pages: Math.ceil(count / parseInt(limit))
        }
      });
    }

  } catch (error) {
    console.error('获取过往项目错误:', error);
    res.status(500).json({
      error: '获取过往项目失败',
      message: error.message
    });
  }
});

// 移动已完成项目到过往项目
router.post('/:id/move-to-past', authenticate, requireOperator, async (req, res) => {
  try {
    const { id } = req.params;

    const project = await Project.findByPk(id);

    if (!project) {
      return res.status(404).json({
        error: '项目不存在'
      });
    }

    // 检查项目状态是否为已完成
    if (project.status !== 'completed') {
      return res.status(400).json({
        error: '只能移动已完成的项目到过往项目'
      });
    }

    // 检查是否已经是过往项目
    if (project.isPastProject) {
      return res.status(400).json({
        error: '项目已经是过往项目'
      });
    }

    // 更新项目为过往项目
    await project.update({
      isPastProject: true,
      movedToPastAt: new Date(),
      movedToPastBy: req.user.id
    });

    // 获取更新后的完整信息
    const updatedProject = await Project.findByPk(id, {
      include: [
        {
          association: 'creator',
          attributes: ['id', 'name']
        },
        {
          association: 'assignedWorker',
          attributes: ['id', 'name']
        },
        {
          association: 'pastProjectMover',
          attributes: ['id', 'name']
        }
      ]
    });

    res.json({
      message: '项目已移动到过往项目',
      project: updatedProject
    });

    // 发送SSE事件通知其他用户
    try {
      sseManager.broadcast('project-moved-to-past', {
        project: updatedProject,
        userName: req.user.name,
        userId: req.user.id
      }, req.user.id);
      
      console.log(`SSE事件已发送: 项目移动到过往 - ${updatedProject.name}`);
    } catch (sseError) {
      console.error('发送SSE事件失败:', sseError);
    }

  } catch (error) {
    console.error('移动项目到过往错误:', error);
    res.status(500).json({
      error: '移动项目到过往失败',
      message: error.message
    });
  }
});

// 恢复过往项目到活跃状态
router.post('/:id/restore-from-past', authenticate, requireOperator, async (req, res) => {
  try {
    const { id } = req.params;

    const project = await Project.findByPk(id);

    if (!project) {
      return res.status(404).json({
        error: '项目不存在'
      });
    }

    // 检查是否是过往项目
    if (!project.isPastProject) {
      return res.status(400).json({
        error: '只能恢复过往项目到活跃状态'
      });
    }

    // 恢复项目到活跃状态
    await project.update({
      isPastProject: false,
      movedToPastAt: null,
      movedToPastBy: null
    });

    // 获取更新后的完整信息
    const updatedProject = await Project.findByPk(id, {
      include: [
        {
          association: 'creator',
          attributes: ['id', 'name']
        },
        {
          association: 'assignedWorker',
          attributes: ['id', 'name']
        }
      ]
    });

    res.json({
      message: '项目已恢复到活跃状态',
      project: updatedProject
    });

    // 发送SSE事件通知其他用户
    try {
      sseManager.broadcast('project-restored-from-past', {
        project: updatedProject,
        userName: req.user.name,
        userId: req.user.id
      }, req.user.id);
      
      console.log(`SSE事件已发送: 项目从过往恢复 - ${updatedProject.name}`);
    } catch (sseError) {
      console.error('发送SSE事件失败:', sseError);
    }

  } catch (error) {
    console.error('恢复过往项目错误:', error);
    res.status(500).json({
      error: '恢复过往项目失败',
      message: error.message
    });
  }
});

// 获取单个项目详情
router.get('/:id', authenticate, async (req, res) => {
  try {
    const { id } = req.params;
    
    const project = await Project.findByPk(id, {
      include: [
        {
          association: 'creator',
          attributes: ['id', 'name']
        },
        {
          association: 'assignedWorker',
          attributes: ['id', 'name', 'department', 'phone']
        },
        {
          association: 'materials',
          include: [
            {
              association: 'thicknessSpec',
              attributes: ['id', 'thickness', 'unit', 'materialType']
            },
            {
              association: 'completedByUser',
              attributes: ['id', 'name']
            }
          ]
        },
        {
          association: 'drawings',
          include: [
            {
              association: 'uploader',
              attributes: ['id', 'name']
            }
          ]
        }
      ]
    });

    if (!project) {
      return res.status(404).json({
        error: '项目不存在'
      });
    }

    res.json({ project });

  } catch (error) {
    console.error('获取项目详情错误:', error);
    res.status(500).json({
      error: '获取项目详情失败',
      message: error.message
    });
  }
});

// 创建项目
router.post('/', authenticate, requireOperator, async (req, res) => {
  try {
    const { 
      name, 
      description, 
      priority = 'medium', 
      startDate, 
      endDate, 
      assignedWorkerId,
      createdBy = req.user.id
    } = req.body;

    if (!name) {
      return res.status(400).json({
        error: '项目名称不能为空'
      });
    }

    const project = await Project.create({
      name: name.trim(),
      description,
      priority,
      startDate,
      endDate,
      assignedWorkerId,
      createdBy
    });

    // 获取完整的项目信息返回
    const newProject = await Project.findByPk(project.id, {
      include: [
        {
          association: 'creator',
          attributes: ['id', 'name']
        },
        {
          association: 'assignedWorker',
          attributes: ['id', 'name']
        }
      ]
    });

    res.status(201).json({
      message: '项目创建成功',
      project: newProject
    });

    // 发送SSE事件通知其他用户
    try {
      sseManager.broadcast('project-created', {
        project: newProject,
        userName: req.user.name,
        userId: req.user.id
      }, req.user.id);
      
      console.log(`SSE事件已发送: 项目创建 - ${newProject.name}`);
    } catch (sseError) {
      console.error('发送SSE事件失败:', sseError);
    }

  } catch (error) {
    console.error('创建项目错误:', error);
    res.status(500).json({
      error: '创建项目失败',
      message: error.message
    });
  }
});

// 更新项目
router.put('/:id', authenticate, requireOperator, async (req, res) => {
  try {
    const { id } = req.params;
    const { name, description, status, priority, startDate, endDate, assignedWorkerId } = req.body;

    const project = await Project.findByPk(id);

    if (!project) {
      return res.status(404).json({
        error: '项目不存在'
      });
    }

    // 保存原始项目状态用于比较
    const originalStatus = project.status;

    const updateData = {};
    if (name) updateData.name = name.trim();
    if (description !== undefined) updateData.description = description;
    if (status) updateData.status = status;
    if (priority) updateData.priority = priority;
    if (startDate !== undefined) updateData.startDate = startDate;
    if (endDate !== undefined) updateData.endDate = endDate;
    if (assignedWorkerId !== undefined) updateData.assignedWorkerId = assignedWorkerId;

    await project.update(updateData);

    // 获取更新后的完整信息
    const updatedProject = await Project.findByPk(id, {
      include: [
        {
          association: 'creator',
          attributes: ['id', 'name']
        },
        {
          association: 'assignedWorker',
          attributes: ['id', 'name']
        }
      ]
    });

    res.json({
      message: '项目更新成功',
      project: updatedProject
    });

    // 如果项目状态发生变化，发送SSE事件
    if (status && status !== originalStatus) {
      try {
        sseManager.broadcast('project-status-changed', {
          project: updatedProject,
          oldStatus: originalStatus,
          newStatus: status,
          userName: req.user.name,
          userId: req.user.id
        }, req.user.id);
        
        console.log(`SSE事件已发送: 项目状态变更 - ${updatedProject.name} (${originalStatus} → ${status})`);
      } catch (sseError) {
        console.error('发送SSE事件失败:', sseError);
      }
    }

  } catch (error) {
    console.error('更新项目错误:', error);
    res.status(500).json({
      error: '更新项目失败',
      message: error.message
    });
  }
});

// 删除项目（仅管理员）
router.delete('/:id', authenticate, requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;

    const project = await Project.findByPk(id);

    if (!project) {
      return res.status(404).json({
        error: '项目不存在'
      });
    }

    // 保存项目信息用于SSE事件
    const projectInfo = {
      id: project.id,
      name: project.name
    };

    await project.destroy();

    res.json({
      message: '项目删除成功'
    });

    // 发送SSE事件通知其他用户
    try {
      sseManager.broadcast('project-deleted', {
        projectId: projectInfo.id,
        projectName: projectInfo.name,
        userName: req.user.name,
        userId: req.user.id
      }, req.user.id);
      
      console.log(`SSE事件已发送: 项目删除 - ${projectInfo.name}`);
    } catch (sseError) {
      console.error('发送SSE事件失败:', sseError);
    }

  } catch (error) {
    console.error('删除项目错误:', error);
    res.status(500).json({
      error: '删除项目失败',
      message: error.message
    });
  }
});

// 获取项目的板材列表
router.get('/:id/materials', authenticate, async (req, res) => {
  try {
    const { id } = req.params;
    
    const materials = await Material.findAll({
      where: { projectId: id },
      include: [
        {
          association: 'thicknessSpec',
          attributes: ['id', 'thickness', 'unit', 'materialType']
        },
        {
          association: 'completedByWorker',
          attributes: ['id', 'name']
        }
      ],
      order: [['thicknessSpec', 'sortOrder', 'ASC']]
    });

    res.json({ materials });

  } catch (error) {
    console.error('获取项目板材错误:', error);
    res.status(500).json({
      error: '获取项目板材失败',
      message: error.message
    });
  }
});

// 添加项目板材
router.post('/:id/materials', authenticate, requireOperator, async (req, res) => {
  try {
    const { id } = req.params;
    const { thicknessSpecId, quantity = 1, notes } = req.body;

    if (!thicknessSpecId) {
      return res.status(400).json({
        error: '厚度规格不能为空'
      });
    }

    const material = await Material.create({
      projectId: id,
      thicknessSpecId,
      quantity,
      notes
    });

    // 获取完整的板材信息
    const newMaterial = await Material.findByPk(material.id, {
      include: [
        {
          association: 'thicknessSpec',
          attributes: ['id', 'thickness', 'unit', 'materialType']
        }
      ]
    });

    res.status(201).json({
      message: '板材添加成功',
      material: newMaterial
    });

  } catch (error) {
    console.error('添加项目板材错误:', error);
    res.status(500).json({
      error: '添加项目板材失败',
      message: error.message
    });
  }
});

module.exports = router;