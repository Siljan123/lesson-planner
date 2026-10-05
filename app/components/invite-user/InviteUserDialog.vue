
<script setup lang="ts">
import { ref } from 'vue'
import { toast } from 'vue-sonner'

const props = defineProps<{
  open: boolean
}>()

const emit = defineEmits<{
  (e: 'update:open', value: boolean): void
  (e: 'success'): void
}>()

const loading = ref(false)
const form = ref({
  email: '',
  full_name: '',
  role: 'teacher',
})

async function onSubmit() {
  loading.value = true
  try {
    await $fetch('/api/invite-user', {
      method: 'POST',
      body: {
        email: form.value.email,
        full_name: form.value.full_name?.trim() || undefined,
        role: form.value.role,
        redirectTo: `${window.location.origin}/auth/confirm`
      }
    })
    toast.success(`Invitation sent to ${form.value.email}`)
    emit('success')
    emit('update:open', false)
    form.value = { email: '', full_name: '', role: 'teacher' }
  } catch (error: any) {
    const msg = error?.data?.message || error?.data?.statusMessage || error?.message || 'Failed to invite user.'
    toast.error(msg)
    console.error('Invite error:', error)
  } finally {
    loading.value = false
  }
}
</script>


<template>
  <Dialog :open="open" @update:open="emit('update:open', $event)">
    <DialogContent class="sm:max-w-[425px]">
      <DialogHeader>
        <DialogTitle>Invite User</DialogTitle>
        <DialogDescription>
          Send an invitation to a new user to join the platform.
        </DialogDescription>
      </DialogHeader>
      <form @submit.prevent="onSubmit" class="space-y-4 pt-2">
        <div class="space-y-2">
          <Label for="email">Email</Label>
          <Input id="email" v-model="form.email" type="email" placeholder="name@example.com" required />
        </div>

        <div class="space-y-2">
          <Label for="full_name">Full Name <span class="text-xs text-muted-foreground font-normal">(Optional)</span></Label>
          <Input id="full_name" v-model="form.full_name" placeholder="First and last name" />
        </div>
     
        <div class="space-y-2">
          <Label for="role">Role</Label>
          <Select v-model="form.role" required>
            <SelectTrigger class="w-full" id="role">
              <SelectValue placeholder="Select a role" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="teacher">Teacher</SelectItem>
              <SelectItem value="admin">Admin</SelectItem>
            </SelectContent>
          </Select>
        </div>
      
        <DialogFooter class="pt-4">
          <Button type="button" variant="outline" @click="emit('update:open', false)">Cancel</Button>
          <Button type="submit" :disabled="loading">
            <span v-if="loading">Inviting...</span>
            <span v-else>Invite User</span>
          </Button>
        </DialogFooter>
      </form>
    </DialogContent>
  </Dialog>
</template>
