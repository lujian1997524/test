import { defineComponent, ref, onMounted, onUnmounted, type PropType } from 'vue'
import { Transition } from 'vue'

// Table 根组件接口
export interface TableProps {
  children?: any
  className?: string
  // 拖拽排序支持
  sortable?: boolean
  onDragEnd?: (event: any) => void
  sortableItems?: (string | number)[]
  // 空状态支持
  emptyState?: {
    icon?: any
    title?: string
    description?: string
  }
  // 加载状态
  loading?: boolean
  loadingText?: string
}

// TableHeader 接口
export interface TableHeaderProps {
  children?: any
  className?: string
  sticky?: boolean
}

// TableBody 接口
export interface TableBodyProps {
  children?: any
  className?: string
  sortable?: boolean
  sortableItems?: (string | number)[]
}

// TableRow 接口
export interface TableRowProps {
  children?: any
  className?: string
  hover?: boolean
  // 动画支持
  animate?: boolean
  index?: number
  // 拖拽支持
  sortable?: boolean
  sortableId?: string | number
}

// TableCell 接口
export interface TableCellProps {
  children?: any
  className?: string
  align?: 'left' | 'center' | 'right'
  // 特殊单元格类型
  type?: 'header' | 'data'
  // 固定列支持
  sticky?: 'left' | 'right'
  width?: string | number
}

// Table 根组件
export const Table = defineComponent({
  name: 'Table',
  props: {
    className: {
      type: String,
      default: ''
    },
    sortable: {
      type: Boolean,
      default: false
    },
    onDragEnd: Function,
    sortableItems: {
      type: Array as PropType<(string | number)[]>,
      default: () => []
    },
    emptyState: Object as PropType<TableProps['emptyState']>,
    loading: {
      type: Boolean,
      default: false
    },
    loadingText: {
      type: String,
      default: '加载中...'
    }
  },
  setup(props, { slots }) {
    const tableRef = ref<HTMLTableElement>()

    const tableContent = () => (
      <table
        ref={tableRef}
        class={`w-full ${props.className}`}
        style={{
          opacity: 0,
          animation: 'tableEnter 0.3s ease-out forwards'
        }}
      >
        {slots.default?.()}
      </table>
    )

    return () => (
      <div class="relative">
        {tableContent()}
        
        {/* 加载状态覆盖层 */}
        <Transition
          enterActiveClass="transition-opacity duration-200"
          leaveActiveClass="transition-opacity duration-200"
          enterFromClass="opacity-0"
          enterToClass="opacity-100"
          leaveFromClass="opacity-100"
          leaveToClass="opacity-0"
        >
          {props.loading && (
            <div class="absolute inset-0 bg-white/70 backdrop-blur-sm flex items-center justify-center rounded-2xl">
              <div class="flex items-center space-x-3">
                <div class="animate-spin rounded-full h-6 w-6 border-b-2 border-ios18-blue"></div>
                <span class="text-text-secondary text-sm">{props.loadingText}</span>
              </div>
            </div>
          )}
        </Transition>
      </div>
    )
  }
})

// TableHeader 组件
export const TableHeader = defineComponent({
  name: 'TableHeader',
  props: {
    className: {
      type: String,
      default: ''
    },
    sticky: {
      type: Boolean,
      default: true
    }
  },
  setup(props, { slots }) {
    return () => (
      <thead
        class={`
          ${props.sticky ? 'sticky top-0 z-10' : ''}
          bg-gray-50/80 backdrop-blur-sm
          ${props.className}
        `}
      >
        {slots.default?.()}
      </thead>
    )
  }
})

// TableBody 组件
export const TableBody = defineComponent({
  name: 'TableBody',
  props: {
    className: {
      type: String,
      default: ''
    },
    sortable: {
      type: Boolean,
      default: false
    },
    sortableItems: {
      type: Array as PropType<(string | number)[]>,
      default: () => []
    }
  },
  setup(props, { slots }) {
    return () => (
      <tbody
        class={`divide-y divide-gray-200 ${props.className}`}
      >
        {slots.default?.()}
      </tbody>
    )
  }
})

