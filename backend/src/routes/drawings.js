const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const fs = require('fs').promises;
const { Drawing, Project, User } = require('../models');
const { authenticate } = require('../middleware/auth');
const { recordDrawingUpload } = require('../utils/operationHistory');
const { Op } = require('sequelize');

// 配置文件上传存储
const storage = multer.diskStorage({
  destination: async (req, file, cb) => {
    const uploadDir = path.join(__dirname, '../../uploads/drawings');
    try {
      await fs.mkdir(uploadDir, { recursive: true });
      cb(null, uploadDir);
    } catch (error) {
      cb(error);
    }
  },
  filename: (req, file, cb) => {
    // 生成唯一文件名：时间戳_原文件名
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    
    // 正确处理中文文件名编码
    const originalname = Buffer.from(file.originalname, 'latin1').toString('utf8');
    const ext = path.extname(originalname);
    const name = path.basename(originalname, ext);
    
    // 保存处理后的原始文件名到file对象中，供后续使用
    file.processedOriginalname = originalname;
    
    cb(null, `${uniqueSuffix}_${name}${ext}`);
  }
});

// 文件过滤器 - 支持多种文件类型
const fileFilter = (req, file, cb) => {
  // 正确处理中文文件名编码
  const originalname = Buffer.from(file.originalname, 'latin1').toString('utf8');
  
  // 允许的文件类型 - 只支持DXF文件
  const allowedTypes = [
    'application/dxf',
    'image/vnd.dxf'
  ];
  
  // 通过扩展名判断 - 只支持DXF文件
  const allowedExtensions = ['.dxf'];
  const ext = path.extname(originalname).toLowerCase();
  
  if (allowedTypes.includes(file.mimetype) || allowedExtensions.includes(ext)) {
    cb(null, true);
  } else {
    cb(new Error('仅支持DXF文件格式'), false);
  }
};

// 配置multer
const upload = multer({
  storage: storage,
  fileFilter: fileFilter,
  limits: {
    fileSize: 50 * 1024 * 1024 // 50MB
  }
});

