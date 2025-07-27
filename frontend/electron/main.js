const { app, BrowserWindow, ipcMain, dialog, shell } = require('electron');
const path = require('path');
// 简单判断开发环境，避免 ES Module 问题
const isDev = process.env.NODE_ENV === 'development' || process.defaultApp || /[\\/]electron-prebuilt[\\/]/.test(process.execPath) || /[\\/]electron[\\/]/.test(process.execPath);
const fs = require('fs');

let mainWindow;

// 检测CAD软件
async function detectCADSoftware() {
  const cadSoftware = [];
  const supportedExtensions = ['.dwg', '.dxf', '.step', '.stp', '.iges', '.igs'];
  
  // Windows CAD软件检测
  if (process.platform === 'win32') {
    const commonPaths = [
      'C:\\Program Files\\Autodesk\\AutoCAD 2024\\acad.exe',
      'C:\\Program Files\\Autodesk\\AutoCAD 2023\\acad.exe',
      'C:\\Program Files\\Autodesk\\AutoCAD 2022\\acad.exe',
      'C:\\Program Files (x86)\\Autodesk\\AutoCAD 2024\\acad.exe',
      'C:\\Program Files (x86)\\Autodesk\\AutoCAD 2023\\acad.exe',
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
    software: cadSoftware,
    supportedExtensions
  };
}

// 打开CAD文件
async function openCADFile(filePath) {
  try {
    const detectedSoftware = await detectCADSoftware();
    
    if (detectedSoftware.software.length === 0) {
      return {
        success: false,
        error: '未检测到CAD软件'
      };
    }
    
    const cadApp = detectedSoftware.software[0];
    const { spawn } = require('child_process');
    
    spawn(cadApp.path, [filePath], {
      detached: true,
      stdio: 'ignore'
    }).unref();
    
    return {
      success: true,
      software: cadApp.name,
      message: `已使用 ${cadApp.name} 打开文件`
    };
  } catch (error) {
    return {
      success: false,
      error: error.message
    };
  }
}

// 判断是否为CAD文件
async function isCADFile(filePath) {
  const extension = path.extname(filePath).toLowerCase();
  const supportedExtensions = ['.dwg', '.dxf', '.step', '.stp', '.iges', '.igs'];
  
  return {
    success: true,
    isCADFile: supportedExtensions.includes(extension),
    extension,
    supportedExtensions
  };
}

function createWindow() {
  // 创建浏览器窗口
  mainWindow = new BrowserWindow({
    width: 1400,
    height: 900,
    minWidth: 1200,
    minHeight: 800,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      enableRemoteModule: false,
      preload: path.join(__dirname, 'preload.js'),
      webSecurity: false // 暂时禁用web安全，用于调试
    },
    autoHideMenuBar: true, // 隐藏菜单栏
    show: false
  });

  // 调试模式：根据开发/生产环境加载不同页面
  if (isDev) {
    console.log('🔧 开发模式：连接到本地开发服务器');
    const frontendHost = process.env.NEXT_PUBLIC_FRONTEND_HOST || '192.168.31.134';
    const frontendPort = process.env.NEXT_PUBLIC_FRONTEND_PORT || '4000';
    const devUrl = `http://${frontendHost}:${frontendPort}`;
    mainWindow.loadURL(devUrl);
    
    // 开发环境也注入环境变量
    mainWindow.webContents.on('dom-ready', () => {
      const backendHost = process.env.NEXT_PUBLIC_BACKEND_HOST || '192.168.31.134';
      const backendPort = process.env.NEXT_PUBLIC_BACKEND_PORT || '35001';
      
      mainWindow.webContents.executeJavaScript(`
        window.ELECTRON_ENV = true;
        window.BACKEND_URL = 'http://${backendHost}:${backendPort}';
        console.log('🔧 开发模式：已注入Electron环境变量');
      `);
    });
  } else {
    console.log('🔧 生产模式：加载主应用');
    // 直接加载主页面，跳过测试页面
    const indexPath = path.join(__dirname, '../out/index.html');
    console.log('📁 主页面路径：', indexPath);
    console.log('📁 主页面是否存在：', require('fs').existsSync(indexPath));
    console.log('📁 当前平台：', process.platform);
    
    // Windows和其他平台的文件URL处理
    let fileUrl;
    if (process.platform === 'win32') {
      // Windows平台特殊处理
      fileUrl = `file:///${indexPath.replace(/\\/g, '/')}`;
      console.log('🪟 Windows文件URL：', fileUrl);
    } else {
      fileUrl = `file://${indexPath}`;
      console.log('🍎 非Windows文件URL：', fileUrl);
    }
    
    // 注入环境变量，让应用知道这是Electron环境
    mainWindow.webContents.on('dom-ready', () => {
      const backendHost = process.env.NEXT_PUBLIC_BACKEND_HOST || '192.168.31.134';
      const backendPort = process.env.NEXT_PUBLIC_BACKEND_PORT || '35001';
      
      mainWindow.webContents.executeJavaScript(`
        window.ELECTRON_ENV = true;
        // 尝试多个可能的后端地址
        window.POSSIBLE_BACKEND_URLS = [
          'http://${backendHost}:${backendPort}',  // 配置的IP
          'http://localhost:35001',       // 本地
          'http://127.0.0.1:35001'        // 本地IP
        ];
        window.BACKEND_URL = window.POSSIBLE_BACKEND_URLS[0]; // 默认使用第一个
        console.log('🔧 已注入Electron环境变量');
        console.log('🔧 当前URL:', window.location.href);
        console.log('🔧 当前协议:', window.location.protocol);
        console.log('🔧 用户代理:', navigator.userAgent);
        console.log('🔧 可能的后端地址:', window.POSSIBLE_BACKEND_URLS);
      `);
    });
    
    mainWindow.loadURL(fileUrl);
  }

  // 窗口准备好后显示
  mainWindow.once('ready-to-show', () => {
    console.log('✅ 窗口准备就绪，显示窗口');
    mainWindow.show();
  });

  // 添加加载失败监听
  mainWindow.webContents.on('did-fail-load', (event, errorCode, errorDescription, validatedURL) => {
    console.error('❌ 页面加载失败：', errorCode, errorDescription, validatedURL);
  });

  // 添加资源请求失败监听
  mainWindow.webContents.session.webRequest.onErrorOccurred((details) => {
    console.error('❌ 资源请求失败：', details.url, details.error);
  });

  // 添加资源请求完成监听
  mainWindow.webContents.session.webRequest.onCompleted((details) => {
    if (details.statusCode >= 400) {
      console.error('❌ 资源请求失败 HTTP', details.statusCode, ':', details.url);
    }
  });

  // 添加页面加载完成监听
  mainWindow.webContents.on('did-finish-load', () => {
    console.log('✅ 页面加载完成');
    
    // 注入调试脚本
    mainWindow.webContents.executeJavaScript(`
      console.log('🔍 Electron 调试信息:');
      console.log('- 页面 URL:', window.location.href);
      console.log('- 用户代理:', navigator.userAgent);
      console.log('- 页面标题:', document.title);
      console.log('- DOM 状态:', document.readyState);
      console.log('- Body 内容长度:', document.body ? document.body.innerHTML.length : '无 body');
      
      // 捕获所有错误
      window.addEventListener('error', (event) => {
        console.error('🚨 页面错误:', event.error);
        console.error('- 文件:', event.filename);
        console.error('- 行号:', event.lineno);
        console.error('- 列号:', event.colno);
      });
      
      // 捕获未处理的 Promise 拒绝
      window.addEventListener('unhandledrejection', (event) => {
        console.error('🚨 未处理的 Promise 拒绝:', event.reason);
      });
      
      // 检查 React 是否加载
      setTimeout(() => {
        const reactElements = document.querySelectorAll('[data-reactroot], #__next, [id*="react"]');
        console.log('⚛️ React 元素数量:', reactElements.length);
        if (reactElements.length === 0) {
          console.warn('⚠️ 未找到 React 元素，可能是静态文件加载问题');
        }
      }, 2000);
    `);
  });

  // 开发模式下打开开发者工具
  if (isDev) {
    mainWindow.webContents.openDevTools();
  }

  // 临时：Windows调试 - 生产环境也打开开发者工具
  if (!isDev) {
    console.log('🐛 Windows调试模式：打开开发者工具');
    mainWindow.webContents.openDevTools();
  }

  // 窗口关闭事件
  mainWindow.on('closed', () => {
    mainWindow = null;
  });

  // 处理外部链接
  mainWindow.webContents.setWindowOpenHandler(({ url }) => {
    shell.openExternal(url);
    return { action: 'deny' };
  });
}

// 应用程序就绪时创建窗口
app.whenReady().then(() => {
  createWindow();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});

// 所有窗口关闭时退出应用
app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

// IPC 处理程序
ipcMain.handle('detect-cad-software', detectCADSoftware);
ipcMain.handle('open-cad-file', (event, filePath) => openCADFile(filePath));
ipcMain.handle('is-cad-file', (event, filePath) => isCADFile(filePath));
ipcMain.handle('get-detected-cad-software', detectCADSoftware);

// 打开文件对话框
ipcMain.handle('open-file-dialog', async () => {
  const result = await dialog.showOpenDialog(mainWindow, {
    properties: ['openFile'],
    filters: [
      { name: 'CAD Files', extensions: ['dwg', 'dxf', 'step', 'stp', 'iges', 'igs'] },
      { name: 'All Files', extensions: ['*'] }
    ]
  });
  
  return result;
});

// 打开文件
ipcMain.handle('open-file', async (event, filePath) => {
  try {
    await shell.openPath(filePath);
    return { success: true };
  } catch (error) {
    return { success: false, error: error.message };
  }
});