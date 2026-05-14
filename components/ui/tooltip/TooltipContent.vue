<script setup lang="ts">
import type { HTMLAttributes } from 'vue'
import { TooltipContent, TooltipPortal } from 'reka-ui'
import { cn } from '@/lib/utils'

const props = withDefaults(defineProps<{
  class?: HTMLAttributes['class']
  sideOffset?: number
}>(), {
  sideOffset: 4,
})
</script>

<template>
  <TooltipPortal>
    <TooltipContent
      :side-offset="props.sideOffset"
      :class="cn('z-50 max-w-[260px] overflow-hidden rounded-md bg-primary px-3 py-1.5 text-xs text-primary-foreground shadow-md', props.class)"
    >
      <slot />
    </TooltipContent>
  </TooltipPortal>
</template>