// 获取所有图纸（用于图纸库）
router.get('/', authenticate, async (req, res) => {
  try {
    const { 
      category = 'all',
      fileType,
      status,
      projectAssociation,
      search,
      page = 1,
      limit = 20,
      sortBy = 'createdAt',
      sortOrder = 'DESC',
      includeArchived = 'false'
    } = req.query;

    // 构建查询条件
    let whereClause = {};
    
    // 默认情况下排除已归档的图纸，除非明确要求包含或者分类是archived
    if (category !== 'archived' && includeArchived !== 'true') {
      whereClause.status = { [Op.ne]: '已归档' };
    }
    
    // 分类筛选
    if (category && category !== 'all') {
      switch (category) {
        case 'common-parts':
          whereClause.isCommonPart = true;
          break;
        case 'project-drawings':
          whereClause.isCommonPart = false;
          whereClause.projectId = { [Op.ne]: null };
          break;
        case 'dxf':
          whereClause.fileType = { [Op.in]: ['application/dxf', 'image/vnd.dxf'] };
          break;
        case 'associated':
          whereClause.projectId = { [Op.ne]: null };
          whereClause.isCommonPart = false;
          break;
        case 'unassociated':
          whereClause.projectId = null;
          whereClause.isCommonPart = false;
          break;
        case 'available':
          whereClause.status = '可用';
          break;
        case 'deprecated':
          whereClause.status = '已废弃';
          break;
        case 'archived':
          whereClause.status = '已归档';
          break;
      }
    }
    
    // 文件类型筛选 - 只支持DXF
    if (fileType && fileType !== 'all') {
      if (fileType === 'DXF') {
        whereClause.fileType = { [Op.in]: ['application/dxf', 'image/vnd.dxf'] };
      }
    }

    // 状态筛选
    if (status && status !== 'all') {
      whereClause.status = status;
    }

    // 项目关联筛选（仅针对非常用零件）
    if (projectAssociation && !whereClause.isCommonPart) {
      if (projectAssociation === 'associated') {
        whereClause.projectId = { [Op.ne]: null };
      } else if (projectAssociation === 'unassociated') {
        whereClause.projectId = null;
      }
    }

    // 搜索关键词
    if (search) {
      whereClause[Op.or] = [
        { originalFilename: { [Op.like]: `%${search}%` } },
        { filename: { [Op.like]: `%${search}%` } },
        { description: { [Op.like]: `%${search}%` } }
      ];
    }

    // 分页参数
    const offset = (parseInt(page) - 1) * parseInt(limit);

    // 排序字段映射
    const sortFields = {
      'createdAt': 'uploadTime',
      'name': 'originalFilename', 
      'size': 'fileSize',
      'type': 'fileType'
    };
    const orderField = sortFields[sortBy] || 'uploadTime';

    const { count, rows: drawings } = await Drawing.findAndCountAll({
      where: whereClause,
      include: [
        {
          model: User,
          as: 'uploader',
          attributes: ['id', 'name']
        },
        {
          model: Project,
          as: 'project', // 使用正确的关联名称
          attributes: ['id', 'name', 'status'],
          required: false
        }
      ],
      order: [[orderField, sortOrder.toUpperCase()]],
      limit: parseInt(limit),
      offset: offset
    });

    // 格式化响应数据
    const formattedDrawings = drawings.map(drawing => {
      // 确定文件类型 - 只支持DXF
      let fileType = 'DXF'; // 默认DXF，因为只支持DXF文件
      
      // 所有支持的文件都是DXF类型

      return {
        id: drawing.id,
        filename: drawing.filename,
        originalName: drawing.originalFilename,
        filePath: drawing.filePath,
        fileSize: drawing.fileSize,
        fileType: fileType,
        version: drawing.version?.toString() || '1',
        status: drawing.status || '可用',
        description: drawing.description,
        uploadedBy: drawing.uploadedBy,
        createdAt: drawing.uploadTime || drawing.createdAt,
        updatedAt: drawing.updatedAt,
        archivedAt: drawing.archivedAt,
        isCommonPart: drawing.isCommonPart || false,
        uploader: drawing.uploader,
        project: drawing.project,
        projectIds: drawing.project ? [drawing.project.id] : []
      };
    });

    res.json({
      success: true,
      drawings: formattedDrawings,
      pagination: {
        total: count,
        page: parseInt(page),
        limit: parseInt(limit),
        totalPages: Math.ceil(count / parseInt(limit))
      }
    });
  } catch (error) {
    console.error('获取图纸库数据失败:', error);
    res.status(500).json({
      error: '获取图纸库数据失败',
      details: error.message
    });
  }
});

