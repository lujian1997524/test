import { defineComponent, ref, computed, onMounted, onUnmounted, watch, nextTick, type PropType } from 'vue'
import { Transition } from 'vue'

export interface DropdownOption {
  label: string
  value: string | number
  disabled?: boolean
  icon?: any
  description?: string
}

export interface DropdownProps {
  options: DropdownOption[]
  value?: string | number
  placeholder?: string
  disabled?: boolean
  searchable?: boolean
  clearable?: boolean
  multiple?: boolean
  size?: 'sm' | 'md' | 'lg'
  className?: string
  onChange?: (value: string | number | (string | number)[]) => void
  onSearch?: (searchTerm: string) => void
}

export const Dropdown = defineComponent({
  name: 'Dropdown',
  props: {
    options: {
      type: Array as PropType<DropdownOption[]>,
      default: () => []
    },
    value: [String, Number],
    placeholder: {
      type: String,
      default: '请选择...'
    },
    disabled: {
      type: Boolean,
      default: false
    },
    searchable: {
      type: Boolean,
      default: false
    },
    clearable: {
      type: Boolean,
      default: false
    },
    multiple: {
      type: Boolean,
      default: false
    },
    size: {
      type: String as PropType<'sm' | 'md' | 'lg'>,
      default: 'md'
    },
    className: {
      type: String,
      default: ''
    },
    onChange: Function as PropType<DropdownProps['onChange']>,
    onSearch: Function as PropType<DropdownProps['onSearch']>
  },
  setup(props, { emit }) {
    const isOpen = ref(false)
    const searchTerm = ref('')
    const selectedValues = ref<(string | number)[]>(
      props.multiple 
        ? (Array.isArray(props.value) ? props.value : (props.value !== undefined ? [props.value] : []))
        : (props.value !== undefined ? [props.value] : [])
    )
    const dropdownRef = ref<HTMLDivElement>()

    const sizeClasses = {
      sm: 'px-3 py-2 text-sm',
      md: 'px-4 py-3 text-base',
      lg: 'px-5 py-4 text-lg'
    }

    // 同步外部 value
    watch(() => props.value, (newValue) => {
      selectedValues.value = props.multiple 
        ? (Array.isArray(newValue) ? newValue : (newValue !== undefined ? [newValue] : []))
        : (newValue !== undefined ? [newValue] : [])
    })

    // 过滤选项
    const filteredOptions = computed(() => {
      return props.searchable && searchTerm.value
        ? props.options.filter(option => 
            option.label.toLowerCase().includes(searchTerm.value.toLowerCase())
          )
        : props.options
    })

    // 获取显示文本
    const getDisplayText = () => {
      if ((selectedValues.value || []).length === 0) return props.placeholder
      
      if (props.multiple) {
        if ((selectedValues.value || []).length === 1) {
          const option = props.options.find(opt => opt.value === (selectedValues.value || [])[0])
          return option?.label || ''
        }
        return `已选择 ${(selectedValues.value || []).length} 项`
      }
      
      const option = props.options.find(opt => opt.value === (selectedValues.value || [])[0])
      return option?.label || ''
    }

    // 处理选择
    const handleSelect = (optionValue: string | number) => {
      let newValues: (string | number)[]
      
      if (props.multiple) {
        if (selectedValues.value.includes(optionValue)) {
          newValues = selectedValues.value.filter(v => v !== optionValue)
        } else {
          newValues = [...selectedValues.value, optionValue]
        }
        selectedValues.value = newValues
        props.onChange?.(newValues)
        emit('change', newValues)
      } else {
        newValues = [optionValue]
        selectedValues.value = newValues
        props.onChange?.(optionValue)
        emit('change', optionValue)
        isOpen.value = false
      }
    }

    // 清空选择
    const handleClear = (e: MouseEvent) => {
      e.stopPropagation()
      selectedValues.value = []
      const emptyValue = props.multiple ? [] : ''
      props.onChange?.(emptyValue)
      emit('change', emptyValue)
    }

    // 点击外部关闭
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.value && !dropdownRef.value.contains(event.target as Node)) {
        isOpen.value = false
        searchTerm.value = ''
      }
    }

    onMounted(() => {
      document.addEventListener('mousedown', handleClickOutside)
    })

    onUnmounted(() => {
      document.removeEventListener('mousedown', handleClickOutside)
    })

    // 搜索处理
    const handleSearchChange = (e: Event) => {
      const term = (e.target as HTMLInputElement).value
      searchTerm.value = term
      props.onSearch?.(term)
      emit('search', term)
    }

    return () => (
      <div ref={dropdownRef} class={`relative ${props.className}`}>
        {/* 触发器 */}
        <div
          class={`
            ${sizeClasses[props.size]}
            w-full bg-white border border-gray-200 rounded-ios-lg
            flex items-center justify-between cursor-pointer
            transition-all duration-200
            ${isOpen.value ? 'border-ios18-blue shadow-ios-sm' : 'hover:border-gray-300'}
            ${props.disabled ? 'opacity-50 cursor-not-allowed bg-gray-50' : ''}
          `}
          onClick={() => !props.disabled && (isOpen.value = !isOpen.value)}
          style={{
            transform: 'scale(1)',
            transition: 'transform 0.1s'
          }}
        >
          <span class={`truncate ${selectedValues.value.length === 0 ? 'text-gray-500' : 'text-gray-900'}`}>
            {getDisplayText()}
          </span>
          
          <div class="flex items-center space-x-2">
            {props.clearable && selectedValues.value.length > 0 && (
              <button
                onClick={handleClear}
                class="p-1 hover:bg-gray-100 rounded text-gray-400 hover:text-gray-600"
                style={{
                  transform: 'scale(1)',
                  transition: 'transform 0.1s'
                }}
              >
                <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            )}
            
            <div
              style={{
                transform: `rotate(${isOpen.value ? 180 : 0}deg)`,
                transition: 'transform 0.2s'
              }}
            >
              <svg class="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </div>
          </div>
        </div>

        {/* 下拉菜单 */}
        <Transition
          enterActiveClass="transition-all duration-200"
          leaveActiveClass="transition-all duration-200"
          enterFromClass="opacity-0 -translate-y-2 scale-95"
          enterToClass="opacity-100 translate-y-0 scale-100"
          leaveFromClass="opacity-100 translate-y-0 scale-100"
          leaveToClass="opacity-0 -translate-y-2 scale-95"
        >
          {isOpen.value && (
            <div class="absolute z-50 w-full mt-2 bg-white/95 backdrop-blur-xl border border-gray-200 rounded-ios-lg shadow-ios-lg max-h-60 overflow-hidden">
              {/* 搜索框 */}
              {props.searchable && (
                <div class="p-3 border-b border-gray-200">
                  <input
                    type="text"
                    placeholder="搜索选项..."
                    value={searchTerm.value}
                    onInput={handleSearchChange}
                    class="w-full px-3 py-2 border border-gray-200 rounded-ios-md text-sm focus:outline-none focus:ring-2 focus:ring-ios18-blue focus:border-transparent"
                    onClick={(e) => e.stopPropagation()}
                  />
                </div>
              )}
              
              {/* 选项列表 */}
              <div class="py-2 max-h-48 overflow-y-auto">
                {filteredOptions.value.length === 0 ? (
                  <div class="px-4 py-3 text-gray-500 text-center text-sm">
                    {searchTerm.value ? '未找到匹配选项' : '暂无选项'}
                  </div>
                ) : (
                  filteredOptions.value.map((option) => {
                    const isSelected = selectedValues.value.includes(option.value)
                    
                    return (
                      <div
                        key={option.value}
                        class={`
                          px-4 py-3 cursor-pointer flex items-center space-x-3
                          transition-colors duration-150
                          ${isSelected 
                            ? 'bg-ios18-blue/10 text-ios18-blue' 
                            : 'text-gray-700 hover:bg-gray-50'
                          }
                          ${option.disabled ? 'opacity-50 cursor-not-allowed' : ''}
                        `}
                        onClick={() => !option.disabled && handleSelect(option.value)}
                      >
                        {props.multiple && (
                          <div class={`
                            w-4 h-4 border-2 rounded flex items-center justify-center
                            ${isSelected 
                              ? 'bg-ios18-blue border-ios18-blue' 
                              : 'border-gray-300'
                            }
                          `}>
                            {isSelected && (
                              <svg class="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                              </svg>
                            )}
                          </div>
                        )}
                        
                        {option.icon && (
                          <span class="flex-shrink-0">
                            {option.icon}
                          </span>
                        )}
                        
                        <div class="flex-1 min-w-0">
                          <div class="font-medium truncate">
                            {option.label}
                          </div>
                          {option.description && (
                            <div class="text-xs text-gray-500 truncate">
                              {option.description}
                            </div>
                          )}
                        </div>
                        
                        {!props.multiple && isSelected && (
                          <svg class="w-4 h-4 text-ios18-blue" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                          </svg>
                        )}
                      </div>
                    )
                  })
                )}
              </div>
            </div>
          )}
        </Transition>
      </div>
    )
  }
})