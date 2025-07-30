import { defineComponent, type PropType } from 'vue'
import { Transition, TransitionGroup } from 'vue'
import { DrawingCard } from './DrawingCard'
import type { Drawing } from './DrawingLibrary'

interface DrawingGridProps {
  drawings: Drawing[]
  selectedDrawings?: number[]
  onSelectionChange?: (selectedIds: number[]) => void
  onDelete: (drawing: Drawing) => void
  onEdit: (drawing: Drawing) => void
  onPreview: (drawing: Drawing) => void
  onOpen?: (drawing: Drawing) => void
  className?: string
}

export const DrawingGrid = defineComponent({
  name: 'DrawingGrid',
  props: {
    drawings: {
      type: Array as PropType<Drawing[]>,
      required: true
    },
    selectedDrawings: {
      type: Array as PropType<number[]>,
      default: () => []
    },
    onSelectionChange: {
      type: Function as PropType<(selectedIds: number[]) => void>,
      default: undefined
    },
    onDelete: {
      type: Function as PropType<(drawing: Drawing) => void>,
      required: true
    },
    onEdit: {
      type: Function as PropType<(drawing: Drawing) => void>,
      required: true
    },
    onPreview: {
      type: Function as PropType<(drawing: Drawing) => void>,
      required: true
    },
    onOpen: {
      type: Function as PropType<(drawing: Drawing) => void>,
      default: undefined
    },
    className: {
      type: String,
      default: ''
    }
  },
  setup(props) {
    // 处理单个图纸选择
    const handleDrawingSelect = (drawingId: number, selected: boolean) => {
      if (!props.onSelectionChange) return
      
      if (selected) {
        props.onSelectionChange([...props.selectedDrawings, drawingId])
      } else {
        props.onSelectionChange(props.selectedDrawings.filter(id => id !== drawingId))
      }
    }

    return () => (
      <div class={`overflow-auto h-full ${props.className}`}>
        <div class="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6 gap-4 p-4">
          <TransitionGroup
            enterActiveClass="transition-all duration-300 ease-out"
            leaveActiveClass="transition-all duration-200 ease-in"
            enterFromClass="opacity-0 scale-95 translate-y-4"
            enterToClass="opacity-100 scale-100 translate-y-0"
            leaveFromClass="opacity-100 scale-100"
            leaveToClass="opacity-0 scale-90"
            moveClass="transition-transform duration-300"
          >
            {props.drawings.map((drawing) => (
              <div
                key={drawing.id}
                class="transition-all duration-300"
              >
                <DrawingCard
                  drawing={drawing}
                  selected={props.selectedDrawings.includes(drawing.id)}
                  onSelect={props.onSelectionChange ? (selected) => handleDrawingSelect(drawing.id, selected) : undefined}
                  onDelete={() => props.onDelete(drawing)}
                  onEdit={() => props.onEdit(drawing)}
                  onPreview={() => props.onPreview(drawing)}
                  onOpen={props.onOpen ? () => props.onOpen!(drawing) : undefined}
                  class="h-full"
                />
              </div>
            ))}
          </TransitionGroup>
        </div>
      </div>
    )
  }
})

export default DrawingGrid