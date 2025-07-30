import { defineComponent, ref, computed, onMounted, onUnmounted, watch, nextTick, type PropType } from 'vue'
import { Transition, TransitionGroup } from 'vue'
import { Modal, Input, Loading, Badge, EmptySearch } from '../ui/index.ts'
import { useAuth } from '../../composables/useAuth.ts'
import {
  MagnifyingGlassIcon,
  FolderIcon,
  UsersIcon,
  BuildingOfficeIcon,
  DocumentTextIcon,
  ClockIcon,
  PhoneIcon,
  EnvelopeIcon
} from '@heroicons/vue/24/outline'

// 搜索结果类型定义
interface SearchResultItem {
  id: number
  name: string
  category: string
  type: string
  meta?: string
  description?: string
  status?: string
  department?: string
  phone?: string
  email?: string
  assignedWorker?: string
  projectIds?: number[]
  _score?: number
}

interface SearchResults {
  [key: string]: {
    name: string
    icon: any
    items: SearchResultItem[]
    count: number
    weight: number
  }
}

interface SearchModalProps {
  isOpen: boolean
  onClose: () => void
  onNavigate: (result: SearchResultItem) => void
}

// 搜索分类配置
const SEARCH_CATEGORIES = {
  projects: { 
    name: '项目', 
    icon: FolderIcon, 
    weight: 10,
    color: 'text-blue-600'
  },
  workers: { 
    name: '工人', 
    icon: UsersIcon, 
    weight: 8,
    color: 'text-green-600'
  },
  departments: { 
    name: '部门', 
    icon: BuildingOfficeIcon, 
    weight: 6,
    color: 'text-purple-600'
  },
  drawings: { 
    name: '图纸', 
    icon: DocumentTextIcon, 
    weight: 4,
    color: 'text-orange-600'
  }
}


