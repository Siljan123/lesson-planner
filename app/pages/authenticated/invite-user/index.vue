<script setup lang="ts">
import { ref } from 'vue'
import { Plus } from '@lucide/vue'
import DataTable from '~/components/invite-user/DataTable.vue'
import InviteUserDialog from '~/components/invite-user/InviteUserDialog.vue'

definePageMeta({
  middleware: 'admin'
})

const inviteDialogOpen = ref(false)

const { data: users, refresh: refreshUsers } = await useFetch('/api/invite-user')
</script>

<template>
  <div class="flex-1 space-y-4 p-8 pt-6">
    <div class="flex items-center justify-between space-y-2">
      <div>
        <h2 class="text-3xl font-bold tracking-tight">Users</h2>
        <p class="text-muted-foreground">
          Manage users and their roles in the system.
        </p>
      </div>
      <div class="flex items-center space-x-2">
        <Button @click="inviteDialogOpen = true">
          <Plus class="mr-2 h-4 w-4" />
          Invite User
        </Button>
      </div>
    </div>
    
    <DataTable v-if="users" :data="users" />

    <InviteUserDialog 
      v-model:open="inviteDialogOpen" 
      @success="refreshUsers"
    />
  </div>
</template>
