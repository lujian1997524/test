// CAD软件检测工具
// 支持检测AutoCAD、CAXA等主流CAD软件

const { exec } = require('child_process');
const fs = require('fs');
const path = require('path');
const { promisify } = require('util');

const execAsync = promisify(exec);

class CADDetector {
  constructor() {
    this.detectedSoftware = [];
    this.isWindows = process.platform === 'win32';
    this.isMac = process.platform === 'darwin';
    this.isLinux = process.platform === 'linux';
  }

  // 检测已安装的CAD软件
  async detectCADSoftware() {
    this.detectedSoftware = [];
    
    try {
      if (this.isWindows) {
        await this.detectWindowsCAD();
      } else if (this.isMac) {
        await this.detectMacCAD();
      } else if (this.isLinux) {
        await this.detectLinuxCAD();
      }
    } catch (error) {
      console.error('CAD软件检测失败:', error);
    }

    return this.detectedSoftware;
  }

  // Windows平台CAD检测
  async detectWindowsCAD() {
    const cadSoftware = [
      // AutoCAD系列
      {
        name: 'AutoCAD 2024',
        regPath: 'HKEY_LOCAL_MACHINE\\SOFTWARE\\Autodesk\\AutoCAD\\R24.3\\ACAD-1001:409',
        execPath: 'C:\\Program Files\\Autodesk\\AutoCAD 2024\\acad.exe',
        extensions: ['.dwg', '.dxf'],
        type: 'autocad'
      },
      {
        name: 'AutoCAD 2023',
        regPath: 'HKEY_LOCAL_MACHINE\\SOFTWARE\\Autodesk\\AutoCAD\\R24.2\\ACAD-1001:409',
        execPath: 'C:\\Program Files\\Autodesk\\AutoCAD 2023\\acad.exe',
        extensions: ['.dwg', '.dxf'],
        type: 'autocad'
      },
      {
        name: 'AutoCAD 2022',
        regPath: 'HKEY_LOCAL_MACHINE\\SOFTWARE\\Autodesk\\AutoCAD\\R24.1\\ACAD-1001:409',
        execPath: 'C:\\Program Files\\Autodesk\\AutoCAD 2022\\acad.exe',
        extensions: ['.dwg', '.dxf'],
        type: 'autocad'
      },
      {
        name: 'AutoCAD 2021',
        regPath: 'HKEY_LOCAL_MACHINE\\SOFTWARE\\Autodesk\\AutoCAD\\R24.0\\ACAD-1001:409',
        execPath: 'C:\\Program Files\\Autodesk\\AutoCAD 2021\\acad.exe',
        extensions: ['.dwg', '.dxf'],
        type: 'autocad'
      },
      {
        name: 'AutoCAD 2020',
        regPath: 'HKEY_LOCAL_MACHINE\\SOFTWARE\\Autodesk\\AutoCAD\\R23.1\\ACAD-1001:409',
        execPath: 'C:\\Program Files\\Autodesk\\AutoCAD 2020\\acad.exe',
        extensions: ['.dwg', '.dxf'],
        type: 'autocad'
      },
      
      // CAXA系列
      {
        name: 'CAXA CAD电子图板',
        regPath: 'HKEY_LOCAL_MACHINE\\SOFTWARE\\CAXA\\CADElectronics',
        execPath: 'C:\\CAXA\\CAD电子图板\\CAD.exe',
        extensions: ['.exb', '.dwg', '.dxf'],
        type: 'caxa'
      },
      {
        name: 'CAXA CAD 2020',
        regPath: 'HKEY_LOCAL_MACHINE\\SOFTWARE\\CAXA\\CAD2020',
        execPath: 'C:\\CAXA\\CAD2020\\CAD.exe',
        extensions: ['.exb', '.dwg', '.dxf'],
        type: 'caxa'
      },
      {
        name: 'CAXA CAD 2019',
        regPath: 'HKEY_LOCAL_MACHINE\\SOFTWARE\\CAXA\\CAD2019',
        execPath: 'C:\\CAXA\\CAD2019\\CAD.exe',
        extensions: ['.exb', '.dwg', '.dxf'],
        type: 'caxa'
      },

      // 其他CAD软件
      {
        name: 'SolidWorks',
        regPath: 'HKEY_LOCAL_MACHINE\\SOFTWARE\\SolidWorks',
        execPath: 'C:\\Program Files\\SOLIDWORKS Corp\\SOLIDWORKS\\SLDWORKS.exe',
        extensions: ['.sldprt', '.sldasm', '.slddrw', '.dwg', '.dxf'],
        type: 'solidworks'
      },
      {
        name: 'Pro/ENGINEER',
        regPath: 'HKEY_LOCAL_MACHINE\\SOFTWARE\\PTC\\Pro/ENGINEER',
        execPath: 'C:\\Program Files\\PTC\\Creo\\Parametric\\bin\\parametric.exe',
        extensions: ['.prt', '.asm', '.drw'],
        type: 'proengineer'
      }
    ];

    for (const software of cadSoftware) {
      try {
        // 检查注册表
        await this.checkWindowsRegistry(software.regPath);
        
        // 检查可执行文件
        if (fs.existsSync(software.execPath)) {
          this.detectedSoftware.push({
            ...software,
            detected: true,
            method: 'registry_and_file'
          });
        } else {
          this.detectedSoftware.push({
            ...software,
            detected: true,
            method: 'registry_only'
          });
        }
      } catch (error) {
        // 注册表检查失败，尝试直接检查文件
        if (fs.existsSync(software.execPath)) {
          this.detectedSoftware.push({
            ...software,
            detected: true,
            method: 'file_only'
          });
        }
      }
    }
  }

