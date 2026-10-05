<script setup lang="ts">
import { Check } from '@lucide/vue'

const props = defineProps<{
  title: string
  tokens: string
  price: number
  popular?: boolean
  features: string[]
  value: number
  disabled?: boolean
}>()

const emit = defineEmits<{
  (e: 'select', amount: number): void
}>()
</script>

<template>
  <Card :class="['relative flex flex-col', popular ? 'border-primary shadow-md' : '']">
    <Badge v-if="popular" class="absolute -top-3 right-4">Most Popular</Badge>
    <CardHeader>
      <CardTitle class="text-xl">{{ title }}</CardTitle>
      <CardDescription>{{ tokens }} Tokens</CardDescription>
    </CardHeader>
    <CardContent class="flex-1">
      <div class="mb-6 flex items-baseline gap-1">
        <span class="text-4xl font-bold">₱{{ price }}</span>
      </div>
      <ul class="space-y-3 text-sm text-muted-foreground">
        <li v-for="feature in features" :key="feature" class="flex items-start gap-2">
          <Check class="h-4 w-4 text-primary shrink-0 mt-0.5" />
          <span>{{ feature }}</span>
        </li>
      </ul>
    </CardContent>
    <CardFooter>
      <Button 
        class="w-full" 
        :variant="popular ? 'default' : 'outline'"
        :disabled="disabled"
        @click="emit('select', value)"
      >
        Request Package
      </Button>
    </CardFooter>
  </Card>
</template>