// Electron主进程中的CAD文件处理模块
const { ipcMain, shell } = require('electron');
const CADDetector = require('../utils/cadDetector');

class ElectronCADHandler {
  constructor() {
    this.cadDetector = new CADDetector();
    this.setupIpcHandlers();
  }

  setupIpcHandlers() {
    // 检测CAD软件
    ipcMain.handle('detect-cad-software', async () => {
      try {
        const detectedSoftware = await this.cadDetector.detectCADSoftware();
        return {
          success: true,
          software: detectedSoftware,
          supportedExtensions: this.cadDetector.getSupportedExtensions()
        };
      } catch (error) {
        return {
          success: false,
          error: error.message
        };
      }
    });

    // 打开CAD文件
    ipcMain.handle('open-cad-file', async (event, filePath) => {
      try {
        const result = await this.cadDetector.openFile(filePath);
        return result;
      } catch (error) {
        // 如果专用CAD软件打开失败，尝试系统默认方式
        try {
          await shell.openPath(filePath);
          return {
            success: true,
            software: '系统默认程序',
            message: '文件已用系统默认程序打开'
          };
        } catch (shellError) {
          return {
            success: false,
            error: `打开文件失败: ${error.message}`
          };
        }
      }
    });

    // 获取已检测的软件列表
    ipcMain.handle('get-detected-cad-software', () => {
      return {
        success: true,
        software: this.cadDetector.getDetectedSoftware(),
        supportedExtensions: this.cadDetector.getSupportedExtensions()
      };
    });

    // 检查文件是否为CAD文件
    ipcMain.handle('is-cad-file', (event, filePath) => {
      const path = require('path');
      const fileExtension = path.extname(filePath);
      const supportedExtensions = this.cadDetector.getSupportedExtensions();
      
      return {
        success: true,
        isCADFile: supportedExtensions.includes(fileExtension.toLowerCase()),
        extension: fileExtension,
        supportedExtensions
      };
    });
  }
}

module.exports = ElectronCADHandler;