  // 检查Windows注册表
  async checkWindowsRegistry(regPath) {
    try {
      const cmd = `reg query "${regPath}" /ve`;
      await execAsync(cmd);
      return true;
    } catch (error) {
      throw new Error(`注册表项不存在: ${regPath}`);
    }
  }

  // macOS平台CAD检测
  async detectMacCAD() {
    const macCADSoftware = [
      {
        name: 'AutoCAD for Mac',
        appPath: '/Applications/Autodesk/AutoCAD.app',
        extensions: ['.dwg', '.dxf'],
        type: 'autocad'
      },
      {
        name: 'Fusion 360',
        appPath: '/Applications/Autodesk Fusion 360.app',
        extensions: ['.f3d'],
        type: 'fusion360'
      },
      {
        name: 'SolidWorks',
        appPath: '/Applications/SOLIDWORKS.app',
        extensions: ['.sldprt', '.sldasm', '.slddrw'],
        type: 'solidworks'
      }
    ];

    for (const software of macCADSoftware) {
      if (fs.existsSync(software.appPath)) {
        this.detectedSoftware.push({
          ...software,
          detected: true,
          execPath: software.appPath,
          method: 'application_bundle'
        });
      }
    }
  }

  // Linux平台CAD检测
  async detectLinuxCAD() {
    const linuxCADSoftware = [
      {
        name: 'FreeCAD',
        command: 'freecad',
        extensions: ['.fcstd'],
        type: 'freecad'
      },
      {
        name: 'LibreCAD',
        command: 'librecad',
        extensions: ['.dxf'],
        type: 'librecad'
      },
      {
        name: 'QCAD',
        command: 'qcad',
        extensions: ['.dxf'],
        type: 'qcad'
      }
    ];

    for (const software of linuxCADSoftware) {
      try {
        await execAsync(`which ${software.command}`);
        this.detectedSoftware.push({
          ...software,
          detected: true,
          execPath: software.command,
          method: 'command_line'
        });
      } catch (error) {
        // 命令不存在
      }
    }
  }

  // 根据文件扩展名获取合适的CAD软件
  getCADForFile(fileExtension) {
    const ext = fileExtension.toLowerCase();
    
    // 优先级排序：优先使用最新版本和最常用的软件
    const priorityOrder = ['autocad', 'caxa', 'solidworks', 'fusion360', 'freecad'];
    
    const compatibleSoftware = this.detectedSoftware.filter(software => 
      software.detected && software.extensions.includes(ext)
    );

    if (compatibleSoftware.length === 0) {
      return null;
    }

    // 按照优先级排序
    compatibleSoftware.sort((a, b) => {
      const aIndex = priorityOrder.indexOf(a.type);
      const bIndex = priorityOrder.indexOf(b.type);
      
      if (aIndex === -1 && bIndex === -1) return 0;
      if (aIndex === -1) return 1;
      if (bIndex === -1) return -1;
      
      return aIndex - bIndex;
    });

    return compatibleSoftware[0];
  }

  // 打开文件
  async openFile(filePath) {
    const fileExtension = path.extname(filePath);
    const cadSoftware = this.getCADForFile(fileExtension);

    if (!cadSoftware) {
      throw new Error(`未找到支持 ${fileExtension} 文件的CAD软件`);
    }

    try {
      if (this.isWindows) {
        await this.openFileWindows(filePath, cadSoftware);
      } else if (this.isMac) {
        await this.openFileMac(filePath, cadSoftware);
      } else if (this.isLinux) {
        await this.openFileLinux(filePath, cadSoftware);
      }
      
      return {
        success: true,
        software: cadSoftware.name,
        message: `文件已用 ${cadSoftware.name} 打开`
      };
    } catch (error) {
      throw new Error(`打开文件失败: ${error.message}`);
    }
  }

  // Windows平台打开文件
  async openFileWindows(filePath, cadSoftware) {
    const quotedPath = `"${filePath}"`;
    
    if (cadSoftware.execPath && fs.existsSync(cadSoftware.execPath)) {
      // 直接使用可执行文件路径
      const cmd = `"${cadSoftware.execPath}" ${quotedPath}`;
      await execAsync(cmd);
    } else {
      // 使用系统默认关联
      const cmd = `start "" ${quotedPath}`;
      await execAsync(cmd);
    }
  }

  // macOS平台打开文件
  async openFileMac(filePath, cadSoftware) {
    if (cadSoftware.appPath) {
      const cmd = `open -a "${cadSoftware.appPath}" "${filePath}"`;
      await execAsync(cmd);
    } else {
      const cmd = `open "${filePath}"`;
      await execAsync(cmd);
    }
  }

  // Linux平台打开文件
  async openFileLinux(filePath, cadSoftware) {
    if (cadSoftware.execPath) {
      const cmd = `${cadSoftware.execPath} "${filePath}"`;
      await execAsync(cmd);
    } else {
      const cmd = `xdg-open "${filePath}"`;
      await execAsync(cmd);
    }
  }

  // 获取检测到的软件列表
  getDetectedSoftware() {
    return this.detectedSoftware.filter(software => software.detected);
  }

  // 获取支持的文件类型
  getSupportedExtensions() {
    const extensions = new Set();
    this.detectedSoftware.forEach(software => {
      if (software.detected) {
        software.extensions.forEach(ext => extensions.add(ext));
      }
    });
    return Array.from(extensions);
  }
}

module.exports = CADDetector;