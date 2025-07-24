const express = require('express');
const router = express.Router();
const { Op } = require('sequelize');
const { authenticate } = require('../middleware/auth');
const { Project, Worker, Drawing, User, ThicknessSpec } = require('../models');

/**
 * 全局搜索
 * GET /api/search?q=关键词&type=项目类型&limit=结果数量
 */
router.get('/', authenticate, async (req, res) => {
  try {
    const { q, type, limit = 50 } = req.query;
    
    if (!q || q.trim().length < 1) {
      return res.json({
        success: true,
        results: {
          projects: [],
          workers: [],
          drawings: [],
          total: 0
        }
      });
    }

    const searchTerm = q.trim();
    const searchLimit = Math.min(parseInt(limit), 100); // 最大限制100条结果
    
    const results = {
      projects: [],
      workers: [],
      drawings: [],
      total: 0
    };

    // 搜索项目
    if (!type || type === 'projects') {
      const projects = await Project.findAll({
        where: {
          [Op.or]: [
            { name: { [Op.like]: `%${searchTerm}%` } },
            { description: { [Op.like]: `%${searchTerm}%` } }
          ]
        },
        include: [
          {
            model: User,
            as: 'creator',
            attributes: ['id', 'name']
          },
          {
            model: Worker,
            as: 'assignedWorker',
            attributes: ['id', 'name', 'department']
          }
        ],
        limit: Math.ceil(searchLimit / 3),
        order: [['updatedAt', 'DESC']]
      });

      results.projects = projects.map(project => ({
        id: project.id,
        name: project.name,
        description: project.description,
        status: project.status,
        priority: project.priority,
        creator: project.creator,
        assignedWorker: project.assignedWorker,
        createdAt: project.createdAt,
        updatedAt: project.updatedAt,
        type: 'project'
      }));
    }

    // 搜索工人
    if (!type || type === 'workers') {
      const workers = await Worker.findAll({
        where: {
          [Op.or]: [
            { name: { [Op.like]: `%${searchTerm}%` } },
            { department: { [Op.like]: `%${searchTerm}%` } },
            { position: { [Op.like]: `%${searchTerm}%` } },
            { phone: { [Op.like]: `%${searchTerm}%` } }
          ]
        },
        limit: Math.ceil(searchLimit / 3),
        order: [['name', 'ASC']]
      });

      results.workers = workers.map(worker => ({
        id: worker.id,
        name: worker.name,
        department: worker.department,
        position: worker.position,
        phone: worker.phone,
        email: worker.email,
        createdAt: worker.createdAt,
        type: 'worker'
      }));
    }

    // 搜索图纸
    if (!type || type === 'drawings') {
      const drawings = await Drawing.findAll({
        where: {
          [Op.or]: [
            { filename: { [Op.like]: `%${searchTerm}%` } },
            { description: { [Op.like]: `%${searchTerm}%` } }
          ]
        },
        include: [
          {
            model: Project,
            as: 'project',
            attributes: ['id', 'name']
          },
          {
            model: User,
            as: 'uploader',
            attributes: ['id', 'name']
          }
        ],
        limit: Math.ceil(searchLimit / 3),
        order: [['createdAt', 'DESC']]
      });

      results.drawings = drawings.map(drawing => ({
        id: drawing.id,
        filename: drawing.filename,
        description: drawing.description,
        version: drawing.version,
        project: drawing.project,
        uploader: drawing.uploader,
        createdAt: drawing.createdAt,
        type: 'drawing'
      }));
    }

    results.total = results.projects.length + results.workers.length + results.drawings.length;

    res.json({
      success: true,
      results,
      query: searchTerm,
      searchTime: new Date().toISOString()
    });

  } catch (error) {
    console.error('搜索失败:', error);
    res.status(500).json({
      success: false,
      error: '搜索失败',
      message: error.message
    });
  }
});

/**
 * 获取搜索建议
 * GET /api/search/suggestions?q=关键词
 */
