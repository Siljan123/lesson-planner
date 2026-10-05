<script setup lang="ts">
import { ref } from 'vue'
import PricingCard from '@/components/pricing/PricingCard.vue'
import RequestPackageModal from '@/components/pricing/RequestPackageModal.vue'

const tiers = [
  {
    title: 'Starter',
    tokens: '500K',
    price: 79,
    value: 500000,
    features: ['Approximately 70 lesson plans', 'Adds to your monthly quota']
  },
  {
    title: 'Basic',
    tokens: '1M',
    price: 139,
    value: 1000000,
    popular: true,
    features: ['Approximately 140 lesson plans', 'Adds to your monthly quota']
  },
  {
    title: 'Pro',
    tokens: '2M',
    price: 229,
    value: 2000000,
    features: ['Approximately 280 lesson plans', 'Adds to your monthly quota']
  },
  {
    title: 'Max',
    tokens: '5M',
    price: 599,
    value: 5000000,
    features: ['Approximately 700 lesson plans', 'Adds to your monthly quota']
  }
]

const isSubmitting = ref(false)
const errorMsg = ref('')
const successMsg = ref('')

const isModalOpen = ref(false)
const selectedPackageAmount = ref<number>(0)

function openModal(amount: number) {
  selectedPackageAmount.value = amount
  isModalOpen.value = true
}

async function handleConfirm() {
  isSubmitting.value = true
  errorMsg.value = ''
  successMsg.value = ''
  
  try {
    const headers = useRequestHeaders(['cookie']) as Record<string, string>
    await $fetch('/api/token-requests', {
      method: 'POST',
      headers,
      body: { requested_amount: selectedPackageAmount.value },
    })
    successMsg.value = 'Your request has been submitted successfully! An admin will review it shortly.'
    isModalOpen.value = false
  } catch (err: any) {
    errorMsg.value = err?.data?.statusMessage || err?.message || 'Failed to submit request. You might already have a pending request.'
    isModalOpen.value = false
  } finally {
    isSubmitting.value = false
  }
}
</script>

<template>
  <div class="flex-1 space-y-8 p-8 pt-10 max-w-7xl mx-auto w-full">
    <div class="flex flex-col items-center text-center space-y-4">
      <h2 class="text-3xl font-bold tracking-tight sm:text-4xl">Upgrade Your Token Quota</h2>
      <p class="text-muted-foreground max-w-[600px] text-lg">
        Need more generations? Choose a token package below and send a request to your admin.
      </p>
    </div>

    <div v-if="errorMsg" class="p-4 bg-red-500/10 text-red-600 rounded-md text-center max-w-2xl mx-auto border border-red-500/20">
      {{ errorMsg }}
    </div>

    <div v-if="successMsg" class="p-4 bg-green-500/10 text-green-600 rounded-md text-center max-w-2xl mx-auto border border-green-500/20">
      {{ successMsg }}
    </div>

    <div class="grid md:grid-cols-2 lg:grid-cols-4 gap-6 pt-4">
      <PricingCard
        v-for="tier in tiers"
        :key="tier.title"
        v-bind="tier"
        :disabled="isSubmitting"
        @select="openModal"
      />
    </div>

    <!-- Explainer / Disclaimer -->
    <div class="max-w-3xl mx-auto mt-12 p-6 bg-muted/30 rounded-lg border text-sm text-muted-foreground space-y-3">
      <h3 class="font-semibold text-foreground text-base">How Token Packages Work</h3>
      <ul class="list-disc pl-5 space-y-1">
        <li><strong>One-Time Upgrade:</strong> Purchasing a package increases your token limit for the current 30-day billing cycle.</li>
        <li><strong>No Rollover:</strong> Any unused tokens at the end of your 30-day cycle will expire and will <strong>not</strong> roll over to the next month.</li>
        <li><strong>Manual Renewal:</strong> Packages do not automatically renew. After 30 days, your quota will reset to the default 100k token free limit unless you purchase another package.</li>
      </ul>
    </div>
    
    <RequestPackageModal 
      v-model:open="isModalOpen"
      :is-submitting="isSubmitting"
      @confirm="handleConfirm"
    />
  </div>
</template>