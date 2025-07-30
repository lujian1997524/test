import { defineComponent, ref, watch, computed, type PropType } from 'vue'
import { Modal, Button, Loading } from './index.ts'

interface SortableItem {
  id: number
  name: string
  currentPosition: number
  newPosition?: number
}

// Vue原生拖拽项目组件
const DraggableItem = defineComponent({
  props: {
    item: { type: Object as PropType<SortableItem>, required: true },
    index: { type: Number, required: true },
    isDragging: { type: Boolean, default: false },
    onDragStart: { type: Function as PropType<(e: DragEvent) => void>, required: true },
    onDragEnd: { type: Function as PropType<(e: DragEvent) => void>, required: true },
    onDragOver: { type: Function as PropType<(e: DragEvent) => void>, required: true },
    onDrop: { type: Function as PropType<(e: DragEvent) => void>, required: true }
  },
  setup(props) {
    return () => (
      <div
        draggable="true"
        data-index={props.index}
        data-id={props.item.id}
        onDragstart={props.onDragStart}
        onDragend={props.onDragEnd}
        onDragover={props.onDragOver}
        onDrop={props.onDrop}
        class={[
          "flex items-center justify-between p-3 rounded-lg cursor-move transition-all duration-200",
          props.isDragging 
            ? "bg-blue-100 border-2 border-blue-300 shadow-lg opacity-60" 
            : "bg-gray-50 hover:bg-gray-100 border-2 border-transparent"
        ]}
        style={{
          transform: props.isDragging ? 'rotate(2deg)' : 'none'
        }}
      >
        <div class="flex items-center space-x-3">
          <div class="flex-shrink-0 w-6 h-6 bg-gray-300 rounded flex items-center justify-center text-xs font-medium text-gray-600">
            {props.index + 1}
          </div>
          <div class="flex-1 min-w-0">
            <div class="text-sm font-medium text-gray-900 truncate">
              {props.item.name}
            </div>
            <div class="text-xs text-gray-500">
              原始位置: {props.item.currentPosition}
            </div>
          </div>
        </div>
        <div class="flex-shrink-0">
          <svg class="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 8h16M4 16h16" />
          </svg>
        </div>
      </div>
    )
  }
})