router.get('/suggestions', authenticate, async (req, res) => {
  try {
    const { q } = req.query;
    
    if (!q || q.trim().length < 1) {
      return res.json({
        success: true,
        suggestions: []
      });
    }

    const searchTerm = q.trim();
    const suggestions = [];

    // 从项目名称获取建议
    const projects = await Project.findAll({
      where: {
        name: { [Op.like]: `%${searchTerm}%` }
      },
      attributes: ['name'],
      limit: 5
    });

    projects.forEach(project => {
      if (project.name.toLowerCase().includes(searchTerm.toLowerCase())) {
        suggestions.push({
          text: project.name,
          type: 'project',
          icon: '📋'
        });
      }
    });

    // 从工人姓名获取建议
    const workers = await Worker.findAll({
      where: {
        [Op.or]: [
          { name: { [Op.like]: `%${searchTerm}%` } },
          { department: { [Op.like]: `%${searchTerm}%` } }
        ]
      },
      attributes: ['name', 'department'],
      limit: 5
    });

    workers.forEach(worker => {
      suggestions.push({
        text: worker.name,
        type: 'worker',
        icon: '👥',
        extra: worker.department
      });
    });

    // 去重并限制数量
    const uniqueSuggestions = suggestions
      .filter((item, index, self) => 
        index === self.findIndex(s => s.text === item.text && s.type === item.type)
      )
      .slice(0, 8);

    res.json({
      success: true,
      suggestions: uniqueSuggestions
    });

  } catch (error) {
    console.error('获取搜索建议失败:', error);
    res.status(500).json({
      success: false,
      error: '获取搜索建议失败',
      message: error.message
    });
  }
});

/**
 * 高级过滤搜索
 * POST /api/search/advanced
 */
router.post('/advanced', authenticate, async (req, res) => {
  try {
    const { 
      query = '',
      type = 'all',
      filters = {},
      sort = 'relevance',
      limit = 50 
    } = req.body;

    const results = {
      projects: [],
      workers: [],
      drawings: [],
      total: 0
    };

    // 构建搜索条件
    const buildProjectWhere = () => {
      const where = {};
      
      if (query) {
        where[Op.or] = [
          { name: { [Op.like]: `%${query}%` } },
          { description: { [Op.like]: `%${query}%` } }
        ];
      }

      if (filters.status) {
        where.status = filters.status;
      }

      if (filters.priority) {
        where.priority = filters.priority;
      }

      if (filters.dateFrom || filters.dateTo) {
        where.createdAt = {};
        if (filters.dateFrom) {
          where.createdAt[Op.gte] = new Date(filters.dateFrom);
        }
        if (filters.dateTo) {
          where.createdAt[Op.lte] = new Date(filters.dateTo);
        }
      }

      return where;
    };

    const buildWorkerWhere = () => {
      const where = {};
      
      if (query) {
        where[Op.or] = [
          { name: { [Op.like]: `%${query}%` } },
          { department: { [Op.like]: `%${query}%` } },
          { position: { [Op.like]: `%${query}%` } }
        ];
      }

      if (filters.department) {
        where.department = filters.department;
      }

      return where;
    };

    // 排序配置
    const getOrder = (sortType) => {
      switch (sortType) {
        case 'date_desc':
          return [['createdAt', 'DESC']];
        case 'date_asc':
          return [['createdAt', 'ASC']];
        case 'name':
          return [['name', 'ASC']];
        default:
          return [['updatedAt', 'DESC']];
      }
    };

    // 执行搜索
    if (type === 'all' || type === 'projects') {
      const projects = await Project.findAll({
        where: buildProjectWhere(),
        include: [
          {
            model: User,
            as: 'creator',
            attributes: ['id', 'name']
          },
          {
            model: Worker,
            as: 'assignedWorker',
            attributes: ['id', 'name', 'department']
          }
        ],
        order: getOrder(sort),
        limit: Math.min(parseInt(limit), 100)
      });

      results.projects = projects.map(project => ({
        id: project.id,
        name: project.name,
        description: project.description,
        status: project.status,
        priority: project.priority,
        creator: project.creator,
        assignedWorker: project.assignedWorker,
        createdAt: project.createdAt,
        updatedAt: project.updatedAt,
        type: 'project'
      }));
    }

    if (type === 'all' || type === 'workers') {
      const workers = await Worker.findAll({
        where: buildWorkerWhere(),
        order: getOrder(sort),
        limit: Math.min(parseInt(limit), 100)
      });

      results.workers = workers.map(worker => ({
        id: worker.id,
        name: worker.name,
        department: worker.department,
        position: worker.position,
        phone: worker.phone,
        email: worker.email,
        createdAt: worker.createdAt,
        type: 'worker'
      }));
    }

    results.total = results.projects.length + results.workers.length + results.drawings.length;

    res.json({
      success: true,
      results,
      filters: filters,
      sort: sort,
      query: query
    });

  } catch (error) {
    console.error('高级搜索失败:', error);
    res.status(500).json({
      success: false,
      error: '高级搜索失败',
      message: error.message
    });
  }
});

module.exports = router;