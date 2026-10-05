<script setup lang="ts">
import { ref } from 'vue'
import DataTable from '~/components/invite-user/DataTable.vue'
import PendingTokenRequests from '~/components/invite-user/PendingTokenRequests.vue'

definePageMeta({
  middleware: 'admin'
})

const { data: users, refresh: refreshUsers } = await useFetch('/api/invite-user')
const { data: requests, refresh: refreshRequests } = await useFetch('/api/token-requests')

function handleRefresh() {
  refreshUsers()
  refreshRequests()
}
</script>

<template>
  <div class="flex-1 space-y-4 p-8 pt-6">
    <div class="flex items-center justify-between space-y-2">
      <div>
        <h2 class="text-3xl font-bold tracking-tight">Users & Quotas</h2>
        <p class="text-muted-foreground">
          Manage users, roles, and token limits.
        </p>
      </div>
    </div>
    
    <Tabs defaultValue="users" class="w-full">
      <TabsList class="mb-4">
        <TabsTrigger value="users">Users</TabsTrigger>
        <TabsTrigger value="requests" class="flex items-center gap-2">
          Token Requests
          <Badge v-if="requests && requests.length > 0" variant="destructive" class="h-5 px-1.5 text-[10px]">
            {{ requests.length }}
          </Badge>
        </TabsTrigger>
      </TabsList>
      
      <TabsContent value="users" class="m-0">
        <DataTable v-if="users" :data="users" @refresh="handleRefresh" />
      </TabsContent>
      
      <TabsContent value="requests" class="m-0">
        <PendingTokenRequests @refresh="handleRefresh" />
      </TabsContent>
    </Tabs>
  </div>
</template>