export const BatchSortModal = defineComponent({
  name: 'BatchSortModal',
  props: {
    isOpen: {
      type: Boolean,
      required: true
    },
    onClose: {
      type: Function as PropType<() => void>,
      required: true
    },
    items: {
      type: Array as PropType<SortableItem[]>,
      required: true
    },
    onSave: {
      type: Function as PropType<(reorderedItems: SortableItem[]) => Promise<void>>,
      required: true
    },
    title: {
      type: String,
      default: '批量调整排序'
    }
  },
  setup(props) {
    const sortItems = ref<SortableItem[]>([])
    const loading = ref(false)
    const draggedItemIndex = ref<number | null>(null)
    const dragOverIndex = ref<number | null>(null)

    // 检查是否有更改
    const hasChanges = computed(() => {
      return sortItems.value.some((item, index) => item.currentPosition !== index + 1)
    })

    // 当模态框打开时，初始化数据
    watch(() => props.isOpen, (isOpen) => {
      if (isOpen) {
        // 按照当前位置排序初始化
        sortItems.value = [...props.items].sort((a, b) => a.currentPosition - b.currentPosition)
        draggedItemIndex.value = null
        dragOverIndex.value = null
      }
    })

    // Vue原生拖拽事件处理
    const handleDragStart = (e: DragEvent) => {
      const index = parseInt((e.target as HTMLElement).dataset.index || '0')
      draggedItemIndex.value = index
      if (e.dataTransfer) {
        e.dataTransfer.effectAllowed = 'move'
        e.dataTransfer.setData('text/html', (e.target as HTMLElement).outerHTML)
      }
    }

    const handleDragEnd = (e: DragEvent) => {
      draggedItemIndex.value = null
      dragOverIndex.value = null
    }

    const handleDragOver = (e: DragEvent) => {
      e.preventDefault()
      if (e.dataTransfer) {
        e.dataTransfer.dropEffect = 'move'
      }
      const index = parseInt((e.currentTarget as HTMLElement).dataset.index || '0')
      dragOverIndex.value = index
    }

    const handleDrop = (e: DragEvent) => {
      e.preventDefault()
      
      if (draggedItemIndex.value === null) return
      
      const dropIndex = parseInt((e.currentTarget as HTMLElement).dataset.index || '0')
      
      if (draggedItemIndex.value !== dropIndex) {
        // 执行数组移动
        const items = [...sortItems.value]
        const draggedItem = items[draggedItemIndex.value]
        
        // 移除拖拽的项目
        items.splice(draggedItemIndex.value, 1)
        
        // 在新位置插入
        items.splice(dropIndex, 0, draggedItem)
        
        sortItems.value = items
      }
      
      draggedItemIndex.value = null
      dragOverIndex.value = null
    }

    // 重置排序
    const resetOrder = () => {
      sortItems.value = [...props.items].sort((a, b) => a.currentPosition - b.currentPosition)
    }

    // 自动排序 - 按字母顺序
    const sortAlphabetically = () => {
      sortItems.value = [...sortItems.value].sort((a, b) => a.name.localeCompare(b.name, 'zh-CN'))
    }

    // 反向排序
    const reverseOrder = () => {
      sortItems.value = [...sortItems.value].reverse()
    }

    // 保存排序
    const handleSave = async () => {
      if (!hasChanges.value) {
        props.onClose()
        return
      }

      loading.value = true
      try {
        // 为每个项目分配新的排序位置
        const reorderedItems = sortItems.value.map((item, index) => ({
          ...item,
          newPosition: index + 1
        }))
        await props.onSave(reorderedItems)
        props.onClose()
      } catch (error) {
        console.error('保存排序失败:', error)
      } finally {
        loading.value = false
      }
    }

    // 获取当前是否正在拖拽
    const isDragging = computed(() => draggedItemIndex.value !== null)

    return () => (
      <Modal
        isOpen={props.isOpen}
        onClose={props.onClose}
        title={props.title}
        size="lg"
        footer={
          <div class="flex items-center justify-between w-full">
            <div class="flex space-x-2">
              <Button
                variant="outline"
                size="sm"
                onClick={sortAlphabetically}
                class="flex items-center space-x-1"
              >
                <span>按字母排序</span>
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={reverseOrder}
                class="flex items-center space-x-1"
              >
                <span>反向排序</span>
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={resetOrder}
                class="flex items-center space-x-1"
              >
                <span>重置排序</span>
              </Button>
            </div>
            <div class="flex space-x-2">
              <Button
                variant="ghost"
                onClick={props.onClose}
                disabled={loading.value}
              >
                取消
              </Button>
              <Button
                variant="primary"
                onClick={handleSave}
                disabled={loading.value || !hasChanges.value}
                class="flex items-center space-x-2"
              >
                {loading.value && <Loading size="sm" />}
                <span>保存排序</span>
              </Button>
            </div>
          </div>
        }
      >
        <div class="space-y-4">
          <div class="text-sm text-gray-600">
            通过拖拽调整项目的排序位置。拖拽项目到目标位置即可重新排序。
          </div>

          {hasChanges.value && (
            <div class="bg-blue-50 border border-blue-200 rounded-lg p-3">
              <div class="text-sm text-blue-800">
                检测到排序变更，点击"保存排序"按钮确认修改。
              </div>
            </div>
          )}

          <div class="max-h-96 overflow-y-auto">
            <div class="space-y-2">
              {sortItems.value.map((item, index) => (
                <DraggableItem
                  key={item.id}
                  item={item}
                  index={index}
                  isDragging={draggedItemIndex.value === index}
                  onDragStart={handleDragStart}
                  onDragEnd={handleDragEnd}
                  onDragOver={handleDragOver}
                  onDrop={handleDrop}
                />
              ))}
            </div>
          </div>
        </div>
      </Modal>
    )
  }
})