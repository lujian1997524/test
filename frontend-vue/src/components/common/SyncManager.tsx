import { defineComponent, onMounted, onUnmounted } from 'vue'
import { useGlobalSyncStore } from '../../stores/index.ts'
import { Badge } from '../ui/index.ts'

/**
 * 全局状态同步初始化组件
 * 在应用启动时初始化事件监听器
 */
export const GlobalSyncInitializer = defineComponent({
  name: 'GlobalSyncInitializer',
  setup() {
    const { startEventListeners, stopEventListeners } = useGlobalSyncStore()

    onMounted(() => {
      // 启动全局事件监听器
      startEventListeners()
    })

    onUnmounted(() => {
      // 组件卸载时清理
      stopEventListeners()
    })

    // 此组件不渲染任何内容
    return () => null
  }
})

/**
 * 状态同步状态指示器
 * 显示当前的同步状态
 */
export const SyncStatusIndicator = defineComponent({
  name: 'SyncStatusIndicator',
  setup() {
    const { isOnline, lastSyncTime, syncErrors } = useGlobalSyncStore()

    const formatLastSync = (timestamp: number) => {
      const now = Date.now()
      const diff = now - timestamp
      
      if (diff < 60000) { // 1分钟内
        return '刚刚'
      } else if (diff < 3600000) { // 1小时内
        return `${Math.floor(diff / 60000)}分钟前`
      } else {
        return new Date(timestamp).toLocaleTimeString()
      }
    }

    return () => (
      <div class="flex items-center space-x-2 text-sm">
        {/* 在线状态指示器 */}
        <Badge
          variant={isOnline.value ? 'success' : 'danger'}
          size="sm"
          class="flex items-center space-x-1"
        >
          <div 
            class={`w-2 h-2 rounded-full ${
              isOnline.value ? 'bg-green-500' : 'bg-red-500'
            }`}
          />
          <span>
            {isOnline.value ? '在线' : '离线'}
          </span>
        </Badge>

        {/* 最后同步时间 */}
        {isOnline.value && (
          <span class="text-gray-500">
            最后同步: {formatLastSync(lastSyncTime.value)}
          </span>
        )}

        {/* 错误指示器 */}
        {(syncErrors.value || []).length > 0 && (
          <Badge
            variant="warning"
            size="sm"
            class="cursor-pointer"
          >
            ⚠️ {(syncErrors.value || []).length}个同步问题
          </Badge>
        )}
      </div>
    )
  }
})

export default GlobalSyncInitializer