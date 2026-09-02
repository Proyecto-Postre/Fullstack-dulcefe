<script setup lang="ts">
import UiCustomDatePicker from './ui/CustomDatePicker.vue'

defineProps<{
  modelValue: string
  placeholder?: string
  bgClass?: string
}>()

defineEmits<{
  (e: 'update:modelValue', val: string): void
}>()
</script>

<template>
  <UiCustomDatePicker :modelValue="modelValue" :placeholder="placeholder" :bgClass="bgClass" @update:modelValue="$emit('update:modelValue', $event)" />
</template>