export const SearchModal = defineComponent({
  name: 'SearchModal',
  props: {
    isOpen: {
      type: Boolean,
      required: true
    },
    onClose: {
      type: Function as PropType<() => void>,
      required: true
    },
    onNavigate: {
      type: Function as PropType<(result: SearchResultItem) => void>,
      required: true
    }
  },
  setup(props, { emit }) {
    const query = ref('')
    const results = ref<SearchResults>({})
    const loading = ref(false)
    const selectedIndex = ref(-1)
    const inputRef = ref<HTMLInputElement>()
    
    const { token } = useAuth()
    
    // 直接在组件内实现防抖，避免外部函数的复杂性
    let debounceTimer: number | null = null
    
    // 监听query变化并防抖
    watch(query, (newQuery) => {
      if (debounceTimer) {
        clearTimeout(debounceTimer)
      }
      
      debounceTimer = window.setTimeout(() => {
        if (newQuery && newQuery.trim()) {
          performSearch(newQuery.trim())
        } else {
          results.value = {}
          selectedIndex.value = -1
        }
      }, 300)
    })

    // 扁平化结果用于键盘导航
    const flatResults = computed(() => {
      const flat: (SearchResultItem & { categoryKey: string })[] = []
      Object.entries(results.value).forEach(([categoryKey, category]) => {
        category.items.forEach((item) => {
          flat.push({ ...item, categoryKey })
        })
      })
      return flat
    })

    // 执行搜索 - 简化版本
    const performSearch = async (searchQuery: string) => {
      if (!searchQuery.trim() || searchQuery.length < 2 || !token.value) {
        results.value = {}
        return
      }

      loading.value = true
      try {
        const response = await fetch(`http://110.40.71.83:35001/api/search?q=${encodeURIComponent(searchQuery)}`, {
          headers: {
            'Authorization': `Bearer ${token.value}`
          }
        })

        if (response.ok) {
          const data = await response.json()
          const formattedResults = formatSearchResults(data, searchQuery)
          results.value = formattedResults
        } else {
          results.value = {}
        }
      } catch (error: any) {
        console.error('搜索失败:', error)
        results.value = {}
      } finally {
        loading.value = false
      }
    }

    // 格式化搜索结果
    const formatSearchResults = (rawResults: any, searchQuery: string): SearchResults => {
      const formatted: SearchResults = {}
      
      Object.keys(SEARCH_CATEGORIES).forEach(categoryKey => {
        const categoryData = SEARCH_CATEGORIES[categoryKey as keyof typeof SEARCH_CATEGORIES]
        const items = rawResults[categoryKey] || []
        
        if (items.length > 0) {
          // 计算相关性分数并排序
          const scoredItems = items
            .map((item: any) => ({
              ...item,
              category: categoryData.name,
              type: categoryKey,
              _score: calculateRelevanceScore(item, searchQuery, categoryKey)
            }))
            .filter((item: any) => item._score > 0)
            .sort((a: any, b: any) => b._score - a._score)
            .slice(0, 8) // 每类最多8个结果

          if (scoredItems.length > 0) {
            formatted[categoryKey] = {
              ...categoryData,
              items: scoredItems,
              count: scoredItems.length
            }
          }
        }
      })
      
      return formatted
    }

    // 计算相关性分数
    const calculateRelevanceScore = (item: any, query: string, category: string): number => {
      const queryLower = query.toLowerCase()
      let score = 0
      
      // 主要字段匹配
      const primaryField = item.name?.toLowerCase() || ''
      if (primaryField === queryLower) {
        score += 10
      } else if (primaryField.startsWith(queryLower)) {
        score += 8
      } else if (primaryField.includes(queryLower)) {
        score += 6
      }
      
      // 次要字段匹配
      const secondaryFields = [
        item.department,
        item.assignedWorker,
        item.status,
        item.description,
        item.phone,
        item.email
      ].filter(Boolean)
      
      secondaryFields.forEach(field => {
        const fieldValue = field?.toLowerCase() || ''
        if (fieldValue.includes(queryLower)) {
          score += 2
        }
      })
      
      // 根据分类权重调整
      score *= SEARCH_CATEGORIES[category as keyof typeof SEARCH_CATEGORIES].weight / 10
      
      return score
    }


    // 键盘导航
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!props.isOpen) return

      switch (e.key) {
        case 'ArrowDown':
          e.preventDefault()
          selectedIndex.value = selectedIndex.value < (flatResults.value || []).length - 1 ? selectedIndex.value + 1 : 0
          break
        case 'ArrowUp':
          e.preventDefault()
          selectedIndex.value = selectedIndex.value > 0 ? selectedIndex.value - 1 : (flatResults.value || []).length - 1
          break
        case 'Enter':
          e.preventDefault()
          if (selectedIndex.value >= 0 && (flatResults.value || [])[selectedIndex.value]) {
            handleSelect((flatResults.value || [])[selectedIndex.value])
          }
          break
        case 'Escape':
          e.preventDefault()
          props.onClose()
          break
      }
    }

    // 监听键盘事件
    onMounted(() => {
      document.addEventListener('keydown', handleKeyDown)
    })

    onUnmounted(() => {
      document.removeEventListener('keydown', handleKeyDown)
    })

    // 模态框打开时聚焦输入框 - 简化版本
    watch(() => props.isOpen, (isOpen) => {
      if (isOpen && inputRef.value) {
        nextTick(() => {
          inputRef.value?.focus()
        })
      } else if (!isOpen) {
        // 关闭时重置状态
        query.value = ''
        results.value = {}
        selectedIndex.value = -1
      }
    })

    // 处理结果选择
    const handleSelect = (result: SearchResultItem) => {
      props.onNavigate(result)
      props.onClose()
    }

    // 获取结果项的元信息
    const getResultMeta = (item: SearchResultItem) => {
      switch (item.type) {
        case 'projects':
          return `${item.status === 'completed' ? '已完成' : item.status === 'in_progress' ? '进行中' : '待处理'} • ${item.assignedWorker || '未分配'}`
        case 'workers':
          return `${item.department || '未分配部门'} • ${item.phone || '无联系方式'}`
        case 'departments':
          return `${item.meta || '0'} 名工人`
        case 'drawings':
          return `${item.description || '图纸文件'}`
        default:
          return item.meta || ''
      }
    }

    // 获取结果项图标
    const getResultIcon = (item: SearchResultItem) => {
      switch (item.type) {
        case 'projects':
          return item.status === 'completed' ? ClockIcon : FolderIcon
        case 'workers':
          return UsersIcon
        case 'departments':
          return BuildingOfficeIcon
        case 'drawings':
          return DocumentTextIcon
        default:
          return FolderIcon
      }
    }

    const totalCount = computed(() => 
      Object.values(results.value).reduce((sum, category) => sum + category.count, 0)
    )

    return () => (
      <Modal 
        isOpen={props.isOpen} 
        onClose={props.onClose}
        size="lg"
        closable={false}
        className="search-modal"
      >
        <div class="p-6">
          {/* 搜索输入框 */}
          <div class="relative">
            <Input
              ref={inputRef}
              variant="glass"
              modelValue={query.value}
              onUpdate:modelValue={(value: string) => query.value = value}
              placeholder="搜索项目、工人、部门、图纸..."
              leftIcon={<MagnifyingGlassIcon class="w-5 h-5" />}
              rightIcon={loading.value ? <Loading type="dots" size="sm" /> : null}
              className="text-lg py-4"
            />
            
            {/* 快捷键提示 */}
            <div class="absolute right-3 top-1/2 transform -translate-y-1/2 flex items-center space-x-2 text-xs text-gray-400">
              {!loading.value && (
                <>
                  <kbd class="px-1.5 py-0.5 bg-gray-100 rounded text-xs">↑↓</kbd>
                  <kbd class="px-1.5 py-0.5 bg-gray-100 rounded text-xs">⏎</kbd>
                  <kbd class="px-1.5 py-0.5 bg-gray-100 rounded text-xs">ESC</kbd>
                </>
              )}
            </div>
          </div>

          {/* 搜索结果区域 */}
          <div class="mt-6">
            {(query.value || '').length > 0 && (
              <div class="mb-4 text-sm text-gray-500">
                {loading.value ? '搜索中...' : totalCount.value > 0 ? `找到 ${totalCount.value} 个结果` : ''}
              </div>
            )}

            <div class="max-h-96 overflow-y-auto">
              <TransitionGroup
                enterActiveClass="transition-all duration-200"
                leaveActiveClass="transition-all duration-200"
                enterFromClass="opacity-0 translate-y-2"
                enterToClass="opacity-100 translate-y-0"
                leaveFromClass="opacity-100 translate-y-0"
                leaveToClass="opacity-0 -translate-y-2"
              >
                {Object.entries(results.value).map(([categoryKey, categoryData]) => (
                  <div
                    key={categoryKey}
                    class="mb-6 last:mb-0"
                  >
                    {/* 分类标题 */}
                    <div class="flex items-center mb-3">
                      <categoryData.icon class="w-4 h-4 mr-2 text-gray-500" />
                      <span class="font-medium text-gray-700">{categoryData.name}</span>
                      <Badge variant="secondary" size="sm" className="ml-2">
                        {categoryData.count}
                      </Badge>
                    </div>
                    
                    {/* 结果列表 */}
                    <div class="space-y-2">
                      {categoryData.items.map((item, index) => {
                        const globalIndex = flatResults.value.findIndex(f => f.id === item.id && f.categoryKey === categoryKey)
                        const isSelected = selectedIndex.value === globalIndex
                        const ItemIcon = getResultIcon(item)
                        
                        return (
                          <div
                            key={`${categoryKey}-${item.id}`}
                            class={`p-3 rounded-lg cursor-pointer transition-all duration-200 ${
                              isSelected
                                ? 'bg-ios18-blue/10 border border-ios18-blue/20 shadow-sm' 
                                : 'hover:bg-gray-50 border border-transparent'
                            }`}
                            onClick={() => handleSelect(item)}
                            style={{
                              transform: 'translateX(0)',
                              transition: 'transform 0.2s'
                            }}
                            onMouseenter={(e) => {
                              (e.target as HTMLElement).style.transform = 'translateX(2px)'
                            }}
                            onMouseleave={(e) => {
                              (e.target as HTMLElement).style.transform = 'translateX(0)'
                            }}
                          >
                            <div class="flex items-center justify-between">
                              <div class="flex items-center space-x-3 flex-1 min-w-0">
                                <ItemIcon class={`w-5 h-5 flex-shrink-0 ${isSelected ? 'text-ios18-blue' : 'text-gray-400'}`} />
                                <div class="flex-1 min-w-0">
                                  <div class={`font-medium truncate ${isSelected ? 'text-ios18-blue' : 'text-gray-900'}`}>
                                    {item.name}
                                  </div>
                                  <div class={`text-sm truncate ${isSelected ? 'text-ios18-blue/70' : 'text-gray-500'}`}>
                                    {getResultMeta(item)}
                                  </div>
                                </div>
                              </div>
                              <Badge 
                                variant={isSelected ? 'primary' : 'secondary'} 
                                size="sm"
                              >
                                {item.category}
                              </Badge>
                            </div>
                          </div>
                        )
                      })}
                    </div>
                  </div>
                ))}
              </TransitionGroup>
            </div>

            {/* 空状态 */}
            {totalCount.value === 0 && (query.value || '').length > 0 && !loading.value && (
              <EmptySearch 
                title="未找到相关结果"
                description="尝试调整搜索关键词或查看其他内容"
                size="sm"
              />
            )}

            {/* 搜索提示 */}
            {(query.value || '').length === 0 && (
              <div class="text-center py-8">
                <MagnifyingGlassIcon class="w-16 h-16 text-gray-300 mx-auto mb-4" />
                <div class="text-gray-500 text-sm">
                  <div class="mb-2">输入关键词开始搜索</div>
                  <div class="text-xs text-gray-400">
                    支持搜索项目、工人、部门、图纸等内容
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </Modal>
    )
  }
})