import { defineComponent, ref, watch, onMounted, onUnmounted, computed, type PropType } from 'vue'
import { Transition } from 'vue'
import { Button, Input, Card, Modal } from '../ui/index.ts'
import { configManager, type AppConfig } from '../../utils/configManager.ts'
import { audioManager, type SoundType } from '../../utils/audioManager.ts'
import { useAuth } from '../../composables/useAuth.ts'
import {
  CogIcon,
  WifiIcon,
  ExclamationTriangleIcon,
  CheckCircleIcon,
  XMarkIcon,
  SpeakerWaveIcon,
  BellIcon
} from '@heroicons/vue/24/outline'

interface SettingsPageProps {
  isOpen: boolean
  onClose: () => void
}

export const SettingsPage = defineComponent({
  name: 'SettingsPage',
  props: {
    isOpen: {
      type: Boolean,
      required: true
    },
    onClose: {
      type: Function as PropType<() => void>,
      required: true
    }
  },
  setup(props) {
    const { user } = useAuth()
    const isAdmin = computed(() => user.value?.role === 'admin')
    
    const config = ref<AppConfig>(configManager.getConfig())
    const tempConfig = ref<AppConfig>(config.value)
    const testingConnection = ref(false)
    const connectionResult = ref<{
      success: boolean
      message: string
    } | null>(null)
    const saving = ref(false)
    const audioConfigRef = ref(audioManager.getConfig())

    // 音频配置响应式监听
    const updateAudioConfig = () => {
      audioConfigRef.value = audioManager.getConfig()
    }

    // 初始化时同步音频配置
    const initializeAudioConfig = () => {
      const audioConfig = audioManager.getConfig()
      const initialConfig = configManager.getConfig()
      
      // 同步音频配置
      tempConfig.value = {
        ...initialConfig,
        audio: {
          ...initialConfig.audio,
          enableSounds: audioConfig.enabled,
          notificationVolume: Math.round(audioConfig.volume * 100)
        }
      }
    }

    // 监听配置变化
    let unsubscribe: (() => void) | null = null

    onMounted(() => {
      unsubscribe = configManager.addListener((newConfig) => {
        config.value = newConfig
        tempConfig.value = newConfig
      })
    })

    onUnmounted(() => {
      if (unsubscribe) {
        unsubscribe()
      }
    })

    // 监听模态框打开状态
    watch(() => props.isOpen, (newVal) => {
      if (newVal) {
        initializeAudioConfig()
      }
    })

    // 重置为当前配置
    const handleReset = () => {
      tempConfig.value = config.value
      connectionResult.value = null
    }

    // 测试API连接
    const handleTestConnection = async () => {
      testingConnection.value = true
      connectionResult.value = null
      
      try {
        const result = await configManager.testConnection(tempConfig.value.apiUrl)
        connectionResult.value = {
          success: result.success,
          message: result.message
        }
      } catch (error) {
        connectionResult.value = {
          success: false,
          message: `连接错误: ${error instanceof Error ? error.message : '未知错误'}`
        }
      } finally {
        testingConnection.value = false
      }
    }

    // 保存配置
    const handleSave = async () => {
      if (!isAdmin.value) {
        alert('只有管理员可以修改系统配置')
        return
      }

      saving.value = true
      try {
        // 同步音频配置到 audioManager
        if (tempConfig.value.audio) {
          audioManager.setEnabled(tempConfig.value.audio.enableSounds)
          audioManager.setVolume((tempConfig.value.audio.notificationVolume || 70) / 100)
        }

        await configManager.updateConfig(tempConfig.value)
        connectionResult.value = {
          success: true,
          message: '配置保存成功'
        }
        
        // 2秒后关闭模态框
        setTimeout(() => {
          props.onClose()
        }, 2000)
      } catch (error) {
        connectionResult.value = {
          success: false,
          message: `保存失败: ${error instanceof Error ? error.message : '未知错误'}`
        }
      } finally {
        saving.value = false
      }
    }

    // 重置为默认配置
    const handleResetToDefaults = async () => {
      if (!isAdmin.value) {
        alert('只有管理员可以重置配置')
        return
      }

      if (!confirm('确定要重置为默认配置吗？此操作不可撤销。')) {
        return
      }

      try {
        await configManager.resetToDefaults()
        connectionResult.value = {
          success: true,
          message: '已重置为默认配置'
        }
      } catch (error) {
        connectionResult.value = {
          success: false,
          message: `重置失败: ${error instanceof Error ? error.message : '未知错误'}`
        }
      }
    }

    // 音频开关处理
    const handleAudioToggle = () => {
      if (!isAdmin.value) return
      const newEnabled = !audioManager.getConfig().enabled
      audioManager.setEnabled(newEnabled)
      if (newEnabled) {
        audioManager.testSound('info')
      }
      // 更新本地配置和临时配置
      updateAudioConfig()
      const audioConfig = audioManager.getConfig()
      tempConfig.value = {
        ...tempConfig.value,
        audio: {
          ...tempConfig.value.audio,
          enableSounds: audioConfig.enabled
        }
      }
    }

    // 音量变化处理
    const handleVolumeChange = (event: Event) => {
      if (!isAdmin.value) return
      const target = event.target as HTMLInputElement
      const newVolume = parseFloat(target.value)
      audioManager.setVolume(newVolume)
      updateAudioConfig()
      // 更新临时配置
      tempConfig.value = {
        ...tempConfig.value,
        audio: {
          ...tempConfig.value.audio,
          notificationVolume: Math.round(newVolume * 100)
        }
      }
    }

    // 桌面通知开关处理
    const handleDesktopNotificationToggle = async () => {
      if (!isAdmin.value) return
      if (typeof window === 'undefined' || !('Notification' in window)) {
        alert('当前浏览器不支持桌面通知')
        return
      }
      
      const newEnabled = !tempConfig.value.notifications?.desktop
      
      if (newEnabled && Notification.permission !== 'granted') {
        const permission = await Notification.requestPermission()
        if (permission !== 'granted') {
          alert('通知权限被拒绝，无法启用桌面通知')
          return
        }
      }
      
      tempConfig.value = {
        ...tempConfig.value,
        notifications: {
          ...tempConfig.value.notifications,
          desktop: newEnabled
        }
      }
    }

    // 声音通知开关处理
    const handleSoundNotificationToggle = () => {
      if (!isAdmin.value) return
      const newEnabled = !tempConfig.value.notifications?.sound
      tempConfig.value = {
        ...tempConfig.value,
        notifications: {
          ...tempConfig.value.notifications,
          sound: newEnabled
        }
      }
    }

    // 预览开关处理
    const handlePreviewToggle = () => {
      if (!isAdmin.value) return
      const newEnabled = !tempConfig.value.notifications?.showPreview
      tempConfig.value = {
        ...tempConfig.value,
        notifications: {
          ...tempConfig.value.notifications,
          showPreview: newEnabled
        }
      }
    }

    // 发送测试通知
    const handleTestNotification = async () => {
      if (typeof window === 'undefined' || !('Notification' in window)) {
        alert('当前浏览器不支持桌面通知')
        return
      }

      // 检查权限
      let permission = Notification.permission
      if (permission === 'default') {
        permission = await Notification.requestPermission()
      }

      if (permission === 'granted') {
        // 发送测试通知
        const notification = new Notification('测试通知', {
          body: tempConfig.value.notifications?.showPreview 
            ? '这是一个测试通知消息，用于验证通知功能是否正常工作。' 
            : '通知功能测试',
          icon: '/favicon.ico',
          badge: '/favicon.ico',
          tag: 'test-notification',
          requireInteraction: false,
          silent: !tempConfig.value.notifications?.sound
        })

        // 播放通知音效（如果启用）
        if (tempConfig.value.notifications?.sound && audioManager.getConfig().enabled) {
          audioManager.testSound('info')
        }

        // 3秒后自动关闭
        setTimeout(() => {
          notification.close()
        }, 3000)

        // 点击事件处理
        notification.onclick = () => {
          window.focus()
          notification.close()
        }
      } else {
        alert('通知权限被拒绝。请在浏览器设置中启用通知权限，然后刷新页面重试。')
      }
    }

    // 获取通知权限状态描述
    const notificationStatusText = computed(() => {
      if (typeof window === 'undefined' || !('Notification' in window)) {
        return '当前浏览器不支持通知'
      }
      
      switch (Notification.permission) {
        case 'granted':
          return '已授权 - 可以显示桌面通知'
        case 'denied':
          return '已拒绝 - 请在浏览器设置中启用'
        default:
          return '点击开关请求通知权限'
      }
    })

    // 音效测试选项
    const soundTestOptions = [
      { type: 'info' as SoundType, label: '信息/创建', color: 'bg-blue-100 text-blue-700 hover:bg-blue-200' },
      { type: 'success' as SoundType, label: '进行中', color: 'bg-green-100 text-green-700 hover:bg-green-200' },
      { type: 'wancheng' as SoundType, label: '已完成', color: 'bg-purple-100 text-purple-700 hover:bg-purple-200' },
      { type: 'error' as SoundType, label: '删除', color: 'bg-red-100 text-red-700 hover:bg-red-200' }
    ]

    return () => (
      <Modal
        isOpen={props.isOpen}
        onClose={props.onClose}
        title="系统设置"
        size="3xl"
      >
        <div class="space-y-6">
          {/* API配置 */}
          <Card class="p-4">
            <div class="flex items-center mb-4">
              <WifiIcon class="w-5 h-5 mr-2 text-ios18-blue" />
              <h3 class="font-semibold text-gray-900">API配置</h3>
            </div>
            
            <div class="space-y-4">
              <div>
                <label class="block text-sm font-medium text-gray-700 mb-2">
                  服务器地址
                </label>
                <div class="flex space-x-2">
                  <Input
                    type="url"
                    value={tempConfig.value.apiUrl}
                    onChange={(e) => tempConfig.value = {
                      ...tempConfig.value,
                      apiUrl: e.target.value
                    }}
                    placeholder="http://localhost:35001"
                    class="flex-1"
                    disabled={!isAdmin.value}
                    readOnly={!isAdmin.value}
                  />
                  <Button
                    variant="secondary"
                    onClick={handleTestConnection}
                    loading={testingConnection.value}
                    disabled={!tempConfig.value.apiUrl || testingConnection.value}
                  >
                    测试连接
                  </Button>
                </div>
              </div>

              <div>
                <label class="block text-sm font-medium text-gray-700 mb-2">
                  请求超时 (毫秒)
                </label>
                <Input
                  type="number"
                  value={tempConfig.value.apiTimeout}
                  onChange={(e) => tempConfig.value = {
                    ...tempConfig.value,
                    apiTimeout: parseInt(e.target.value) || 30000
                  }}
                  min="1000"
                  max="120000"
                  step="1000"
                  disabled={!isAdmin.value}
                  readOnly={!isAdmin.value}
                />
              </div>
            </div>
          </Card>

          {/* 功能开关 */}
          <Card class="p-4">
            <div class="flex items-center mb-4">
              <CogIcon class="w-5 h-5 mr-2 text-ios18-blue" />
              <h3 class="font-semibold text-gray-900">功能开关</h3>
            </div>
            
            <div class="space-y-3">
              <div class="flex items-center justify-between">
                <div>
                  <div class="font-medium text-sm">通知功能</div>
                  <div class="text-xs text-gray-500">启用系统通知提醒</div>
                </div>
                <input
                  type="checkbox"
                  checked={tempConfig.value.features.enableNotifications}
                  onChange={(e) => tempConfig.value = {
                    ...tempConfig.value,
                    features: {
                      ...tempConfig.value.features,
                      enableNotifications: e.target.checked
                    }
                  }}
                  disabled={!isAdmin.value}
                  class="rounded"
                />
              </div>

              <div class="flex items-center justify-between">
                <div>
                  <div class="font-medium text-sm">实时更新</div>
                  <div class="text-xs text-gray-500">启用SSE实时数据同步</div>
                </div>
                <input
                  type="checkbox"
                  checked={tempConfig.value.features.enableSSE}
                  onChange={(e) => tempConfig.value = {
                    ...tempConfig.value,
                    features: {
                      ...tempConfig.value.features,
                      enableSSE: e.target.checked
                    }
                  }}
                  disabled={!isAdmin.value}
                  class="rounded"
                />
              </div>

              <div class="flex items-center justify-between">
                <div>
                  <div class="font-medium text-sm">离线模式</div>
                  <div class="text-xs text-gray-500">支持离线操作</div>
                </div>
                <input
                  type="checkbox"
                  checked={tempConfig.value.features.enableOfflineMode}
                  onChange={(e) => tempConfig.value = {
                    ...tempConfig.value,
                    features: {
                      ...tempConfig.value.features,
                      enableOfflineMode: e.target.checked
                    }
                  }}
                  disabled={!isAdmin.value}
                  class="rounded"
                />
              </div>
            </div>
          </Card>

          {/* UI配置 */}
          <Card class="p-4">
            <h3 class="font-semibold text-gray-900 mb-4">界面配置</h3>
            
            <div class="space-y-4">
              <div>
                <label class="block text-sm font-medium text-gray-700 mb-2">
                  侧边栏宽度 (px)
                </label>
                <Input
                  type="number"
                  value={tempConfig.value.ui.sidebarWidth}
                  onChange={(e) => tempConfig.value = {
                    ...tempConfig.value,
                    ui: {
                      ...tempConfig.value.ui,
                      sidebarWidth: parseInt(e.target.value) || 220
                    }
                  }}
                  min="180"
                  max="400"
                  step="20"
                  disabled={!isAdmin.value}
                  readOnly={!isAdmin.value}
                />
              </div>
            </div>
          </Card>

          {/* 音频设置 */}
          <Card class="p-4">
            <div class="flex items-center mb-4">
              <SpeakerWaveIcon class="w-5 h-5 mr-2 text-ios18-blue" />
              <h3 class="font-semibold text-gray-900">音频设置</h3>
            </div>
            
            <div class="space-y-4">
              {/* 启用音效开关 */}
              <div class="flex items-center justify-between">
                <div>
                  <div class="font-medium text-sm">启用系统音效</div>
                  <div class="text-xs text-gray-500">状态变更时播放提示音</div>
                </div>
                <button
                  onClick={handleAudioToggle}
                  disabled={!isAdmin.value}
                  class={`relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed ${
                    audioConfigRef.value.enabled ? 'bg-ios18-blue' : 'bg-gray-200'
                  }`}
                >
                  <span
                    class={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ${
                      audioConfigRef.value.enabled ? 'translate-x-5' : 'translate-x-0'
                    }`}
                  />
                </button>
              </div>

              {/* 音量控制 */}
              <div class={`transition-opacity duration-200 ${audioConfigRef.value.enabled ? 'opacity-100' : 'opacity-50'}`}>
                <div class="flex items-center justify-between mb-3">
                  <label class="block text-sm font-medium text-gray-700">
                    通知音量
                  </label>
                  <span class="text-sm text-gray-500">{Math.round(audioConfigRef.value.volume * 100)}%</span>
                </div>
                <div class="flex items-center space-x-4">
                  <input
                    type="range"
                    min="0"
                    max="1"
                    step="0.05"
                    value={audioConfigRef.value.volume}
                    onChange={handleVolumeChange}
                    disabled={!isAdmin.value || !audioConfigRef.value.enabled}
                    class="flex-1 h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer disabled:cursor-not-allowed disabled:opacity-50"
                  />
                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={() => audioManager.testSound('info')}
                    disabled={!audioConfigRef.value.enabled}
                    class="whitespace-nowrap"
                  >
                    测试音量
                  </Button>
                </div>
              </div>

              {/* 音效测试区域 */}
              <div class={`transition-opacity duration-200 ${audioConfigRef.value.enabled ? 'opacity-100' : 'opacity-50'}`}>
                <h4 class="text-sm font-medium text-gray-700 mb-3">测试音效</h4>
                <div class="grid grid-cols-2 gap-3">
                  {soundTestOptions.map(({ type, label, color }) => (
                    <button
                      key={type}
                      onClick={() => audioManager.testSound(type)}
                      disabled={!audioConfigRef.value.enabled}
                      class={`px-3 py-2 rounded-lg text-xs font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${color}`}
                    >
                      {label}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </Card>

          {/* 通知设置 */}
          <Card class="p-4">
            <div class="flex items-center mb-4">
              <BellIcon class="w-5 h-5 mr-2 text-ios18-blue" />
              <h3 class="font-semibold text-gray-900">通知设置</h3>
            </div>
            
            <div class="space-y-4">
              <div class="flex items-center justify-between">
                <div>
                  <div class="font-medium text-sm">桌面通知</div>
                  <div class="text-xs text-gray-500">
                    {notificationStatusText.value}
                  </div>
                </div>
                <button
                  onClick={handleDesktopNotificationToggle}
                  disabled={!isAdmin.value}
                  class={`relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed ${
                    tempConfig.value.notifications?.desktop ? 'bg-ios18-blue' : 'bg-gray-200'
                  }`}
                >
                  <span
                    class={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ${
                      tempConfig.value.notifications?.desktop ? 'translate-x-5' : 'translate-x-0'
                    }`}
                  />
                </button>
              </div>

              <div class="flex items-center justify-between">
                <div>
                  <div class="font-medium text-sm">声音通知</div>
                  <div class="text-xs text-gray-500">通知时播放提示音（需配合音效设置）</div>
                </div>
                <button
                  onClick={handleSoundNotificationToggle}
                  disabled={!isAdmin.value}
                  class={`relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed ${
                    tempConfig.value.notifications?.sound ? 'bg-ios18-blue' : 'bg-gray-200'
                  }`}
                >
                  <span
                    class={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ${
                      tempConfig.value.notifications?.sound ? 'translate-x-5' : 'translate-x-0'
                    }`}
                  />
                </button>
              </div>

              <div class="flex items-center justify-between">
                <div>
                  <div class="font-medium text-sm">显示预览</div>
                  <div class="text-xs text-gray-500">通知中显示消息内容</div>
                </div>
                <button
                  onClick={handlePreviewToggle}
                  disabled={!isAdmin.value}
                  class={`relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed ${
                    tempConfig.value.notifications?.showPreview ? 'bg-ios18-blue' : 'bg-gray-200'
                  }`}
                >
                  <span
                    class={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ${
                      tempConfig.value.notifications?.showPreview ? 'translate-x-5' : 'translate-x-0'
                    }`}
                  />
                </button>
              </div>

              <div>
                <label class="block text-sm font-medium text-gray-700 mb-2">
                  通知位置
                </label>
                <select
                  value={tempConfig.value.notifications?.position || 'top-right'}
                  onChange={(e) => tempConfig.value = {
                    ...tempConfig.value,
                    notifications: {
                      ...tempConfig.value.notifications,
                      position: e.target.value as 'top-right' | 'top-left' | 'bottom-right' | 'bottom-left'
                    }
                  }}
                  disabled={!isAdmin.value}
                  class="w-full p-2 border border-gray-300 rounded-lg focus:ring-ios18-blue focus:border-ios18-blue disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <option value="top-right">右上角</option>
                  <option value="top-left">左上角</option>
                  <option value="bottom-right">右下角</option>
                  <option value="bottom-left">左下角</option>
                </select>
              </div>

              <div class="pt-2">
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={handleTestNotification}
                  class="w-full"
                >
                  发送测试通知
                </Button>
              </div>
            </div>
          </Card>

          {/* 连接测试结果 */}
          {connectionResult.value && (
            <Transition
              enterActiveClass="transition-all duration-300"
              leaveActiveClass="transition-all duration-200"
              enterFromClass="opacity-0 translate-y-2"
              enterToClass="opacity-100 translate-y-0"
              leaveFromClass="opacity-100 translate-y-0"
              leaveToClass="opacity-0 translate-y-2"
            >
              <div
                class={`p-3 rounded-lg flex items-center space-x-2 ${
                  connectionResult.value.success 
                    ? 'bg-green-50 text-green-800' 
                    : 'bg-red-50 text-red-800'
                }`}
              >
                {connectionResult.value.success ? (
                  <CheckCircleIcon class="w-5 h-5" />
                ) : (
                  <ExclamationTriangleIcon class="w-5 h-5" />
                )}
                <span class="text-sm">{connectionResult.value.message}</span>
              </div>
            </Transition>
          )}
        </div>

        {/* 操作按钮 */}
        <div class="flex justify-between pt-4 border-t border-gray-200">
          <div class="flex space-x-2">
            {isAdmin.value && (
              <Button
                variant="secondary"
                onClick={handleResetToDefaults}
                class="text-red-600 hover:text-red-700"
              >
                重置默认
              </Button>
            )}
          </div>
          
          <div class="flex space-x-2">
            <Button
              variant="secondary"
              onClick={handleReset}
            >
              取消
            </Button>
            {isAdmin.value && (
              <Button
                variant="primary"
                onClick={handleSave}
                loading={saving.value}
                disabled={saving.value}
              >
                保存配置
              </Button>
            )}
          </div>
        </div>

        {!isAdmin.value && (
          <div class="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
            <p class="text-sm text-blue-800">
              <strong>查看模式</strong>：您可以查看当前系统配置，但只有管理员可以修改设置。如需修改配置，请联系管理员。
            </p>
          </div>
        )}
      </Modal>
    )
  }
})

export default SettingsPage