// 通用图纸上传（用于图纸库）
router.post('/upload', authenticate, upload.single('drawing'), async (req, res) => {
  try {
    const { description, status = '可用', projectIds } = req.body;

    if (!req.file) {
      return res.status(400).json({
        error: '请选择要上传的文件'
      });
    }

    // 获取正确编码的原始文件名
    const originalFilename = req.file.processedOriginalname || 
                           Buffer.from(req.file.originalname, 'latin1').toString('utf8');

    // 检查是否存在同名文件（不同于项目特定上传，这里检查全局重名）
    const existingDrawing = await Drawing.findOne({
      where: {
        originalFilename: originalFilename,
        projectId: null // 只检查图纸库中的文件
      }
    });

    let version = 1;
    if (existingDrawing) {
      version = existingDrawing.version + 1;
    }

    // 解析项目ID数组
    let parsedProjectIds = [];
    if (projectIds) {
      try {
        parsedProjectIds = typeof projectIds === 'string' ? JSON.parse(projectIds) : projectIds;
      } catch (error) {
        console.warn('解析项目ID失败:', error);
      }
    }

    // 创建新的图纸记录（不关联特定项目，适用于图纸库）
    const drawing = await Drawing.create({
      projectId: null, // 图纸库中的文件不关联特定项目
      filename: req.file.filename,
      originalFilename: originalFilename,
      filePath: req.file.path,
      fileSize: req.file.size,
      fileType: req.file.mimetype,
      version: version,
      uploadedBy: req.user.id,
      uploadTime: new Date(),
      isCurrentVersion: true,
      description: description || null,
      status: status
    });

    // 获取完整的图纸信息返回
    const fullDrawing = await Drawing.findByPk(drawing.id, {
      include: [
        {
          model: User,
          as: 'uploader',
          attributes: ['id', 'name']
        }
      ]
    });

    res.status(201).json({
      success: true,
      message: '图纸上传成功',
      drawing: {
        id: fullDrawing.id,
        filename: fullDrawing.filename,
        originalName: fullDrawing.originalFilename,
        filePath: fullDrawing.filePath,
        fileSize: fullDrawing.fileSize,
        fileType: 'DXF', // 所有文件都是DXF格式
        version: fullDrawing.version?.toString() || '1',
        status: fullDrawing.status,
        description: fullDrawing.description,
        uploadedBy: fullDrawing.uploadedBy,
        createdAt: fullDrawing.uploadTime,
        updatedAt: fullDrawing.updatedAt,
        uploader: fullDrawing.uploader,
        projectIds: parsedProjectIds
      }
    });
  } catch (error) {
    console.error('上传图纸失败:', error);
    
    // 如果上传失败，删除已保存的文件
    if (req.file && req.file.path) {
      try {
        await fs.unlink(req.file.path);
      } catch (unlinkError) {
        console.error('删除临时文件失败:', unlinkError);
      }
    }

    res.status(500).json({
      error: '上传图纸失败',
      details: error.message
    });
  }
});

