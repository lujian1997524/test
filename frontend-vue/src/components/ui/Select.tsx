import { defineComponent, ref, computed, onMounted, onUnmounted, nextTick, watch, type PropType } from 'vue'
import { Transition } from 'vue'
import { ChevronDownIcon, CheckIcon, XMarkIcon } from '@heroicons/vue/24/outline'

// Select 选项接口
export interface SelectOption {
  value: string | number
  label: string
  description?: string
  icon?: any
  disabled?: boolean
  group?: string
}

// Select 组件接口
export interface SelectProps {
  // 基础属性
  value?: string | number | (string | number)[]
  defaultValue?: string | number | (string | number)[]
  onChange?: (value: string | number | (string | number)[]) => void
  onSearch?: (searchTerm: string) => void
  
  // 选项数据
  options: SelectOption[]
  
  // 样式和行为
  placeholder?: string
  disabled?: boolean
  loading?: boolean
  clearable?: boolean
  searchable?: boolean
  multiple?: boolean
  
  // 显示配置
  size?: 'sm' | 'md' | 'lg'
  variant?: 'default' | 'filled' | 'glass'
  width?: string | number
  
  // 下拉配置
  maxHeight?: number
  placement?: 'bottom' | 'top' | 'auto'
  
  // 自定义渲染
  renderOption?: (option: SelectOption) => any
  renderValue?: (option: SelectOption | SelectOption[]) => any
  
  // 错误和提示
  error?: string
  hint?: string
  
  // HTML 属性
  className?: string
  name?: string
  required?: boolean
}

// MultiSelect 标签组件
const SelectTag = defineComponent({
  name: 'SelectTag',
  props: {
    option: {
      type: Object as PropType<SelectOption>,
      required: true
    },
    onRemove: {
      type: Function as PropType<() => void>,
      required: true
    },
    size: {
      type: String as PropType<'sm' | 'md' | 'lg'>,
      required: true
    }
  },
  setup(props) {
    const sizeClasses = {
      sm: 'text-xs px-2 py-1',
      md: 'text-sm px-2 py-1',
      lg: 'text-base px-3 py-1'
    }

    return () => (
      <span
        class={`
          inline-flex items-center gap-1 bg-ios18-blue/10 text-ios18-blue rounded-md
          ${sizeClasses[props.size]}
        `}
        style={{
          opacity: 0,
          transform: 'scale(0.8)',
          animation: 'tagEnter 0.2s ease-out forwards'
        }}
      >
        {props.option.icon && <span class="w-4 h-4">{props.option.icon}</span>}
        <span>{props.option.label}</span>
        <button
          type="button"
          onClick={props.onRemove}
          class="w-4 h-4 rounded-sm hover:bg-ios18-blue/20 flex items-center justify-center"
        >
          <XMarkIcon class="w-3 h-3" />
        </button>
      </span>
    )
  }
})

