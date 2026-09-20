<script setup lang="ts">
import UiCustomTimePicker from './ui/CustomTimePicker.vue'

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
  <UiCustomTimePicker :modelValue="modelValue" :placeholder="placeholder" :bgClass="bgClass" @update:model-value="$emit('update:modelValue', $event)" />
</template>
