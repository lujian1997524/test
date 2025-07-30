import { defineComponent, provide } from 'vue'
import { createAuth, AuthInjectionKey } from './composables/useAuth.ts'
import { GlobalSyncInitializer } from './components/common/SyncManager.tsx'
import Home from './views/Home.tsx'

export default defineComponent({
  name: 'App',
  setup() {
    // 创建认证状态并提供给子组件
    const auth = createAuth()
    provide(AuthInjectionKey, auth)

    return () => (
      <div id="app" style={{ minHeight: '100vh' }}>
        {/* 全局认证提供者和同步管理器 */}
        <GlobalSyncInitializer />
        <Home />
      </div>
    )
  }
})