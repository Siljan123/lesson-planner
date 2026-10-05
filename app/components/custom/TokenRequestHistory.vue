<script setup lang="ts">
import { computed } from 'vue'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { Table, TableHeader, TableRow, TableHead, TableBody, TableCell } from '@/components/ui/table'
import { History, CircleCheck, CircleX, Timer } from '@lucide/vue'

const { data: requests, pending, error } = useFetch('/api/token-requests')

const statusIcons: Record<string, any> = { 
  pending: Timer, 
  approved: CircleCheck, 
  rejected: CircleX 
}

const statusColors: Record<string, string> = {
  pending: 'text-amber-500',
  approved: 'text-green-500',
  rejected: 'text-red-500'
}
</script>

<template>
  <Card>
    <CardHeader>
      <CardTitle class="flex items-center gap-2">
        <History class="w-5 h-5" />
        Token Request History
      </CardTitle>
    </CardHeader>
    <CardContent>
      <div v-if="pending" class="py-4 text-center text-sm text-muted-foreground animate-pulse">
        Loading history...
      </div>
      <div v-else-if="error" class="py-4 text-center text-sm text-red-500">
        Failed to load history.
      </div>
      <div v-else-if="!requests || requests.length === 0" class="py-4 text-center text-sm text-muted-foreground">
        No token requests found.
      </div>
      <div v-else class="rounded-md border border-border max-h-[300px] overflow-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Date</TableHead>
              <TableHead class="text-right">Amount</TableHead>
              <TableHead class="text-right">Status</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            <TableRow v-for="req in requests" :key="req.id">
              <TableCell class="text-sm">
                {{ new Date(req.created_at).toLocaleDateString() }}
              </TableCell>
              <TableCell class="text-right font-medium">
                {{ req.requested_amount?.toLocaleString() || 0 }}
              </TableCell>
              <TableCell class="text-right">
                <div class="flex items-center justify-end gap-1.5 text-sm" :class="statusColors[req.status]">
                  <component :is="statusIcons[req.status]" class="w-4 h-4" />
                  <span class="capitalize">{{ req.status }}</span>
                </div>
              </TableCell>
            </TableRow>
          </TableBody>
        </Table>
      </div>
    </CardContent>
  </Card>
</template>