// 更新图纸信息（用于图纸库）
router.put('/:id', authenticate, async (req, res) => {
  try {
    const { id } = req.params;
    const { description, status, projectIds, originalFilename } = req.body;

    const drawing = await Drawing.findByPk(id);
    if (!drawing) {
      return res.status(404).json({
        error: '图纸不存在'
      });
    }

    // 检查权限（管理员或上传者可以编辑）
    if (req.user.role !== 'admin' && req.user.id !== drawing.uploadedBy) {
      return res.status(403).json({
        error: '权限不足，只有管理员或上传者可以编辑图纸'
      });
    }

    // 验证原始文件名格式（如果提供了的话）
    if (originalFilename !== undefined) {
      if (!originalFilename || originalFilename.trim().length === 0) {
        return res.status(400).json({
          error: '文件名不能为空'
        });
      }
      
      // 检查文件名中是否包含非法字符
      const invalidChars = /[<>:"/\\|?*]/;
      if (invalidChars.test(originalFilename)) {
        return res.status(400).json({
          error: '文件名不能包含以下字符: < > : " / \\ | ? *'
        });
      }
      
      // 确保文件名有正确的扩展名
      const fileExt = path.extname(originalFilename.toLowerCase());
      if (!fileExt || fileExt !== '.dxf') {
        return res.status(400).json({
          error: '文件名必须以 .dxf 结尾'
        });
      }
    }

    // 更新图纸信息
    await drawing.update({
      description: description !== undefined ? description : drawing.description,
      status: status !== undefined ? status : drawing.status,
      originalFilename: originalFilename !== undefined ? originalFilename : drawing.originalFilename
    });

    // 获取更新后的完整信息
    const updatedDrawing = await Drawing.findByPk(id, {
      include: [
        {
          model: User,
          as: 'uploader',
          attributes: ['id', 'name']
        },
        {
          model: Project,
          as: 'project',
          attributes: ['id', 'name', 'status'],
          required: false
        }
      ]
    });

    res.json({
      success: true,
      message: '图纸信息更新成功',
      drawing: {
        id: updatedDrawing.id,
        filename: updatedDrawing.filename,
        originalName: updatedDrawing.originalFilename,
        filePath: updatedDrawing.filePath,
        fileSize: updatedDrawing.fileSize,
        fileType: 'DXF',
        version: updatedDrawing.version?.toString() || '1',
        status: updatedDrawing.status,
        description: updatedDrawing.description,
        uploadedBy: updatedDrawing.uploadedBy,
        createdAt: updatedDrawing.uploadTime || updatedDrawing.createdAt,
        updatedAt: updatedDrawing.updatedAt,
        uploader: updatedDrawing.uploader,
        project: updatedDrawing.project,
        projectIds: updatedDrawing.project ? [updatedDrawing.project.id] : []
      }
    });
  } catch (error) {
    console.error('更新图纸失败:', error);
    res.status(500).json({
      error: '更新图纸失败',
      details: error.message
    });
  }
});

// 删除图纸（用于图纸库）
router.delete('/:id', authenticate, async (req, res) => {
  try {
    const { id } = req.params;

    const drawing = await Drawing.findByPk(id);
    if (!drawing) {
      return res.status(404).json({
        error: '图纸不存在'
      });
    }

    // 检查权限（管理员或上传者可以删除）
    if (req.user.role !== 'admin' && req.user.id !== drawing.uploadedBy) {
      return res.status(403).json({
        error: '权限不足，只有管理员或上传者可以删除图纸'
      });
    }

    // 删除文件
    try {
      await fs.unlink(drawing.filePath);
    } catch (error) {
      console.error('删除文件失败:', error);
      // 文件删除失败不影响数据库记录删除
    }

    await drawing.destroy();

    res.json({
      success: true,
      message: '图纸删除成功'
    });
  } catch (error) {
    console.error('删除图纸失败:', error);
    res.status(500).json({
      error: '删除图纸失败',
      details: error.message
    });
  }
});

// 获取项目的所有图纸
router.get('/project/:projectId', authenticate, async (req, res) => {
  try {
    const { projectId } = req.params;
    const { version } = req.query; // 可选：获取特定版本

    // 验证项目是否存在
    const project = await Project.findByPk(projectId);
    if (!project) {
      return res.status(404).json({
        error: '项目不存在'
      });
    }

    let whereClause = { projectId: projectId };
    if (version === 'current') {
      whereClause.isCurrentVersion = true;
    }

    const drawings = await Drawing.findAll({
      where: whereClause,
      include: [
        {
          model: User,
          as: 'uploader',
          attributes: ['id', 'name']
        }
      ],
      order: [['uploadTime', 'DESC']]
    });

    res.json({
      success: true,
      drawings
    });
  } catch (error) {
    console.error('获取图纸列表失败:', error);
    res.status(500).json({
      error: '获取图纸列表失败',
      details: error.message
    });
  }
});

// 上传图纸
router.post('/project/:projectId/upload', authenticate, upload.single('drawing'), async (req, res) => {
  try {
    const { projectId } = req.params;
    const { description } = req.body;

    // 验证项目是否存在
    const project = await Project.findByPk(projectId);
    if (!project) {
      return res.status(404).json({
        error: '项目不存在'
      });
    }

    if (!req.file) {
      return res.status(400).json({
        error: '请选择要上传的文件'
      });
    }

    // 获取正确编码的原始文件名
    const originalFilename = req.file.processedOriginalname || 
                           Buffer.from(req.file.originalname, 'latin1').toString('utf8');

    // 检查是否存在同名文件，如果存在则更新版本号
    const existingDrawing = await Drawing.findOne({
      where: {
        projectId: projectId,
        originalFilename: originalFilename,
        isCurrentVersion: true
      }
    });

    let version = 1;
    if (existingDrawing) {
      // 将之前的版本标记为非当前版本并废弃
      await existingDrawing.update({ 
        isCurrentVersion: false,
        status: '已废弃'
      });
      version = existingDrawing.version + 1;
      
      // 同时废弃所有该图纸的历史版本
      await Drawing.update(
        { status: '已废弃' },
        {
          where: {
            projectId: projectId,
            originalFilename: originalFilename,
            isCurrentVersion: false
          }
        }
      );
    }

    // 创建新的图纸记录
    const drawing = await Drawing.create({
      projectId: projectId,
      filename: req.file.filename,
      originalFilename: originalFilename,
      filePath: req.file.path,
      fileSize: req.file.size,
      fileType: req.file.mimetype,
      version: version,
      uploadedBy: req.user.id,
      uploadTime: new Date(),
      isCurrentVersion: true,
      description: description || null
    });

    // 获取完整的图纸信息返回
    const fullDrawing = await Drawing.findByPk(drawing.id, {
      include: [
        {
          model: User,
          as: 'uploader',
          attributes: ['id', 'name']
        }
      ]
    });

    // 记录操作历史
    try {
      await recordDrawingUpload(
        projectId,
        fullDrawing,
        req.user.id,
        req.user.name
      );
    } catch (historyError) {
      console.error('记录图纸上传历史失败:', historyError);
    }

    res.status(201).json({
      success: true,
      message: '图纸上传成功',
      drawing: fullDrawing
    });
  } catch (error) {
    console.error('上传图纸失败:', error);
    
    // 如果上传失败，删除已保存的文件
    if (req.file && req.file.path) {
      try {
        await fs.unlink(req.file.path);
      } catch (unlinkError) {
        console.error('删除临时文件失败:', unlinkError);
      }
    }

    res.status(500).json({
      error: '上传图纸失败',
      details: error.message
    });
  }
});

// 上传常用零件图纸
router.post('/common-parts/upload', authenticate, upload.single('drawing'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: '没有上传文件' });
    }

    const { description } = req.body;
    const originalFilename = Buffer.from(req.file.originalname, 'latin1').toString('utf8');

    // 检查是否存在同名常用零件，如果存在则更新版本号
    const existingDrawing = await Drawing.findOne({
      where: {
        originalFilename: originalFilename,
        isCommonPart: true,
        isCurrentVersion: true
      }
    });

    let version = 1;
    if (existingDrawing) {
      // 将之前的版本标记为非当前版本并废弃
      await existingDrawing.update({ 
        isCurrentVersion: false,
        status: '已废弃'
      });
      version = existingDrawing.version + 1;
      
      // 同时废弃所有该图纸的历史版本
      await Drawing.update(
        { status: '已废弃' },
        {
          where: {
            originalFilename: originalFilename,
            isCommonPart: true,
            isCurrentVersion: false
          }
        }
      );
    }

    // 创建新的常用零件图纸记录
    const drawing = await Drawing.create({
      projectId: null, // 常用零件不关联项目
      filename: req.file.filename,
      originalFilename: originalFilename,
      filePath: req.file.path,
      fileSize: req.file.size,
      fileType: req.file.mimetype,
      version: version,
      uploadedBy: req.user.id,
      uploadTime: new Date(),
      isCurrentVersion: true,
      isCommonPart: true,
      description: description || null
    });

    // 获取完整的图纸信息返回
    const fullDrawing = await Drawing.findByPk(drawing.id, {
      include: [
        {
          model: User,
          as: 'uploader',
          attributes: ['id', 'name']
        }
      ]
    });

    res.status(201).json({
      success: true,
      message: '常用零件图纸上传成功',
      drawing: fullDrawing
    });
  } catch (error) {
    console.error('上传常用零件图纸失败:', error);
    
    // 如果上传失败，删除已保存的文件
    if (req.file && req.file.path) {
      try {
        await fs.unlink(req.file.path);
      } catch (unlinkError) {
        console.error('删除临时文件失败:', unlinkError);
      }
    }

    res.status(500).json({
      error: '上传常用零件图纸失败',
      details: error.message
    });
  }
});

