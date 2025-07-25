const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const fs = require('fs').promises;
const { Drawing, Project, User } = require('../models');
const { authenticate } = require('../middleware/auth');
const { recordDrawingUpload } = require('../utils/operationHistory');

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

// 文件过滤器
const fileFilter = (req, file, cb) => {
  // 正确处理中文文件名编码
  const originalname = Buffer.from(file.originalname, 'latin1').toString('utf8');
  
  // 允许的文件类型
  const allowedTypes = [
    'application/pdf',
    'image/jpeg', 
    'image/png',
    'image/jpg',
    'application/dwg',
    'application/dxf',
    'image/vnd.dwg',
    'image/vnd.dxf'
  ];
  
  // 通过扩展名判断（因为某些CAD文件的MIME类型可能不准确）
  const allowedExtensions = ['.pdf', '.jpg', '.jpeg', '.png', '.dwg', '.dxf'];
  const ext = path.extname(originalname).toLowerCase();
  
  if (allowedTypes.includes(file.mimetype) || allowedExtensions.includes(ext)) {
    cb(null, true);
  } else {
    cb(new Error('不支持的文件类型。支持的格式：PDF, JPG, PNG, DWG, DXF'), false);
  }
};

// 配置multer
const upload = multer({
  storage: storage,
  fileFilter: fileFilter,
  limits: {
    fileSize: parseInt(process.env.UPLOAD_MAX_SIZE) || 10 * 1024 * 1024 // 10MB
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
      // 将之前的版本标记为非当前版本
      await existingDrawing.update({ isCurrentVersion: false });
      version = existingDrawing.version + 1;
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