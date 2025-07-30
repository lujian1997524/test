import { defineStore } from 'pinia'
import { ref } from 'vue'

// 事件监听器引用
let eventListeners: (() => void)[] = []

export const useGlobalSyncStore = defineStore('globalSync', () => {
  // 状态
  const isOnline = ref(true)
  const lastSyncTime = ref(Date.now())
  const syncErrors = ref<string[]>([])

  // 设置在线状态
  const setOnlineStatus = (status: boolean) => {
    isOnline.value = status
    
    if (status) {
      // 上线时清除错误
      clearSyncErrors()
    }
  }

  // 添加同步错误
  const addSyncError = (error: string) => {
    syncErrors.value = [...syncErrors.value.slice(-9), error] // 只保留最近10个错误
  }

  // 清除同步错误
  const clearSyncErrors = () => {
    syncErrors.value = []
  }

  // 更新最后同步时间
  const updateLastSyncTime = () => {
    lastSyncTime.value = Date.now()
  }

  // 启动事件监听器
  const startEventListeners = () => {
    // 监听网络状态
    const handleOnline = () => setOnlineStatus(true)
    const handleOffline = () => setOnlineStatus(false)
    
    // 监听数据更新事件
    const handleProjectCreated = () => {
      updateLastSyncTime()
      console.log('📝 项目已创建，状态已同步')
    }
    
    const handleProjectUpdated = () => {
      updateLastSyncTime()
      console.log('✏️ 项目已更新，状态已同步')
    }
    
    const handleMaterialUpdated = () => {
      updateLastSyncTime()
      console.log('🔧 材料状态已更新，状态已同步')
    }

    // 注册事件监听器
    window.addEventListener('online', handleOnline)
    window.addEventListener('offline', handleOffline)
    window.addEventListener('project-created', handleProjectCreated)
    window.addEventListener('project-updated', handleProjectUpdated)
    window.addEventListener('material-status-changed', handleMaterialUpdated)

    // 保存清理函数
    eventListeners = [
      () => window.removeEventListener('online', handleOnline),
      () => window.removeEventListener('offline', handleOffline),
      () => window.removeEventListener('project-created', handleProjectCreated),
      () => window.removeEventListener('project-updated', handleProjectUpdated),
      () => window.removeEventListener('material-status-changed', handleMaterialUpdated),
    ]
  }

  // 停止事件监听器
  const stopEventListeners = () => {
    eventListeners.forEach(cleanup => cleanup())
    eventListeners = []
  }

  return {
    // 状态
    isOnline,
    lastSyncTime,
    syncErrors,
    
    // 方法
    setOnlineStatus,
    addSyncError,
    clearSyncErrors,
    updateLastSyncTime,
    startEventListeners,
    stopEventListeners
  }
})