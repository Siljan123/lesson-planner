<script setup lang="ts">
import { DropdownMenuRoot, useForwardPropsEmits } from "reka-ui"

const props = defineProps<{
  defaultOpen?: boolean
  open?: boolean
  modal?: boolean
  dir?: "ltr" | "rtl"
}>()
const emits = defineEmits<{
  (e: "update:open", payload: boolean): void
}>()

const forwarded = useForwardPropsEmits(props, emits)
</script>

<template>
  <DropdownMenuRoot
    v-slot="slotProps"
    data-slot="dropdown-menu"
    v-bind="forwarded"
  >
    <slot v-bind="slotProps" />
  </DropdownMenuRoot>
</template>