// 归档项目图纸（项目完成时调用）
router.post('/archive-project/:projectId', authenticate, async (req, res) => {
  try {
    const { projectId } = req.params;

    // 将项目相关的所有图纸标记为已归档
    const archivedCount = await Drawing.update(
      { 
        status: '已归档',
        archivedAt: new Date()
      },
      {
        where: {
          projectId: projectId,
          status: '可用', // 只归档可用状态的图纸
          isCommonPart: false // 不包含常用零件
        }
      }
    );

    res.json({
      success: true,
      message: `已归档 ${archivedCount[0]} 个图纸`,
      archivedCount: archivedCount[0]
    });
  } catch (error) {
    console.error('归档项目图纸失败:', error);
    res.status(500).json({
      error: '归档项目图纸失败',
      details: error.message
    });
  }
});

// 获取图纸内容（用于DXF预览）
router.get('/:id/content', authenticate, async (req, res) => {
  try {
    const { id } = req.params;

    const drawing = await Drawing.findByPk(id);
    if (!drawing) {
      return res.status(404).json({
        error: '图纸不存在'
      });
    }

    // 检查文件是否存在
    try {
      await fs.access(drawing.filePath);
    } catch {
      return res.status(404).json({
        error: '文件不存在或已被删除'
      });
    }

    // 只允许DXF文件获取内容
    const fileName = drawing.originalFilename || drawing.filename;
    if (!fileName.toLowerCase().endsWith('.dxf')) {
      return res.status(400).json({
        error: '只支持DXF文件内容预览'
      });
    }

    // 读取文件内容
    const fileContent = await fs.readFile(drawing.filePath, 'utf8');
    
    // 设置响应头
    res.setHeader('Content-Type', 'text/plain; charset=utf-8');
    res.send(fileContent);
  } catch (error) {
    console.error('获取图纸内容失败:', error);
    res.status(500).json({
      error: '获取图纸内容失败',
      details: error.message
    });
  }
});

