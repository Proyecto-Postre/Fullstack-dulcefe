<script setup lang="ts">
import type { CheckoutErrorDetails } from '~/composables/useCheckout'

defineProps<{
  errorMessage: string | null
  errorDetails: CheckoutErrorDetails[]
}>()
</script>

<template>
  <div
    v-if="errorMessage"
    role="alert"
    aria-live="assertive"
    class="bg-red-50 border-2 border-red-200 text-red-900 p-4 rounded-2xl flex items-start gap-3 shadow-xs"
  >
    <Icon name="lucide:alert-circle" class="w-5 h-5 text-status-danger shrink-0 mt-0.5" />
    <div class="space-y-1">
      <h3 class="font-bold text-sm">{{ errorMessage }}</h3>
      <ul v-if="errorDetails.length > 0" class="list-disc list-inside text-xs text-red-700 space-y-0.5">
        <li v-for="(detail, idx) in errorDetails" :key="idx">
          <span v-if="detail.field" class="font-bold">{{ detail.field }}: </span>
          <span>{{ detail.message }}</span>
        </li>
      </ul>
    </div>
  </div>
</template>
