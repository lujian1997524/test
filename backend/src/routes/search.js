const express = require('express');
const router = express.Router();
const { Op } = require('sequelize');
const { authenticate } = require('../middleware/auth');
const { Project, Worker, Drawing, User, ThicknessSpec } = require('../models');

/**
 * 全局搜索 - 支持统一格式
 * GET /api/search?q=关键词&type=搜索类型&limit=结果数量
 */

// 判断是否为时间相关搜索
const isTimeRelatedSearch = (searchTerm) => {
  const timeKeywords = ['最近', '今天', '昨天', '本周', '上周', '本月', '上月', '时间', '日期'];
  const datePattern = /\d{4}[/-]\d{1,2}[/-]\d{1,2}|\d{1,2}[/-]\d{1,2}[/-]\d{4}/;
  
  return timeKeywords.some(keyword => searchTerm.includes(keyword)) || 
         datePattern.test(searchTerm);
};

router.get('/', authenticate, async (req, res) => {
  try {
    const { q, type = 'all', limit = 20 } = req.query;
    
    if (!q || q.trim().length < 2) {
      return res.json({
        success: true,
        results: [],
        total: 0,
        message: '搜索关键词至少需要2个字符'
      });
    }

    const searchTerm = q.trim();
    const searchLimit = Math.min(parseInt(limit), 100);
    let allResults = [];

    // 计算相关性得分的函数
    const calculateRelevanceScore = (item, searchTerm) => {
      let score = 0;
      const term = searchTerm.toLowerCase();
      
      // 完全匹配得分最高
      if (item.title && item.title.toLowerCase() === term) score += 100;
      // 开头匹配得分较高
      if (item.title && item.title.toLowerCase().startsWith(term)) score += 50;
      // 包含匹配得分中等
      if (item.title && item.title.toLowerCase().includes(term)) score += 25;
      // 描述匹配得分较低
      if (item.description && item.description.toLowerCase().includes(term)) score += 10;
      
      return score;
    };

    // 搜索项目
    if (type === 'all' || type === 'projects') {
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
          },
          {
            model: Drawing,
            as: 'drawings',
            attributes: ['id', 'filename', 'description'],
            required: false // LEFT JOIN，即使没有图纸也显示项目
          }
        ],
        limit: searchLimit,
        order: [['updatedAt', 'DESC']]
      });

      projects.forEach(project => {
        // 添加项目结果
        allResults.push({
          id: project.id.toString(),
          type: 'projects',
          title: project.name,
          subtitle: `${project.status === 'active' ? '进行中' : project.status === 'completed' ? '已完成' : '待处理'} | 优先级: ${project.priority === 'high' ? '高' : project.priority === 'medium' ? '中' : '低'}`,
          description: `负责人：${project.assignedWorker?.name || '未分配'} | 创建者：${project.creator?.name || ''} | 图纸数量：${project.drawings?.length || 0}`
        });
        
        // 如果项目有关联图纸，也将相关图纸添加到结果中
        if (project.drawings && project.drawings.length > 0) {
          project.drawings.forEach(drawing => {
            if (drawing.filename.toLowerCase().includes(searchTerm.toLowerCase()) || 
                (drawing.description && drawing.description.toLowerCase().includes(searchTerm.toLowerCase()))) {
              allResults.push({
                id: drawing.id.toString(),
                type: 'drawings',
                title: drawing.filename,
                subtitle: `项目关联图纸 | ${project.name}`,
                description: `项目：${project.name} | 描述：${drawing.description || 'CAD图纸'}`
              });
            }
          });
        }
      });
    }

    // 搜索工人
    if (type === 'all' || type === 'workers') {
      const workers = await Worker.findAll({
        where: {
          [Op.or]: [
            { name: { [Op.like]: `%${searchTerm}%` } },
            { department: { [Op.like]: `%${searchTerm}%` } },
            { position: { [Op.like]: `%${searchTerm}%` } },
            { phone: { [Op.like]: `%${searchTerm}%` } }
          ]
        },
        include: [
          {
            model: Project,
            as: 'assignedProjects',
            attributes: ['id', 'name', 'status', 'description'],
            required: false, // LEFT JOIN，即使没有项目也显示工人
            include: [
              {
                model: Drawing,
                as: 'drawings',
                attributes: ['id', 'filename', 'description'],
                required: false // LEFT JOIN，即使没有图纸也显示项目
              }
            ]
          }
        ],
        limit: searchLimit,
        order: [['name', 'ASC']]
      });

      workers.forEach(worker => {
        const activeProjects = worker.assignedProjects?.filter(p => p.status !== 'completed') || [];
        const completedProjects = worker.assignedProjects?.filter(p => p.status === 'completed') || [];
        
        // 添加工人结果
        allResults.push({
          id: worker.id.toString(),
          type: 'workers',
          title: worker.name,
          subtitle: worker.position || '员工',
          description: `部门：${worker.department || '未分配'} | 电话：${worker.phone || '未填写'} | 活跃项目：${activeProjects.length}个 | 完成项目：${completedProjects.length}个`
        });

        // 添加工人分配的项目到搜索结果
        if (worker.assignedProjects && worker.assignedProjects.length > 0) {
          worker.assignedProjects.forEach(project => {
            allResults.push({
              id: project.id.toString(),
              type: 'projects',
              title: project.name,
              subtitle: `${worker.name}负责的项目 | ${project.status === 'active' ? '进行中' : project.status === 'completed' ? '已完成' : '待处理'}`,
              description: `负责人：${worker.name} | 描述：${project.description || '无描述'} | 图纸数量：${project.drawings?.length || 0}`
            });

            // 如果项目有关联图纸，也将图纸添加到结果中
            if (project.drawings && project.drawings.length > 0) {
              project.drawings.forEach(drawing => {
                allResults.push({
                  id: drawing.id.toString(),
                  type: 'drawings',
                  title: drawing.filename,
                  subtitle: `${worker.name}负责项目的图纸 | ${project.name}`,
                  description: `项目：${project.name} | 负责人：${worker.name} | 描述：${drawing.description || 'CAD图纸'}`
                });
              });
            }
          });
        }
      });
    }

    // 搜索图纸
    if (type === 'all' || type === 'drawings') {
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
        limit: searchLimit,
        order: [['createdAt', 'DESC']]
      });

      drawings.forEach(drawing => {
        allResults.push({
          id: drawing.id.toString(),
          type: 'drawings',
          title: drawing.filename,
          subtitle: `版本 ${drawing.version || '1.0'} | ${drawing.fileSize ? `${(drawing.fileSize / 1024).toFixed(1)}KB` : 'CAD图纸'}`,
          description: `项目：${drawing.project?.name || '通用图纸'} | 上传者：${drawing.uploader?.name || ''}`
        });
      });
    }

    // 搜索板材/厚度规格
    if (type === 'all' || type === 'materials') {
      const thicknessSpecs = await ThicknessSpec.findAll({
        where: {
          [Op.and]: [
            { isActive: true },
            {
              [Op.or]: [
                { thickness: { [Op.like]: `%${searchTerm}%` } },
                { materialType: { [Op.like]: `%${searchTerm}%` } },
                { unit: { [Op.like]: `%${searchTerm}%` } }
              ]
            }
          ]
        },
        limit: searchLimit,
        order: [['sortOrder', 'ASC']]
      });

      thicknessSpecs.forEach(spec => {
        allResults.push({
          id: spec.id.toString(),
          type: 'materials',
          title: `${spec.thickness}${spec.unit} ${spec.materialType}`,
          subtitle: '板材规格',
          description: `厚度：${spec.thickness}${spec.unit} | 材质：${spec.materialType} | 状态：可用`
        });
      });
    }

    // 搜索时间相关 - 只有当搜索词包含时间相关关键词时才触发
    if ((type === 'all' || type === 'time') && isTimeRelatedSearch(searchTerm)) {
      const recentProjects = await Project.findAll({
        where: {
          [Op.and]: [
            {
              createdAt: {
                [Op.gte]: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) // 最近30天
              }
            },
            {
              [Op.or]: [
                { name: { [Op.like]: `%${searchTerm}%` } },
                { description: { [Op.like]: `%${searchTerm}%` } }
              ]
            }
          ]
        },
        include: [
          {
            model: Worker,
            as: 'assignedWorker',
            attributes: ['id', 'name']
          }
        ],
        limit: Math.ceil(searchLimit / 2),
        order: [['createdAt', 'DESC']]
      });

      recentProjects.forEach(project => {
        const createdDate = new Date(project.createdAt).toLocaleDateString('zh-CN');
        allResults.push({
          id: project.id.toString(),
          type: 'time',
          title: `${createdDate} - ${project.name}`,
          subtitle: '最近项目',
          description: `创建时间：${createdDate} | 负责人：${project.assignedWorker?.name || '未分配'}`
        });
      });
    }

    // 按相关性排序
    const sortedResults = allResults.sort((a, b) => {
      const aScore = calculateRelevanceScore(a, searchTerm);
      const bScore = calculateRelevanceScore(b, searchTerm);
      return bScore - aScore;
    });

    // 限制结果数量
    const limitedResults = sortedResults.slice(0, searchLimit);

    res.json({
      success: true,
      results: limitedResults,
      total: limitedResults.length,
      query: searchTerm,
      searchType: type,
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