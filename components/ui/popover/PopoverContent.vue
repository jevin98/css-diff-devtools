<script setup lang="ts">
import type { HTMLAttributes } from 'vue'
import { PopoverContent, PopoverPortal } from 'reka-ui'
import { cn } from '@/lib/utils'

const props = withDefaults(defineProps<{
  align?: 'center' | 'end' | 'start'
  class?: HTMLAttributes['class']
  side?: 'bottom' | 'left' | 'right' | 'top'
  sideOffset?: number
}>(), {
  align: 'center',
  side: 'bottom',
  sideOffset: 4,
})
</script>

<template>
  <PopoverPortal>
    <PopoverContent
      :align="props.align"
      :side="props.side"
      :side-offset="props.sideOffset"
      :class="cn('z-50 w-64 rounded-md border bg-popover p-3 text-xs leading-5 text-popover-foreground shadow-md outline-none', props.class)"
    >
      <slot />
    </PopoverContent>
  </PopoverPortal>
</template>
