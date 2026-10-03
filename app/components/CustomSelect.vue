<script setup lang="ts">
import UiCustomSelect, { type SelectOption } from './ui/CustomSelect.vue'

defineProps<{
  options: SelectOption[]
  modelValue: unknown
  placeholder?: string
  bgClass?: string
  buttonClass?: string
  disabled?: boolean
  size?: 'sm' | 'md'
}>()

defineEmits<{
  (e: 'update:modelValue', val: unknown): void
  (e: 'change', val: unknown): void
}>()
</script>

<template>
  <UiCustomSelect
    :options="options"
    :modelValue="modelValue"
    :placeholder="placeholder"
    :bgClass="bgClass"
    :buttonClass="buttonClass"
    :disabled="disabled"
    :size="size"
    @update:model-value="$emit('update:modelValue', $event)"
    @change="$emit('change', $event)"
  />
</template>
