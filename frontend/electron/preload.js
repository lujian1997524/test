const { contextBridge, ipcRenderer } = require('electron');

// 向渲染进程暴露安全的API
contextBridge.exposeInMainWorld('electronAPI', {
  // 调用主进程方法
  invoke: (channel, ...args) => ipcRenderer.invoke(channel, ...args),
  
  // 打开文件
  openFile: (filePath) => ipcRenderer.invoke('open-file', filePath),
  
  // 检测CAD软件
  detectCADSoftware: () => ipcRenderer.invoke('detect-cad-software'),
  
  // 打开CAD文件
  openCADFile: (filePath) => ipcRenderer.invoke('open-cad-file', filePath),
  
  // 获取检测到的CAD软件
  getDetectedCADSoftware: () => ipcRenderer.invoke('get-detected-cad-software'),
  
  // 判断是否为CAD文件
  isCADFile: (filePath) => ipcRenderer.invoke('is-cad-file', filePath),
  
  // 打开文件对话框
  openFileDialog: () => ipcRenderer.invoke('open-file-dialog'),
  
  // 系统信息
  platform: process.platform,
  
  // 应用信息
  getAppVersion: () => ipcRenderer.invoke('get-app-version')
});