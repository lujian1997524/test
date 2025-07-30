import { defineComponent, type PropType } from 'vue'
import { Transition } from 'vue'

interface Project {
  id: number
  name: string
  description?: string
  status: 'pending' | 'in_progress' | 'completed' | 'cancelled'
  priority: 'low' | 'medium' | 'high' | 'urgent'
  assignedWorker?: {
    id: number
    name: string
    department?: string
  }
}

interface TreeNode {
  id: string
  title: string
  type: 'group' | 'project'
  project?: Project
  children?: TreeNode[]
  isExpanded?: boolean
}

interface ProjectTreeNodeProps {
  node: TreeNode
  selectedProjectId?: number
  onProjectSelect: (project: Project) => void
  onToggleExpand: (nodeId: string) => void
  level?: number
}

export const ProjectTreeNode = defineComponent({
  name: 'ProjectTreeNode',
  props: {
    node: {
      type: Object as PropType<TreeNode>,
      required: true
    },
    selectedProjectId: Number,
    onProjectSelect: {
      type: Function as PropType<(project: Project) => void>,
      required: true
    },
    onToggleExpand: {
      type: Function as PropType<(nodeId: string) => void>,
      required: true
    },
    level: {
      type: Number,
      default: 0
    }
  },
  setup(props) {
    const isGroup = props.node.type === 'group'
    const hasChildren = props.node.children && props.node.children.length > 0
    const isSelected = props.node.project && props.selectedProjectId === props.node.project.id
    const isExpanded = props.node.isExpanded ?? true

    // 根据项目状态获取状态指示器配置
    const getStatusConfig = (status: Project['status']) => {
      switch (status) {
        case 'completed':
          return {
            bgColor: 'bg-status-success',
            icon: (
              <svg class="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 24 24">
                <path d="M9 16.17L5.53 12.7c-.39-.39-1.02-.39-1.41 0-.39.39-.39 1.02 0 1.41l4.18 4.18c.39.39 1.02.39 1.41 0L20.29 6.71c.39-.39.39-1.02 0-1.41-.39-.39-1.02-.39-1.41 0L9 16.17z"/>
              </svg>
            )
          }
        case 'in_progress':
          return {
            bgColor: 'bg-status-warning',
            icon: <div class="w-2 h-2 bg-white rounded-full"></div>
          }
        case 'pending':
          return {
            bgColor: 'border-2 border-gray-400 bg-transparent',
            icon: null
          }
        case 'cancelled':
          return {
            bgColor: 'bg-status-error',
            icon: (
              <svg class="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 24 24">
                <path d="M18.3 5.71c-.39-.39-1.02-.39-1.41 0L12 10.59 7.11 5.7c-.39-.39-1.02-.39-1.41 0-.39.39-.39 1.02 0 1.41L10.59 12 5.7 16.89c-.39.39-.39 1.02 0 1.41.39.39 1.02.39 1.41 0L12 13.41l4.89 4.88c.39.39 1.02.39 1.41 0 .39-.39.39-1.02 0-1.41L13.41 12l4.89-4.89c.38-.38.38-1.02 0-1.4z"/>
              </svg>
            )
          }
      }
    }

    // 根据优先级获取优先级标记颜色
    const getPriorityColor = (priority: Project['priority']) => {
      switch (priority) {
        case 'urgent':
          return 'bg-status-error'
        case 'high':
          return 'bg-status-warning'
        case 'medium':
          return 'bg-ios18-blue'
        case 'low':
          return 'bg-gray-400'
      }
    }

    const handleClick = () => {
      if (isGroup && hasChildren) {
        props.onToggleExpand(props.node.id)
      } else if (props.node.project) {
        props.onProjectSelect(props.node.project)
      }
    }

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault()
        handleClick()
      } else if (e.key === 'ArrowRight' && isGroup && !isExpanded) {
        props.onToggleExpand(props.node.id)
      } else if (e.key === 'ArrowLeft' && isGroup && isExpanded) {
        props.onToggleExpand(props.node.id)
      }
    }

    return () => (
      <div class="select-none">
        {/* 节点内容 */}
        <div
          class={`
            flex items-center px-3 py-2 rounded-ios-md cursor-pointer transition-all duration-200
            ${isSelected 
              ? 'bg-ios18-blue bg-opacity-20 border-l-4 border-ios18-blue' 
              : 'hover:bg-macos15-control'
            }
            ${props.level > 0 ? 'ml-4' : ''}
          `}
          onClick={handleClick}
          onKeydown={handleKeyDown}
          tabindex={0}
          role={isGroup ? 'button' : 'treeitem'}
          aria-expanded={isGroup ? isExpanded : undefined}
          style={{ 
            paddingLeft: `${8 + props.level * 16}px`,
            transform: 'scale(1)',
            transition: 'transform 0.1s'
          }}
          onMouseenter={(e) => {
            (e.target as HTMLElement).style.transform = 'scale(1.02)'
          }}
          onMouseleave={(e) => {
            (e.target as HTMLElement).style.transform = 'scale(1)'
          }}
        >
          {/* 展开/折叠图标 */}
          {isGroup && hasChildren && (
            <div
              class="mr-2 text-text-secondary"
              style={{
                transform: `rotate(${isExpanded ? 90 : 0}deg)`,
                transition: 'transform 0.2s'
              }}
            >
              <svg
                class="w-4 h-4"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 5l7 7-7 7"
                />
              </svg>
            </div>
          )}

          {/* 文件夹图标（分组）或项目状态指示器 */}
          {isGroup ? (
            <div class="mr-3 text-text-secondary">
              <svg
                class="w-5 h-5"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z"
                />
              </svg>
            </div>
          ) : props.node.project && (
            <div class="mr-3 flex items-center space-x-2">
              {/* 状态指示器 */}
              <div class={`
                w-4 h-4 rounded-full flex items-center justify-center
                ${getStatusConfig(props.node.project.status).bgColor}
              `}>
                {getStatusConfig(props.node.project.status).icon}
              </div>
              
              {/* 优先级标记 */}
              <div class={`
                w-2 h-2 rounded-full
                ${getPriorityColor(props.node.project.priority)}
              `} />
            </div>
          )}

          {/* 节点标题 */}
          <div class="flex-1 min-w-0">
            <div class={`
              text-sm font-medium truncate
              ${isGroup ? 'text-text-primary' : isSelected ? 'text-ios18-blue' : 'text-text-primary'}
            `}>
              {props.node.title}
            </div>
            
            {/* 项目额外信息 */}
            {props.node.project && (
              <div class="text-xs text-text-secondary mt-1 space-y-1">
                {props.node.project.description && (
                  <div class="truncate max-w-[200px]" title={props.node.project.description}>
                    {props.node.project.description}
                  </div>
                )}
                {props.node.project.assignedWorker && (
                  <div class="truncate">
                    负责人: {props.node.project.assignedWorker.name}
                    {props.node.project.assignedWorker.department && ` · ${props.node.project.assignedWorker.department}`}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* 项目计数（仅分组节点显示） */}
          {isGroup && hasChildren && (
            <div class="ml-2 px-2 py-1 text-xs bg-macos15-separator rounded-full text-text-secondary">
              {props.node.children!.length}
            </div>
          )}
        </div>

        {/* 子节点 */}
        <Transition
          enterActiveClass="transition-all duration-200"
          leaveActiveClass="transition-all duration-200"
          enterFromClass="h-0 opacity-0"
          enterToClass="h-auto opacity-100"
          leaveFromClass="h-auto opacity-100"
          leaveToClass="h-0 opacity-0"
        >
          {isGroup && hasChildren && isExpanded && (
            <div class="overflow-hidden">
              {props.node.children!.map((childNode) => (
                <ProjectTreeNode
                  key={childNode.id}
                  node={childNode}
                  selectedProjectId={props.selectedProjectId}
                  onProjectSelect={props.onProjectSelect}
                  onToggleExpand={props.onToggleExpand}
                  level={props.level + 1}
                />
              ))}
            </div>
          )}
        </Transition>
      </div>
    )
  }
})