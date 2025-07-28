# 🚨 紧急修复：Service Worker 错误

## 立即执行以下步骤：

### 步骤1：在浏览器控制台中执行清理代码

1. 按 `F12` 打开开发者工具
2. 转到 **Console** 标签
3. 复制并粘贴以下代码，然后按回车：

```javascript
// 立即清理所有 Service Worker 和缓存
(async function() {
  console.log('🧹 开始紧急清理...');
  
  // 1. 注销所有 Service Worker
  if ('serviceWorker' in navigator) {
    const registrations = await navigator.serviceWorker.getRegistrations();
    console.log(`发现 ${registrations.length} 个 Service Worker`);
    
    for (let registration of registrations) {
      console.log('🗑️ 注销:', registration.scope);
      await registration.unregister();
    }
  }
  
  // 2. 清理所有缓存
  if ('caches' in window) {
    const cacheNames = await caches.keys();
    console.log(`发现 ${cacheNames.length} 个缓存`);
    
    for (let cacheName of cacheNames) {
      console.log('🗑️ 删除缓存:', cacheName);
      await caches.delete(cacheName);
    }
  }
  
  console.log('✅ 清理完成！');
  alert('Service Worker 已清理！现在将刷新页面...');
  window.location.reload();
})();
```

### 步骤2：如果上述方法无效，强制清理

1. 在浏览器地址栏输入：`chrome://settings/content/all` (Chrome) 或 `about:preferences#privacy` (Firefox)
2. 找到 `localhost:4000` 的条目
3. 删除所有相关数据
4. 或者在开发者工具中：
   - Application → Storage → Clear storage → Clear site data

### 步骤3：硬刷新页面

完成清理后：
- Chrome/Edge: `Ctrl+Shift+R` (Windows) 或 `Cmd+Shift+R` (Mac)
- Firefox: `Ctrl+F5` (Windows) 或 `Cmd+Shift+R` (Mac)

## 问题原因
之前的 PWA 配置留下了 Service Worker 注册，清理构建文件后它仍在尝试访问不存在的缓存资源。

## 预期结果
执行上述步骤后，所有 `sw.js` 相关错误都将消失，页面将正常加载。