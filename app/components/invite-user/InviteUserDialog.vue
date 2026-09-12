
<script setup lang="ts">
import { ref } from 'vue'

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
  school_id: ''
})

async function onSubmit() {
  loading.value = true
  try {
    await $fetch('/api/invite-user', {
      method: 'POST',
      body: {
        ...form.value,
        school_id: form.value.school_id || null,
        redirectTo: `${window.location.origin}/auth/confirm`
      }
    })
    emit('success')
    emit('update:open', false)
    form.value = { email: '', full_name: '', role: 'teacher', school_id: '' }
  } catch (error) {
    alert('Failed to invite user. Check console for details.')
    console.error(error)
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
          <Input id="email" v-model="form.email" type="email" required />
        </div>
        <div class="space-y-2">
          <Label for="full_name">Full Name</Label>
          <Input id="full_name" v-model="form.full_name" required />
        </div>
        <div class="space-y-2">
          <Label for="role">Role</Label>
          <Select v-model="form.role" required>
            <SelectTrigger id="role">
              <SelectValue placeholder="Select a role" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="teacher">Teacher</SelectItem>
              <SelectItem value="admin">Admin</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div class="space-y-2">
          <Label for="school_id">School ID (Optional)</Label>
          <Input id="school_id" v-model="form.school_id" />
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
