import { defineComponent, ref, onMounted, computed, watch, type PropType } from 'vue'
import { Transition } from 'vue'
import { Button } from '../ui/index.ts'
import { useAuth } from '../../composables/useAuth.ts'
import {
  FolderIcon,
  DocumentTextIcon,
  ArchiveBoxIcon,
  PlusIcon,
  ArrowPathIcon,
  LinkIcon,
  XMarkIcon
} from '@heroicons/vue/24/outline'

interface DrawingsSidebarProps {
  selectedCategory: string
  onCategoryChange: (category: string) => void
  onRefresh?: () => void
  onUploadClick?: () => void
  onMobileItemClick?: () => void
  className?: string
}

interface DrawingStats {
  all: number
  'common-parts': number
  'associated': number
  'unassociated': number
  available: number
  archived: number
}

export const DrawingsSidebar = defineComponent({
  name: 'DrawingsSidebar',
  props: {
    selectedCategory: {
      type: String,
      required: true
    },
    onCategoryChange: {
      type: Function as PropType<(category: string) => void>,
      required: true
    },
    onRefresh: Function as PropType<() => void>,
    onUploadClick: Function as PropType<() => void>,
    onMobileItemClick: Function as PropType<() => void>,
    className: {
      type: String,
      default: ''
    }
  },
  setup(props, { emit }) {
    const { token, user } = useAuth()
    const stats = ref<DrawingStats>({
      all: 0,
      'common-parts': 0,
      'associated': 0,
      'unassociated': 0,
      available: 0,
      archived: 0
    })
    const loading = ref(false)
    const expandedGroups = ref<Set<string>>(
      new Set(['categories', 'association', 'status'])
    )

    // 获取图纸统计信息
    const fetchStats = async () => {
      if (!token.value) return
      
      loading.value = true
      try {
        // 只获取可用的图纸进行统计，不包括归档的
        const response = await fetch('http://110.40.71.83:35001/api/drawings?limit=1000&status=可用', {
          headers: {
            'Authorization': `Bearer ${token.value}`
          }
        })
        
        if (response.ok) {
          const data = await response.json()
          const drawings = data.drawings || []
          
          const newStats: DrawingStats = {
            'all': drawings.length,
            'common-parts': drawings.filter((d: any) => d.isCommonPart).length,
            'associated': drawings.filter((d: any) => !d.isCommonPart && d.project && d.project.id).length,
            'unassociated': drawings.filter((d: any) => !d.isCommonPart && (!d.project || !d.project.id)).length,
            'available': drawings.length, // 因为我们只查询了可用的，所以这个就是总数
            'archived': 0 // 因为我们不查询归档的，所以这个是0，或者可以单独查询
          }
          
          // 如果需要显示归档数量，可以单独查询
          const archivedResponse = await fetch('http://110.40.71.83:35001/api/drawings?limit=1000&status=已归档', {
            headers: {
              'Authorization': `Bearer ${token.value}`
            }
          })
          
          if (archivedResponse.ok) {
            const archivedData = await archivedResponse.json()
            newStats.archived = (archivedData.drawings || []).length
          }
          
          stats.value = newStats
        }
      } catch (error) {
        console.error('获取图纸统计失败:', error)
      } finally {
        loading.value = false
      }
    }

    // 切换分组展开状态
    const toggleGroup = (groupKey: string) => {
      const newExpanded = new Set(expandedGroups.value)
      if (newExpanded.has(groupKey)) {
        newExpanded.delete(groupKey)
      } else {
        newExpanded.add(groupKey)
      }
      expandedGroups.value = newExpanded
    }

    // 处理刷新
    const handleRefresh = () => {
      fetchStats()
      props.onRefresh?.()
      props.onMobileItemClick?.() // 移动端自动收回侧边栏
    }

    // 分类数据
    const categories = computed(() => [
      {
        key: 'categories',
        label: '图纸分类',
        icon: FolderIcon,
        items: [
          { key: 'all', label: '全部图纸', count: stats.value.all, icon: DocumentTextIcon },
          { key: 'common-parts', label: '常用零件', count: stats.value['common-parts'], icon: ArchiveBoxIcon }
        ]
      },
      {
        key: 'association',
        label: '项目关联',
        icon: LinkIcon,
        items: [
          { key: 'associated', label: '关联项目', count: stats.value.associated, icon: LinkIcon },
          { key: 'unassociated', label: '未关联项目', count: stats.value.unassociated, icon: XMarkIcon }
        ]
      },
      {
        key: 'status',
        label: '状态分类',
        icon: ArchiveBoxIcon,
        items: [
          { key: 'available', label: '可用', count: stats.value.available, icon: DocumentTextIcon },
          { key: 'archived', label: '已归档', count: stats.value.archived, icon: ArchiveBoxIcon }
        ]
      }
    ])

    onMounted(() => {
      fetchStats()
    })

    watch(token, (newToken) => {
      if (newToken) {
        fetchStats()
      }
    })

    return () => (
      <div class={`bg-white/80 backdrop-blur-xl border-r border-gray-200 flex flex-col h-full ${props.className}`}>
        {/* 标题区域 */}
        <div class="px-3 py-2.5 border-b border-gray-200 flex-shrink-0">
          <div class="flex items-center justify-between">
            <h2 class="font-semibold text-text-primary text-sm">图纸库</h2>
            <div class="flex items-center space-x-1.5">
              <Button
                variant="ghost"
                size="sm"
                onClick={handleRefresh}
                disabled={loading.value}
                className="p-1.5"
              >
                <ArrowPathIcon class={`w-4 h-4 ${loading.value ? 'animate-spin' : ''}`} />
              </Button>
              {user.value?.role === 'admin' && (
                <Button
                  className="bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 p-1.5"
                  size="sm"
                  onClick={() => {
                    props.onUploadClick?.()
                    props.onMobileItemClick?.() // 移动端自动收回侧边栏
                  }}
                >
                  <PlusIcon class="w-4 h-4" />
                </Button>
              )}
            </div>
          </div>
        </div>

        {/* 侧边栏树 */}
        <div class="flex-1 overflow-y-auto">
          {categories.value.map((group) => (
            <div key={group.key} class="border-b border-gray-100 last:border-b-0">
              {/* 分组标题 */}
              <Button
                onClick={() => toggleGroup(group.key)}
                variant="ghost"
                className="w-full px-3 py-2.5 flex items-center justify-between hover:bg-gray-50 transition-colors h-auto"
              >
                <div class="flex items-center space-x-2">
                  <div class="text-ios18-blue">
                    <group.icon class="w-4 h-4" />
                  </div>
                  <span class="font-medium text-text-primary text-sm truncate">{group.label}</span>
                  <span class="text-xs bg-gray-100 text-text-secondary px-1.5 py-0.5 rounded text-xs">
                    {group.items.length}
                  </span>
                </div>
                <span
                  class="text-text-tertiary text-sm transition-transform duration-200"
                  style={{
                    transform: `rotate(${expandedGroups.value.has(group.key) ? 90 : 0}deg)`
                  }}
                >
                  ▶
                </span>
              </Button>

              {/* 分组内容 */}
              <Transition
                enterActiveClass="transition-all duration-200"
                leaveActiveClass="transition-all duration-200"
                enterFromClass="max-h-0 opacity-0"
                enterToClass="max-h-96 opacity-100"
                leaveFromClass="max-h-96 opacity-100"
                leaveToClass="max-h-0 opacity-0"
              >
                {expandedGroups.value.has(group.key) && (
                  <div class="overflow-hidden">
                    <div class="py-1">
                      {group.items.map((item) => (
                        <div
                          key={item.key}
                          class="relative"
                          style={{
                            opacity: 0,
                            transform: 'translateX(-10px)',
                            animation: 'slideInLeft 0.2s ease-out forwards'
                          }}
                        >
                          <Button
                            onClick={() => {
                              props.onCategoryChange(item.key)
                              props.onMobileItemClick?.() // 通知移动端关闭侧边栏
                            }}
                            variant="ghost"
                            className={`w-full px-6 py-2 flex items-center justify-between text-left transition-colors hover:bg-gray-50 h-auto ${
                              props.selectedCategory === item.key 
                                ? 'bg-ios18-blue/10 text-ios18-blue border-r-2 border-ios18-blue' 
                                : 'text-text-secondary hover:text-text-primary'
                            }`}
                          >
                            <div class="flex items-center space-x-2">
                              <div class={props.selectedCategory === item.key ? 'text-ios18-blue' : 'text-text-tertiary'}>
                                <item.icon class="w-4 h-4" />
                              </div>
                              <span class="text-sm truncate">{item.label}</span>
                            </div>
                            <div class="flex items-center space-x-1">
                              <span class="text-xs bg-gray-100 text-text-secondary px-1.5 py-0.5 rounded text-xs">
                                {item.count}
                              </span>
                            </div>
                          </Button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </Transition>
            </div>
          ))}
        </div>

        <style jsx>{`
          @keyframes slideInLeft {
            to {
              opacity: 1;
              transform: translateX(0);
            }
          }
        `}</style>
      </div>
    )
  }
})