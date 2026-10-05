<script setup lang="ts">
import { ref } from 'vue'
import { PlusCircle, Loader2 } from '@lucide/vue'

const emit = defineEmits<{
  (e: 'success'): void
}>()

const isOpen = ref(false)
const isSubmitting = ref(false)
const selectedAmount = ref<number | null>(null)
const errorMsg = ref('')

const tokenOptions = [
  { value: 500000, label: '500K' },
  { value: 1000000, label: '1 Million' },
  { value: 2000000, label: '2 Million' },
  { value: 4000000, label: '4 Million' },
  { value: 5000000, label: '5 Million' },
]

async function submitRequest() {
  if (!selectedAmount.value) return

  isSubmitting.value = true
  errorMsg.value = ''

  try {
    const headers = useRequestHeaders(['cookie']) as Record<string, string>
    await $fetch('/api/token-requests', {
      method: 'POST',
      headers,
      body: { requested_amount: selectedAmount.value },
    })
    
    isOpen.value = false
    emit('success')
  } catch (err: any) {
    errorMsg.value = err?.data?.statusMessage || err?.message || 'Failed to submit request'
  } finally {
    isSubmitting.value = false
  }
}
</script>

<template>
  <Dialog v-model:open="isOpen">
    <DialogTrigger as-child>
      <Button variant="outline" size="sm" class="w-full text-xs h-8">
        <PlusCircle class="w-3.5 h-3.5 mr-1.5" />
        Request More Tokens
      </Button>
    </DialogTrigger>
    <DialogContent class="sm:max-w-[425px]">
      <DialogHeader>
        <DialogTitle>Request More Tokens</DialogTitle>
        <DialogDescription>
          Request an increase to your monthly token limit. 
          An admin will review your request.
        </DialogDescription>
      </DialogHeader>
      
      <div class="py-4 space-y-4">
        <div v-if="errorMsg" class="p-3 bg-red-500/10 text-red-500 text-sm rounded-md">
          {{ errorMsg }}
        </div>

        <div class="space-y-3">
          <label class="text-sm font-medium">Select Amount to Add:</label>
          <div class="grid grid-cols-2 gap-2">
            <button
              v-for="opt in tokenOptions"
              :key="opt.value"
              type="button"
              class="border rounded-md px-3 py-2 text-sm transition-colors text-left flex items-center justify-between"
              :class="selectedAmount === opt.value ? 'bg-primary/10 border-primary text-primary font-medium' : 'hover:bg-muted/50 text-muted-foreground'"
              @click="selectedAmount = opt.value"
            >
              {{ opt.label }}
              <div
                v-if="selectedAmount === opt.value"
                class="w-2 h-2 rounded-full bg-primary"
              />
            </button>
          </div>
        </div>
      </div>
      
      <DialogFooter>
        <Button variant="ghost" @click="isOpen = false" :disabled="isSubmitting">Cancel</Button>
        <Button @click="submitRequest" :disabled="!selectedAmount || isSubmitting">
          <Loader2 v-if="isSubmitting" class="w-4 h-4 mr-2 animate-spin" />
          Submit Request
        </Button>
      </DialogFooter>
    </DialogContent>
  </Dialog>
</template>
