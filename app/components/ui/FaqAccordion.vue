<script setup lang="ts">
import { ref } from 'vue'

export interface FaqItem {
  id: string
  question: string
  answer: string
  category?: string
}

const props = defineProps<{
  items: FaqItem[]
}>()

const openItemId = ref<string | null>(props.items[0]?.id || null)

function toggleItem(id: string) {
  openItemId.value = openItemId.value === id ? null : id
}
</script>

<template>
  <div class="space-y-3 w-full">
    <div
      v-for="item in items"
      :key="item.id"
      class="bg-surface rounded-2xl border border-brand-primary/15 transition-all duration-300 shadow-soft-sm overflow-hidden"
    >
      <button
        type="button"
        @click="toggleItem(item.id)"
        class="w-full text-left px-5 sm:px-6 py-4 sm:py-5 flex items-center justify-between gap-4 cursor-pointer focus:outline-none focus:ring-2 focus:ring-brand-primary/30"
        :aria-expanded="openItemId === item.id"
        :aria-controls="`faq-answer-${item.id}`"
      >
        <span class="text-sm sm:text-base font-sans font-bold text-brand-secondary leading-snug">
          {{ item.question }}
        </span>
        <div
          class="w-8 h-8 rounded-full bg-brand-cream/70 flex items-center justify-center shrink-0 text-brand-primary transition-transform duration-300"
          :class="openItemId === item.id ? 'rotate-180 bg-brand-primary text-white' : ''"
        >
          <Icon name="lucide:chevron-down" class="w-4 h-4" />
        </div>
      </button>

      <div
        v-show="openItemId === item.id"
        :id="`faq-answer-${item.id}`"
        class="px-5 sm:px-6 pb-5 pt-1 text-xs sm:text-sm text-brand-secondary/80 leading-relaxed border-t border-brand-primary/10 font-sans"
      >
        <p class="whitespace-pre-line">
          {{ item.answer }}
        </p>
      </div>
    </div>
  </div>
</template>
