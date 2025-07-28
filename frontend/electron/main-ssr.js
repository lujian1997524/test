const { app, BrowserWindow, ipcMain, dialog, shell } = require('electron');
const path = require('path');
const fs = require('fs');

// 环境检测
const isDev = process.env.NODE_ENV === 'development' || process.defaultApp || /[\\/]electron-prebuilt[\\/]/.test(process.execPath) || /[\\/]electron[\\/]/.test(process.execPath);
const useStaticMode = process.env.USE_STATIC_MODE === 'true';

let mainWindow;
let nextServer;

// 启动 Next.js 服务器（SSR模式）
async function startNextServer() {
  if (isDev || useStaticMode) return; // 开发环境或静态模式下不启动内置服务器
  
  try {
    const next = require('next');
    const nextApp = next({ 
      dev: false, 
      dir: path.join(__dirname, '..'),
      conf: {
        distDir: '.next'
      }
    });
    
    await nextApp.prepare();
    
    const handle = nextApp.getRequestHandler();
    const express = require('express');
    const server = express();
    
    server.all('*', (req, res) => {
      return handle(req, res);
    });
    
    nextServer = server.listen(3000, () => {
      console.log('✅ Next.js 服务器已启动在端口 3000');
    });
    
    return 'http://localhost:3000';
  } catch (error) {
    console.error('❌ 启动 Next.js 服务器失败:', error);
    return null;
  }
}

// 检测CAD软件
async function detectCADSoftware() {
  const cadSoftware = [];
  const supportedExtensions = ['.dwg', '.dxf', '.step', '.stp', '.iges', '.igs'];
  
  // Windows CAD软件检测
  if (process.platform === 'win32') {
    const commonPaths = [
      'C:\\\\Program Files\\\\Autodesk\\\\AutoCAD 2024\\\\acad.exe',
      'C:\\\\Program Files\\\\Autodesk\\\\AutoCAD 2023\\\\acad.exe',
      'C:\\\\Program Files\\\\Autodesk\\\\AutoCAD 2022\\\\acad.exe',
      'C:\\\\Program Files (x86)\\\\Autodesk\\\\AutoCAD 2024\\\\acad.exe',
      'C:\\\\Program Files (x86)\\\\Autodesk\\\\AutoCAD 2023\\\\acad.exe',
    ];
    
    for (const cadPath of commonPaths) {
      if (fs.existsSync(cadPath)) {
        cadSoftware.push({
          name: 'AutoCAD',
          path: cadPath,
          extensions: ['.dwg', '.dxf']
        });
        break;
      }
    }
  }
  
  return {
    success: true,
    isCADFile: false,
    extension: '',
    supportedExtensions,
    availableCAD: cadSoftware
  };
}

async function createWindow() {
  // 启动服务器（如果需要）
  let appUrl;
  
  if (isDev) {
    // 开发模式：连接到开发服务器
    const frontendHost = process.env.NEXT_PUBLIC_FRONTEND_HOST || '192.168.31.134';
    const frontendPort = process.env.NEXT_PUBLIC_FRONTEND_PORT || '4000';
    appUrl = `http://${frontendHost}:${frontendPort}`;
    console.log('🔧 开发模式：连接到', appUrl);
  } else if (useStaticMode) {
    // 静态模式：加载静态文件
    const staticPath = path.join(__dirname, '..', 'out', 'index.html');
    appUrl = `file://${staticPath}`;
    console.log('📁 静态模式：加载', appUrl);
  } else {
    // SSR模式：启动内置服务器
    appUrl = await startNextServer();
    if (!appUrl) {
      // 回退到静态模式
      const staticPath = path.join(__dirname, '..', 'out', 'index.html');
      appUrl = `file://${staticPath}`;
      console.log('⚠️ 回退到静态模式：', appUrl);
    } else {
      console.log('🚀 SSR模式：', appUrl);
    }
  }

  // 创建浏览器窗口
  mainWindow = new BrowserWindow({
    width: 1400,
    height: 900,
    minWidth: 1200,
    minHeight: 800,
    show: false,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      enableRemoteModule: false,
      preload: path.join(__dirname, 'preload.js'),
      webSecurity: !isDev
    }
  });

  // 加载应用
  try {
    await mainWindow.loadURL(appUrl);
  } catch (error) {
    console.error('❌ 加载应用失败:', error);
    // 尝试回退到本地文件
    const fallbackPath = path.join(__dirname, '..', 'out', 'index.html');
    if (fs.existsSync(fallbackPath)) {
      await mainWindow.loadFile(fallbackPath);
    }
  }

  // 窗口准备好后显示
  mainWindow.once('ready-to-show', () => {
    console.log('✅ 窗口准备就绪，显示窗口');
    mainWindow.show();
    
    if (isDev) {
      mainWindow.webContents.openDevTools();
    }
  });

  // 处理窗口关闭
  mainWindow.on('closed', () => {
    mainWindow = null;
    if (nextServer) {
      nextServer.close();
    }
  });
}

// 应用准备就绪
app.whenReady().then(createWindow);

// 所有窗口关闭时退出应用
app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

// macOS 激活应用
app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow();
  }
});

// IPC 处理器
ipcMain.handle('detect-cad-software', detectCADSoftware);

ipcMain.handle('open-file', async (event, filePath) => {
  try {
    await shell.openPath(filePath);
    return { success: true };
  } catch (error) {
    console.error('打开文件失败:', error);
    return { success: false, error: error.message };
  }
});

ipcMain.handle('open-cad-file', async (event, filePath) => {
  try {
    await shell.openPath(filePath);
    return { success: true };
  } catch (error) {
    console.error('打开CAD文件失败:', error);
    return { success: false, error: error.message };
  }
});

// 错误处理
process.on('uncaughtException', (error) => {
  console.error('未捕获的异常:', error);
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('未处理的Promise拒绝:', reason);
});