// 获取图纸预览图片（方案1测试）
router.get('/:id/preview-image', authenticate, async (req, res) => {
  try {
    const { id } = req.params;

    const drawing = await Drawing.findByPk(id);
    if (!drawing) {
      return res.status(404).json({
        error: '图纸不存在'
      });
    }

    // 检查文件是否存在
    try {
      await fs.access(drawing.filePath);
    } catch {
      return res.status(404).json({
        error: '文件不存在或已被删除'
      });
    }

    // 只允许DXF文件生成预览图
    const fileName = drawing.originalFilename || drawing.filename;
    if (!fileName.toLowerCase().endsWith('.dxf')) {
      return res.status(400).json({
        error: '只支持DXF文件预览图生成'
      });
    }

    // TODO: 这里暂时返回一个占位图片
    // 实际实现需要安装DXF转换库（如 dxf-parser + canvas/sharp）
    
    // 创建一个简单的占位图片提示
    const { createCanvas } = require('canvas');
    
    try {
      const canvas = createCanvas(800, 600);
      const ctx = canvas.getContext('2d');
      
      // 白色背景
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(0, 0, 800, 600);
      
      // 绘制提示文字
      ctx.fillStyle = '#333333';
      ctx.font = '24px Arial';
      ctx.textAlign = 'center';
      ctx.fillText('DXF预览图生成功能', 400, 250);
      ctx.fillText('需要实现专业DXF转换库', 400, 290);
      ctx.fillText(`文件: ${fileName}`, 400, 330);
      
      // 绘制一个简单的矩形示例
      ctx.strokeStyle = '#666666';
      ctx.lineWidth = 2;
      ctx.strokeRect(250, 380, 300, 150);
      ctx.strokeRect(270, 400, 50, 110);
      ctx.strokeRect(480, 400, 50, 110);
      
      const buffer = canvas.toBuffer('image/png');
      
      res.setHeader('Content-Type', 'image/png');
      res.setHeader('Cache-Control', 'public, max-age=3600'); // 缓存1小时
      res.send(buffer);
      
    } catch (canvasError) {
      // 如果canvas库不可用，返回错误
      console.error('Canvas图片生成失败:', canvasError);
      res.status(500).json({
        error: '预览图生成失败',
        details: '需要安装canvas库: npm install canvas',
        suggestion: '这是方案1的测试端点，需要实现专业DXF转图片功能'
      });
    }

  } catch (error) {
    console.error('生成预览图失败:', error);
    res.status(500).json({
      error: '生成预览图失败',
      details: error.message
    });
  }
});