// Select 组件
export const Select = defineComponent({
  name: 'Select',
  props: {
    value: [String, Number, Array],
    defaultValue: [String, Number, Array],
    onChange: Function as PropType<SelectProps['onChange']>,
    onSearch: Function as PropType<SelectProps['onSearch']>,
    options: {
      type: Array as PropType<SelectOption[]>,
      default: () => []
    },
    placeholder: {
      type: String,
      default: '请选择...'
    },
    disabled: {
      type: Boolean,
      default: false
    },
    loading: {
      type: Boolean,
      default: false
    },
    clearable: {
      type: Boolean,
      default: false
    },
    searchable: {
      type: Boolean,
      default: false
    },
    multiple: {
      type: Boolean,
      default: false
    },
    size: {
      type: String as PropType<SelectProps['size']>,
      default: 'md'
    },
    variant: {
      type: String as PropType<SelectProps['variant']>,
      default: 'default'
    },
    width: [String, Number],
    maxHeight: {
      type: Number,
      default: 200
    },
    placement: {
      type: String as PropType<SelectProps['placement']>,
      default: 'auto'
    },
    renderOption: Function as PropType<SelectProps['renderOption']>,
    renderValue: Function as PropType<SelectProps['renderValue']>,
    error: String,
    hint: String,
    className: {
      type: String,
      default: ''
    },
    name: String,
    required: {
      type: Boolean,
      default: false
    }
  },
  setup(props, { emit }) {
    const isOpen = ref(false)
    const searchTerm = ref('')
    const internalValue = ref(props.value || props.defaultValue || (props.multiple ? [] : ''))
    const selectRef = ref<HTMLDivElement>()
    const dropdownRef = ref<HTMLDivElement>()
    const searchInputRef = ref<HTMLInputElement>()

    // 同步外部 value
    watch(() => props.value, (newValue) => {
      if (newValue !== undefined) {
        internalValue.value = newValue
      }
    })

    // 点击外部关闭下拉框
    const handleClickOutside = (event: MouseEvent) => {
      if (selectRef.value && !selectRef.value.contains(event.target as Node)) {
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

    // 自动聚焦搜索框
    watch([isOpen, () => props.searchable], () => {
      if (isOpen.value && props.searchable && searchInputRef.value) {
        nextTick(() => {
          searchInputRef.value?.focus()
        })
      }
    })

    // 过滤选项
    const filteredOptions = computed(() => {
      return props.options.filter(option => {
        if (!searchTerm.value) return true
        return option.label.toLowerCase().includes(searchTerm.value.toLowerCase()) ||
               option.description?.toLowerCase().includes(searchTerm.value.toLowerCase())
      })
    })

    // 分组选项
    const groupedOptions = computed(() => {
      return filteredOptions.value.reduce((groups, option) => {
        const group = option.group || 'default'
        if (!groups[group]) groups[group] = []
        groups[group].push(option)
        return groups
      }, {} as Record<string, SelectOption[]>)
    })

    // 获取选中的选项
    const getSelectedOptions = (): SelectOption[] => {
      if (props.multiple) {
        const values = Array.isArray(internalValue.value) ? internalValue.value : []
        return props.options.filter(option => values.includes(option.value))
      }
      return props.options.filter(option => option.value === internalValue.value)
    }

    // 处理选项选择
    const handleOptionSelect = (option: SelectOption) => {
      if (option.disabled) return

      let newValue: string | number | (string | number)[]

      if (props.multiple) {
        const currentValues = Array.isArray(internalValue.value) ? internalValue.value : []
        if (currentValues.includes(option.value)) {
          newValue = currentValues.filter(v => v !== option.value)
        } else {
          newValue = [...currentValues, option.value]
        }
      } else {
        newValue = option.value
        isOpen.value = false
        searchTerm.value = ''
      }

      internalValue.value = newValue
      props.onChange?.(newValue)
      emit('change', newValue)
    }

    // 处理清空
    const handleClear = (e: MouseEvent) => {
      e.stopPropagation()
      const newValue = props.multiple ? [] : ''
      internalValue.value = newValue
      props.onChange?.(newValue)
      emit('change', newValue)
    }

    // 处理搜索
    const handleSearch = (term: string) => {
      searchTerm.value = term
      props.onSearch?.(term)
      emit('search', term)
    }

    // 样式类
    const sizeClasses = {
      sm: 'text-sm px-3 py-2 min-h-[32px]',
      md: 'text-base px-4 py-3 min-h-[40px]',
      lg: 'text-lg px-5 py-4 min-h-[48px]'
    }

    const variantClasses = {
      default: `
        bg-white border-macos15-separator
        focus-within:border-ios18-blue focus-within:bg-white
        hover:border-ios18-blue hover:border-opacity-50
      `,
      filled: `
        bg-macos15-control border-transparent
        focus-within:border-ios18-blue focus-within:bg-white
        hover:bg-opacity-80
      `,
      glass: `
        bg-bg-glass backdrop-blur-glass border-white border-opacity-20
        focus-within:border-ios18-blue focus-within:bg-white focus-within:bg-opacity-90
        hover:bg-white hover:bg-opacity-30
      `
    }

    const selectedOptions = computed(() => getSelectedOptions())
    const hasValue = computed(() => 
      props.multiple ? selectedOptions.value.length > 0 : selectedOptions.value.length > 0
    )

    const containerStyle = computed(() => 
      props.width ? { width: typeof props.width === 'number' ? `${props.width}px` : props.width } : undefined
    )

    return () => (
      <div class="relative w-full" style={containerStyle.value}>
        <div
          ref={selectRef}
          class={`
            relative w-full rounded-ios-lg border transition-all duration-200 cursor-pointer
            ${sizeClasses[props.size!]}
            ${variantClasses[props.variant!]}
            ${props.error ? 'border-status-error focus-within:ring-status-error' : ''}
            ${props.disabled ? 'opacity-50 cursor-not-allowed' : ''}
            ${props.className}
          `}
          onClick={() => !props.disabled && (isOpen.value = !isOpen.value)}
        >
          {/* 隐藏的原生 input 用于表单提交 */}
          {props.name && (
            <input
              type="hidden"
              name={props.name}
              value={props.multiple ? JSON.stringify(internalValue.value) : String(internalValue.value)}
              required={props.required}
            />
          )}

          {/* 显示区域 */}
          <div class="flex items-center justify-between gap-2">
            <div class="flex-1 flex items-center gap-2 overflow-hidden">
              {hasValue.value ? (
                props.multiple ? (
                  <div class="flex flex-wrap gap-1 max-w-full">
                    {selectedOptions.value.map(option => (
                      <SelectTag
                        key={option.value}
                        option={option}
                        size={props.size!}
                        onRemove={() => handleOptionSelect(option)}
                      />
                    ))}
                  </div>
                ) : (
                  props.renderValue ? props.renderValue(selectedOptions.value[0]) : (
                    <div class="flex items-center gap-2">
                      {selectedOptions.value[0].icon && (
                        <span class="w-4 h-4 flex-shrink-0">
                          {selectedOptions.value[0].icon}
                        </span>
                      )}
                      <span class="truncate">{selectedOptions.value[0].label}</span>
                    </div>
                  )
                )
              ) : (
                <span class="text-text-tertiary truncate">{props.placeholder}</span>
              )}
            </div>

            {/* 操作按钮 */}
            <div class="flex items-center gap-1">
              {props.clearable && hasValue.value && !props.disabled && (
                <button
                  type="button"
                  onClick={handleClear}
                  class="w-5 h-5 rounded-sm hover:bg-gray-200 flex items-center justify-center"
                >
                  <XMarkIcon class="w-4 h-4 text-text-secondary" />
                </button>
              )}
              
              {props.loading ? (
                <div class="w-5 h-5 animate-spin rounded-full border-2 border-gray-300 border-t-ios18-blue" />
              ) : (
                <ChevronDownIcon 
                  class={`w-5 h-5 text-text-secondary transition-transform ${isOpen.value ? 'rotate-180' : ''}`} 
                />
              )}
            </div>
          </div>

          {/* 下拉选项 */}
          <Transition
            enterActiveClass="transition-all duration-200"
            leaveActiveClass="transition-all duration-200"
            enterFromClass={`opacity-0 ${props.placement === 'top' ? 'translate-y-2' : '-translate-y-2'}`}
            enterToClass="opacity-100 translate-y-0"
            leaveFromClass="opacity-100 translate-y-0"
            leaveToClass={`opacity-0 ${props.placement === 'top' ? 'translate-y-2' : '-translate-y-2'}`}
          >
            {isOpen.value && (
              <div
                ref={dropdownRef}
                class={`
                  absolute left-0 right-0 mt-1 bg-white border border-gray-200 rounded-ios-lg shadow-ios-lg z-50
                  ${props.placement === 'top' ? 'bottom-full mb-1 mt-0' : ''}
                `}
                style={{ maxHeight: `${props.maxHeight}px` }}
              >
                {/* 搜索框 */}
                {props.searchable && (
                  <div class="p-2 border-b border-gray-200">
                    <input
                      ref={searchInputRef}
                      type="text"
                      placeholder="搜索选项..."
                      value={searchTerm.value}
                      onInput={(e) => handleSearch((e.target as HTMLInputElement).value)}
                      class="w-full px-3 py-2 text-sm border border-gray-200 rounded-md focus:outline-none focus:ring-2 focus:ring-ios18-blue focus:ring-opacity-50"
                    />
                  </div>
                )}

                {/* 选项列表 */}
                <div class="max-h-40 overflow-y-auto">
                  {Object.keys(groupedOptions.value).length === 0 ? (
                    <div class="px-3 py-2 text-sm text-text-secondary text-center">
                      {searchTerm.value ? '无匹配结果' : '暂无选项'}
                    </div>
                  ) : (
                    Object.entries(groupedOptions.value).map(([groupName, groupOptions]) => (
                      <div key={groupName}>
                        {groupName !== 'default' && (
                          <div class="px-3 py-2 text-xs font-medium text-text-secondary bg-gray-50">
                            {groupName}
                          </div>
                        )}
                        {groupOptions.map(option => {
                          const isSelected = props.multiple 
                            ? Array.isArray(internalValue.value) && internalValue.value.includes(option.value)
                            : internalValue.value === option.value

                          return (
                            <div
                              key={option.value}
                              class={`
                                px-3 py-2 cursor-pointer transition-colors flex items-center justify-between
                                ${option.disabled ? 'opacity-50 cursor-not-allowed' : 'hover:bg-gray-50'}
                                ${isSelected ? 'bg-ios18-blue/10 text-ios18-blue' : ''}
                              `}
                              onClick={() => handleOptionSelect(option)}
                            >
                              <div class="flex items-center gap-2 flex-1">
                                {option.icon && (
                                  <span class="w-4 h-4 flex-shrink-0">
                                    {option.icon}
                                  </span>
                                )}
                                <div class="flex-1">
                                  {props.renderOption ? props.renderOption(option) : (
                                    <>
                                      <div class="text-sm">{option.label}</div>
                                      {option.description && (
                                        <div class="text-xs text-text-secondary">
                                          {option.description}
                                        </div>
                                      )}
                                    </>
                                  )}
                                </div>
                              </div>
                              
                              {isSelected && (
                                <CheckIcon class="w-4 h-4 text-ios18-blue flex-shrink-0" />
                              )}
                            </div>
                          )
                        })}
                      </div>
                    ))
                  )}
                </div>
              </div>
            )}
          </Transition>
        </div>

        {/* 错误信息 */}
        {props.error && (
          <p 
            class="mt-2 text-sm text-status-error"
            style={{
              opacity: 0,
              transform: 'translateY(-5px)',
              animation: 'errorEnter 0.2s ease-out forwards'
            }}
          >
            {props.error}
          </p>
        )}
        
        {/* 提示信息 */}
        {props.hint && !props.error && (
          <p 
            class="mt-2 text-sm text-text-secondary"
            style={{
              opacity: 0,
              animation: 'hintEnter 0.2s ease-out 0.1s forwards'
            }}
          >
            {props.hint}
          </p>
        )}
      </div>
    )
  }
})