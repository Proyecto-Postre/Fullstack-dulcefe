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
      :class="[
        'bg-surface rounded-2xl border transition-all duration-300 shadow-soft-sm overflow-hidden',
        openItemId === item.id
          ? 'border-brand-primary/30 shadow-soft-md ring-1 ring-brand-primary/10'
          : 'border-brand-primary/15 hover:border-brand-primary/30'
      ]"
    >
      <button
        type="button"
        @click="toggleItem(item.id)"
        :class="[
          'w-full text-left px-5 sm:px-6 flex items-center justify-between gap-4 cursor-pointer focus:outline-none focus:ring-2 focus:ring-brand-primary/30 select-none transition-all duration-300',
          openItemId === item.id ? 'pt-4 sm:pt-5 pb-2.5 sm:pb-3' : 'py-4 sm:py-5'
        ]"
        :aria-expanded="openItemId === item.id"
        :aria-controls="`faq-answer-${item.id}`"
        :id="`faq-trigger-${item.id}`"
      >
        <span class="text-sm sm:text-base font-sans font-bold text-brand-secondary leading-snug">
          {{ item.question }}
        </span>
        <div
          class="w-8 h-8 rounded-full bg-brand-cream/70 flex items-center justify-center shrink-0 text-brand-primary transition-all duration-300 shadow-soft-xs"
          :class="openItemId === item.id ? 'rotate-180 bg-brand-primary text-white shadow-soft-sm' : 'hover:bg-brand-cream'"
        >
          <Icon name="lucide:chevron-down" class="w-4 h-4 transition-transform duration-300" />
        </div>
      </button>

      <!-- Contenedor con transicion fluida en altura y opacidad sin lineas divisorias -->
      <div
        :id="`faq-answer-${item.id}`"
        role="region"
        :aria-labelledby="`faq-trigger-${item.id}`"
        class="faq-collapse"
        :class="{ 'is-open': openItemId === item.id }"
      >
        <div class="faq-collapse-inner">
          <div class="px-5 sm:px-6 pb-5 pt-0 text-xs sm:text-sm text-brand-secondary/80 leading-relaxed font-sans">
            <p class="whitespace-pre-line leading-relaxed">
              {{ item.answer }}
            </p>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.faq-collapse {
  display: grid;
  grid-template-rows: 0fr;
  opacity: 0;
  transition: grid-template-rows 300ms cubic-bezier(0.4, 0, 0.2, 1), opacity 250ms ease-in-out;
  pointer-events: none;
}

.faq-collapse.is-open {
  grid-template-rows: 1fr;
  opacity: 1;
  pointer-events: auto;
}

.faq-collapse-inner {
  overflow: hidden;
  min-height: 0;
}
</style>
