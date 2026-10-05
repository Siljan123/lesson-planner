<script setup lang="ts">
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Loader2, Mail } from '@lucide/vue'

const props = defineProps<{
  open: boolean
  isSubmitting?: boolean
}>()

const emit = defineEmits<{
  (e: 'update:open', value: boolean): void
  (e: 'confirm'): void
}>()

function onConfirm() {
  emit('confirm')
}

function onCancel() {
  emit('update:open', false)
}
</script>

<template>
  <Dialog :open="open" @update:open="emit('update:open', $event)">
    <DialogContent class="sm:max-w-[425px]">
      <DialogHeader>
        <DialogTitle>Request Package</DialogTitle>
        <DialogDescription>
          For more details pls this person for the transaction
        </DialogDescription>
        <div class="flex gap-1">
          <Mail/>
          <h1 class="text-green-500">
          graciousjean84@gmail.com.
          </h1>
        </div>
      

      </DialogHeader>
      
      <div class="py-4">
        <p class="text-sm text-muted-foreground">
          Are you sure you want to proceed and request this token package?
        </p>
      </div>
      
      <DialogFooter>
        <Button variant="ghost" @click="onCancel" :disabled="isSubmitting">Cancel</Button>
        <Button @click="onConfirm" :disabled="isSubmitting">
          <Loader2 v-if="isSubmitting" class="w-4 h-4 mr-2 animate-spin" />
          Confirm Request
        </Button>
      </DialogFooter>
    </DialogContent>
  </Dialog>
</template>