// 下载图纸
router.get('/:id/download', authenticate, async (req, res) => {
  try {
    const { id } = req.params;

    const drawing = await Drawing.findByPk(id);
    if (!drawing) {
      return res.status(404).json({
        error: '图纸不存在'
      });
    }

    // 检查文件是否存在
    try {
      await fs.access(drawing.filePath);
    } catch {
      return res.status(404).json({
        error: '文件不存在或已被删除'
      });
    }

    // 设置响应头
    res.setHeader('Content-Disposition', `attachment; filename="${encodeURIComponent(drawing.originalFilename)}"`);
    res.setHeader('Content-Type', drawing.fileType || 'application/octet-stream');

    // 发送文件
    res.sendFile(path.resolve(drawing.filePath));
  } catch (error) {
    console.error('下载图纸失败:', error);
    res.status(500).json({
      error: '下载图纸失败',
      details: error.message
    });
  }
});

// 获取图纸版本历史
router.get('/:filename/versions/:projectId', authenticate, async (req, res) => {
  try {
    const { filename, projectId } = req.params;

    const versions = await Drawing.findAll({
      where: {
        originalFilename: filename,
        projectId: projectId
      },
      include: [
        {
          model: User,
          as: 'uploader',
          attributes: ['id', 'name']
        }
      ],
      order: [['version', 'DESC']]
    });

    res.json({
      success: true,
      versions
    });
  } catch (error) {
    console.error('获取版本历史失败:', error);
    res.status(500).json({
      error: '获取版本历史失败',
      details: error.message
    });
  }
});

// 设置当前版本
router.put('/:id/set-current', authenticate, async (req, res) => {
  try {
    const { id } = req.params;

    const drawing = await Drawing.findByPk(id);
    if (!drawing) {
      return res.status(404).json({
        error: '图纸不存在'
      });
    }

    // 将同文件名的其他版本设为非当前版本
    await Drawing.update(
      { isCurrentVersion: false },
      {
        where: {
          originalFilename: drawing.originalFilename,
          projectId: drawing.projectId
        }
      }
    );

    // 将当前图纸设为当前版本
    await drawing.update({ isCurrentVersion: true });

    res.json({
      success: true,
      message: '当前版本设置成功'
    });
  } catch (error) {
    console.error('设置当前版本失败:', error);
    res.status(500).json({
      error: '设置当前版本失败',
      details: error.message
    });
  }
});

// 删除图纸
router.delete('/:id', authenticate, async (req, res) => {
  try {
    const { id } = req.params;

    const drawing = await Drawing.findByPk(id);
    if (!drawing) {
      return res.status(404).json({
        error: '图纸不存在'
      });
    }

    // 检查权限（管理员或上传者可以删除）
    if (req.user.role !== 'admin' && req.user.id !== drawing.uploadedBy) {
      return res.status(403).json({
        error: '权限不足，只有管理员或上传者可以删除图纸'
      });
    }

    // 删除文件
    try {
      await fs.unlink(drawing.filePath);
    } catch (error) {
      console.error('删除文件失败:', error);
      // 文件删除失败不影响数据库记录删除
    }

    // 如果删除的是当前版本，需要将前一个版本设为当前版本
    if (drawing.isCurrentVersion) {
      const previousVersion = await Drawing.findOne({
        where: {
          originalFilename: drawing.originalFilename,
          projectId: drawing.projectId,
          version: { [require('sequelize').Op.lt]: drawing.version }
        },
        order: [['version', 'DESC']]
      });

      if (previousVersion) {
        await previousVersion.update({ isCurrentVersion: true });
      }
    }

    await drawing.destroy();

    res.json({
      success: true,
      message: '图纸删除成功'
    });
  } catch (error) {
    console.error('删除图纸失败:', error);
    res.status(500).json({
      error: '删除图纸失败',
      details: error.message
    });
  }
});

module.exports = router;