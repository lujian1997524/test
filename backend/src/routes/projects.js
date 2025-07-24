const express = require('express');
const { Project, Material, Drawing, ThicknessSpec, Worker, User } = require('../models');
const { Op } = require('sequelize');
const { authenticate, requireOperator, requireAdmin } = require('../middleware/auth');
const sseManager = require('../utils/sseManager');

const router = express.Router();

// 获取项目列表
router.get('/', authenticate, async (req, res) => {
  try {
    const { search, status, priority, page = 1, limit = 20 } = req.query;
    
    const whereClause = {};
    
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
              association: 'completedByWorker',
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
      }, req.user.id); // 排除创建者自己
      
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
        }, req.user.id); // 排除操作者自己
        
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
      }, req.user.id); // 排除删除者自己
      
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