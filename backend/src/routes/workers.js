const express = require('express');
const { Worker } = require('../models');
const { Op } = require('sequelize');
const { authenticate, requireAdmin, requireOperator } = require('../middleware/auth');

const router = express.Router();

// 获取工人列表
router.get('/', authenticate, async (req, res) => {
  try {
    const { search, department, status = 'active', page = 1, limit = 50 } = req.query;
    
    const whereClause = { status };
    
    // 搜索条件
    if (search) {
      whereClause[Op.or] = [
        { name: { [Op.like]: `%${search}%` } },
        { phone: { [Op.like]: `%${search}%` } },
        { email: { [Op.like]: `%${search}%` } }
      ];
    }
    
    // 部门筛选
    if (department) {
      whereClause.department = department;
    }

    const offset = (parseInt(page) - 1) * parseInt(limit);

    const { count, rows: workers } = await Worker.findAndCountAll({
      where: whereClause,
      order: [['createdAt', 'DESC']],
      limit: parseInt(limit),
      offset
    });

    res.json({
      workers,
      pagination: {
        total: count,
        page: parseInt(page),
        limit: parseInt(limit),
        pages: Math.ceil(count / parseInt(limit))
      }
    });

  } catch (error) {
    console.error('获取工人列表错误:', error);
    res.status(500).json({
      error: '获取工人列表失败',
      message: error.message
    });
  }
});

// 获取单个工人信息
router.get('/:id', authenticate, async (req, res) => {
  try {
    const { id } = req.params;
    
    const worker = await Worker.findByPk(id, {
      include: [
        {
          association: 'assignedProjects',
          attributes: ['id', 'name', 'status', 'priority']
        },
        {
          association: 'completedMaterials',
          attributes: ['id', 'status', 'completedDate']
        }
      ]
    });

    if (!worker) {
      return res.status(404).json({
        error: '工人不存在'
      });
    }

    res.json({ worker });

  } catch (error) {
    console.error('获取工人信息错误:', error);
    res.status(500).json({
      error: '获取工人信息失败',
      message: error.message
    });
  }
});

// 创建工人
router.post('/', authenticate, requireOperator, async (req, res) => {
  try {
    const { name, phone, email, department, position, skillTags, notes } = req.body;

    if (!name) {
      return res.status(400).json({
        error: '工人姓名不能为空'
      });
    }

    const worker = await Worker.create({
      name: name.trim(),
      phone,
      email,
      department,
      position,
      skillTags: skillTags ? JSON.stringify(skillTags) : null,
      notes
    });

    res.status(201).json({
      message: '工人创建成功',
      worker
    });

  } catch (error) {
    console.error('创建工人错误:', error);
    res.status(500).json({
      error: '创建工人失败',
      message: error.message
    });
  }
});

// 更新工人信息
router.put('/:id', authenticate, requireOperator, async (req, res) => {
  try {
    const { id } = req.params;
    const { name, phone, email, department, position, skillTags, notes, status } = req.body;

    const worker = await Worker.findByPk(id);

    if (!worker) {
      return res.status(404).json({
        error: '工人不存在'
      });
    }

    const updateData = {};
    if (name) updateData.name = name.trim();
    if (phone !== undefined) updateData.phone = phone;
    if (email !== undefined) updateData.email = email;
    if (department !== undefined) updateData.department = department;
    if (position !== undefined) updateData.position = position;
    if (skillTags) updateData.skillTags = JSON.stringify(skillTags);
    if (notes !== undefined) updateData.notes = notes;
    if (status) updateData.status = status;

    await worker.update(updateData);

    res.json({
      message: '工人信息更新成功',
      worker
    });

  } catch (error) {
    console.error('更新工人错误:', error);
    res.status(500).json({
      error: '更新工人失败',
      message: error.message
    });
  }
});

// 删除工人（仅管理员）
router.delete('/:id', authenticate, requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;

    const worker = await Worker.findByPk(id);

    if (!worker) {
      return res.status(404).json({
        error: '工人不存在'
      });
    }

    await worker.destroy();

    res.json({
      message: '工人删除成功'
    });

  } catch (error) {
    console.error('删除工人错误:', error);
    res.status(500).json({
      error: '删除工人失败',
      message: error.message
    });
  }
});

// 获取工人的项目列表
router.get('/:id/projects', authenticate, async (req, res) => {
  try {
    const { id } = req.params;
    
    const worker = await Worker.findByPk(id, {
      include: [
        {
          association: 'assignedProjects',
          include: [
            {
              association: 'materials',
              include: ['thicknessSpec']
            }
          ]
        }
      ]
    });

    if (!worker) {
      return res.status(404).json({
        error: '工人不存在'
      });
    }

    res.json({
      worker: {
        id: worker.id,
        name: worker.name
      },
      projects: worker.assignedProjects
    });

  } catch (error) {
    console.error('获取工人项目错误:', error);
    res.status(500).json({
      error: '获取工人项目失败',
      message: error.message
    });
  }
});

module.exports = router;