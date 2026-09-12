<script setup lang="ts">
import type { HTMLAttributes } from "vue"
import { reactiveOmit } from "@vueuse/core"
import { TabsTrigger } from "reka-ui"
import { cn } from "@/lib/utils"

const props = defineProps<{
  value: string | number
  disabled?: boolean
  asChild?: boolean
  as?: any
  class?: HTMLAttributes["class"]
}>()

const delegatedProps = reactiveOmit(props, "class")
</script>

<template>
  <TabsTrigger
    data-slot="tabs-trigger"
    v-bind="delegatedProps"
    :class="cn('data-[state=active]:bg-background data-[state=active]:text-foreground focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:outline-ring inline-flex items-center justify-center gap-1.5 rounded-md px-3 py-1 text-sm font-medium whitespace-nowrap transition-all focus-visible:ring-2 focus-visible:outline-1 disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*=\'size-\'])]:size-4 cursor-pointer', props.class)"
  >
    <slot />
  </TabsTrigger>
</template>
