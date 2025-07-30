import { defineStore } from 'pinia'
import { ref } from 'vue'
import { sseManager, type NotificationMessage } from '../utils/sseManager.ts'
import { audioManager } from '../utils/audioManager.ts'
import { notificationManager } from '../utils/notificationManager.ts'

export const useNotificationStore = defineStore('notification', () => {
  // 状态
  const notifications = ref<NotificationMessage[]>([])
  const isSSEConnected = ref(false)
  const notificationCallbackSetup = ref(false) // 添加标志位防止重复回调

  // 添加通知（增加去重逻辑）
  const addNotification = (notification: NotificationMessage) => {
    // 检查是否已存在相同ID的通知
    const existingNotification = notifications.value.find(n => n.id === notification.id)
    
    if (existingNotification) {
      return
    }

    // 额外的去重检查：检查是否有相同类型和内容的通知（在短时间内）
    const now = Date.now()
    const duplicateNotification = notifications.value.find(n => 
      n.title === notification.title &&
      n.message === notification.message &&
      (now - new Date(n.timestamp).getTime()) < 1000 // 1秒内的相同通知视为重复
    )

    if (duplicateNotification) {
      return
    }

    notifications.value.push(notification)
    
    // 智能选择并播放提示音
    const soundType = audioManager.getNotificationSound(
      notification.type, 
      notification.title, 
      notification.message
    )
    audioManager.playNotificationSound(soundType)
    
    // 发送桌面通知
    notificationManager.showNotification({
      title: notification.title,
      body: notification.message,
      tag: `app-notification-${notification.id}`,
      data: {
        type: notification.type,
        source: 'app-notification',
        originalId: notification.id
      }
    })
    
    // 如果设置了自动消失时间，添加定时器
    if (notification.duration && notification.duration > 0) {
      setTimeout(() => {
        removeNotification(notification.id)
      }, notification.duration)
    }
  }

  // 移除通知
  const removeNotification = (id: string) => {
    notifications.value = notifications.value.filter(n => n.id !== id)
  }

  // 清空所有通知
  const clearAllNotifications = () => {
    notifications.value = []
  }

  // 设置SSE连接状态
  const setSSEConnectionStatus = (connected: boolean) => {
    isSSEConnected.value = connected
  }

  // 连接SSE
  const connectSSE = async (token: string): Promise<boolean> => {
    try {
      // 防止重复注册通知回调
      if (!notificationCallbackSetup.value) {
        sseManager.addNotificationCallback((notification) => {
          addNotification(notification)
        })
        notificationCallbackSetup.value = true
      }

      // 建立连接
      const success = await sseManager.connect(token)
      setSSEConnectionStatus(success)
      
      return success
    } catch (error) {
      setSSEConnectionStatus(false)
      return false
    }
  }

  // 断开SSE
  const disconnectSSE = () => {
    sseManager.disconnect()
    setSSEConnectionStatus(false)
  }

  return {
    // 状态
    notifications,
    isSSEConnected,
    notificationCallbackSetup,
    
    // 方法
    addNotification,
    removeNotification,
    clearAllNotifications,
    setSSEConnectionStatus,
    connectSSE,
    disconnectSSE
  }
})