// TableRow 组件
export const TableRow = defineComponent({
  name: 'TableRow',
  props: {
    className: {
      type: String,
      default: ''
    },
    hover: {
      type: Boolean,
      default: true
    },
    animate: {
      type: Boolean,
      default: true
    },
    index: {
      type: Number,
      default: 0
    },
    sortable: {
      type: Boolean,
      default: false
    },
    sortableId: [String, Number]
  },
  setup(props, { slots }) {
    const baseClasses = `
      ${props.hover ? 'hover:bg-gray-50/50 transition-colors' : ''}
      ${props.className}
    `

    return () => {
      if (props.animate) {
        return (
          <tr
            class={baseClasses}
            style={{
              opacity: 0,
              transform: 'translateY(20px)',
              animation: `rowEnter 0.3s ease-out ${props.index * 0.05}s forwards`
            }}
          >
            {slots.default?.()}
          </tr>
        )
      }

      return (
        <tr class={baseClasses}>
          {slots.default?.()}
        </tr>
      )
    }
  }
})

// TableCell 组件
export const TableCell = defineComponent({
  name: 'TableCell',
  props: {
    className: {
      type: String,
      default: ''
    },
    align: {
      type: String as PropType<'left' | 'center' | 'right'>,
      default: 'left'
    },
    type: {
      type: String as PropType<'header' | 'data'>,
      default: 'data'
    },
    sticky: String as PropType<'left' | 'right'>,
    width: [String, Number]
  },
  setup(props, { slots }) {
    const alignClasses = {
      left: 'text-left',
      center: 'text-center',
      right: 'text-right'
    }

    const stickyClasses = props.sticky ? {
      left: 'sticky left-0 bg-white z-20',
      right: 'sticky right-0 bg-white z-20'
    }[props.sticky] : ''

    const baseClasses = props.type === 'header' 
      ? `px-4 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider ${alignClasses[props.align]}`
      : `px-4 py-4 text-sm ${alignClasses[props.align]}`

    const style = props.width ? { width: typeof props.width === 'number' ? `${props.width}px` : props.width } : undefined

    return () => {
      if (props.type === 'header') {
        return (
          <th
            class={`${baseClasses} ${stickyClasses} ${props.className}`}
            style={style}
          >
            {slots.default?.()}
          </th>
        )
      }

      return (
        <td
          class={`${baseClasses} ${stickyClasses} ${props.className}`}
          style={style}
        >
          {slots.default?.()}
        </td>
      )
    }
  }
})

// TableContainer 组件 - 提供表格外层容器样式
export interface TableContainerProps {
  children?: any
  className?: string
  title?: string
  description?: string
  actions?: any
  emptyState?: {
    icon?: any
    title?: string
    description?: string
  }
  showEmptyState?: boolean
}

export const TableContainer = defineComponent({
  name: 'TableContainer',
  props: {
    className: {
      type: String,
      default: ''
    },
    title: String,
    description: String,
    actions: Object,
    emptyState: Object as PropType<TableContainerProps['emptyState']>,
    showEmptyState: {
      type: Boolean,
      default: false
    }
  },
  setup(props, { slots }) {
    return () => (
      <div 
        class={`bg-white/80 backdrop-blur-xl rounded-2xl border border-gray-200 shadow-lg overflow-hidden flex flex-col ${props.className}`}
      >
        {/* 标题栏 */}
        {(props.title || props.description || props.actions) && (
          <div class="p-6 border-b border-gray-200">
            <div class="flex items-center justify-between">
              <div>
                {props.title && (
                  <h3 class="text-xl font-semibold text-text-primary">
                    {props.title}
                  </h3>
                )}
                {props.description && (
                  <p class="text-text-secondary text-sm mt-1">
                    {props.description}
                  </p>
                )}
              </div>
              {props.actions && (
                <div class="flex items-center space-x-2">
                  {props.actions}
                </div>
              )}
            </div>
          </div>
        )}

        {/* 表格内容区域 */}
        <div class="flex-1 overflow-auto">
          {props.showEmptyState && props.emptyState ? (
            <div class="flex items-center justify-center h-64">
              <div class="text-center">
                {props.emptyState.icon || (
                  <svg class="w-16 h-16 text-gray-300 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                  </svg>
                )}
                <p class="text-gray-500 text-lg">
                  {props.emptyState.title || '暂无数据'}
                </p>
                {props.emptyState.description && (
                  <p class="text-gray-400 text-sm mt-2">
                    {props.emptyState.description}
                  </p>
                )}
              </div>
            </div>
          ) : (
            slots.default?.()
          )}
        </div>
      </div>
    )
  }
})