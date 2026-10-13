<script setup lang="ts">
import { ref, computed, watch, onMounted, onBeforeUnmount } from 'vue'
import { toast } from 'vue-sonner'

export interface CategoryItem {
  id: string
  name: string
  icon: string
  sort_order: number
  is_active: boolean
  created_at?: string
}

// Carga de categorías administrativas
const { data: categoriesResponse, refresh, pending } = await useFetch<{ success: boolean; data: CategoryItem[] }>('/api/admin/categories', {
  default: () => ({ success: true, data: [] })
})

const categories = computed<CategoryItem[]>(() => categoriesResponse.value?.data || [])

// Estado del Modal / Formulario
const isModalOpen = ref(false)
const isEditing = ref(false)
const isSubmitting = ref(false)
const categoryForm = ref<{
  id: string
  name: string
  icon: string
  sort_order: number
  is_active: boolean
}>({
  id: '',
  name: '',
  icon: 'lucide:sparkles',
  sort_order: 1,
  is_active: true
})

const suggestedIcons = [
  { label: 'Torta', icon: 'lucide:cake' },
  { label: 'Destello', icon: 'lucide:sparkles' },
  { label: 'Regalo', icon: 'lucide:gift' },
  { label: 'Galleta', icon: 'lucide:cookie' },
  { label: 'Taza', icon: 'lucide:coffee' },
  { label: 'Corazón', icon: 'lucide:heart' },
  { label: 'Corona', icon: 'lucide:crown' },
  { label: 'Estrella', icon: 'lucide:star' }
]

function openCreateModal() {
  isEditing.value = false
  categoryForm.value = {
    id: '',
    name: '',
    icon: 'lucide:cake',
    sort_order: (categories.value.length + 1),
    is_active: true
  }
  isModalOpen.value = true
}

function openEditModal(cat: CategoryItem) {
  isEditing.value = true
  categoryForm.value = {
    id: cat.id,
    name: cat.name,
    icon: cat.icon || 'lucide:sparkles',
    sort_order: cat.sort_order ?? 0,
    is_active: cat.is_active ?? true
  }
  isModalOpen.value = true
}

function closeModal() {
  isModalOpen.value = false
}

// Bloqueo estricto del scroll del body cuando el modal está activo
watch(isModalOpen, (open) => {
  if (typeof document === 'undefined') return
  if (open) {
    document.body.classList.add('overflow-hidden', 'overscroll-none')
  } else {
    document.body.classList.remove('overflow-hidden', 'overscroll-none')
  }
})

// Manejo accesible de tecla Escape
function handleKeyDown(e: KeyboardEvent) {
  if (e.key === 'Escape' && isModalOpen.value) {
    closeModal()
  }
}

onMounted(() => {
  if (typeof window !== 'undefined') {
    window.addEventListener('keydown', handleKeyDown)
  }
})

onBeforeUnmount(() => {
  if (typeof document !== 'undefined') {
    document.body.classList.remove('overflow-hidden', 'overscroll-none')
  }
  if (typeof window !== 'undefined') {
    window.removeEventListener('keydown', handleKeyDown)
  }
})

async function handleSaveCategory() {
  if (!categoryForm.value.name.trim()) {
    toast.error('El nombre de la sección es obligatorio.')
    return
  }

  isSubmitting.value = true
  try {
    if (isEditing.value) {
      await $fetch(`/api/admin/categories/${categoryForm.value.id}`, {
        method: 'PUT',
        body: {
          name: categoryForm.value.name,
          icon: categoryForm.value.icon,
          sort_order: categoryForm.value.sort_order,
          is_active: categoryForm.value.is_active
        }
      })
      toast.success('Sección actualizada con éxito.')
    } else {
      await $fetch('/api/admin/categories', {
        method: 'POST',
        body: categoryForm.value
      })
      toast.success('Nueva sección creada exitosamente.')
    }
    await refresh()
    closeModal()
  } catch (err: unknown) {
    const errorObj = err as { data?: { statusMessage?: string }; message?: string }
    toast.error(errorObj.data?.statusMessage || errorObj.message || 'Error al guardar categoría.')
  } finally {
    isSubmitting.value = false
  }
}

async function handleDeleteCategory(cat: CategoryItem) {
  if (!confirm(`¿Estás seguro de eliminar la sección "${cat.name}"? Los postres asociados quedarán sin sección.`)) {
    return
  }

  try {
    await $fetch(`/api/admin/categories/${cat.id}`, {
      method: 'DELETE'
    })
    toast.success(`Sección "${cat.name}" eliminada.`)
    await refresh()
  } catch (err: unknown) {
    const errorObj = err as { data?: { statusMessage?: string }; message?: string }
    toast.error(errorObj.data?.statusMessage || errorObj.message || 'Error al eliminar categoría.')
  }
}

async function toggleActive(cat: CategoryItem) {
  try {
    await $fetch(`/api/admin/categories/${cat.id}`, {
      method: 'PUT',
      body: { is_active: !cat.is_active }
    })
    toast.success(`Sección "${cat.name}" ${!cat.is_active ? 'activada' : 'ocultada'}.`)
    await refresh()
  } catch {
    toast.error('No se pudo actualizar el estado de la sección.')
  }
}
</script>

<template>
  <div class="space-y-6">
    <!-- Header de la sección -->
    <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-surface p-6 rounded-3xl border border-brand-primary/10 shadow-soft-sm">
      <div>
        <div class="inline-flex items-center gap-2 text-xs font-bold text-brand-primary uppercase tracking-widest mb-1">
          <Icon name="lucide:tags" class="w-4 h-4 text-brand-accent" />
          <span>Estructura de la Carta</span>
        </div>
        <h2 class="text-2xl sm:text-3xl font-playfair font-black text-brand-secondary">
          Categorías & Secciones
        </h2>
        <p class="text-xs sm:text-sm text-brand-secondary/70 font-medium mt-1">
          Crea y organiza las secciones por las cuales tus clientes filtrarán en la vitrina principal.
        </p>
      </div>

      <button
        @click="openCreateModal"
        type="button"
        class="inline-flex items-center justify-center gap-2 px-5 py-3 rounded-full bg-brand-primary hover:bg-brand-secondary text-white text-xs font-bold uppercase tracking-wider transition-all shadow-soft-sm active:scale-95 cursor-pointer shrink-0"
      >
        <Icon name="lucide:plus" class="w-4 h-4" />
        <span>Nueva Sección</span>
      </button>
    </div>

    <!-- Lista de Categorías -->
    <div v-if="pending" class="p-12 text-center text-brand-secondary/60">
      <Icon name="lucide:loader-2" class="w-8 h-8 animate-spin mx-auto text-brand-primary mb-2" />
      <p class="text-xs font-bold uppercase tracking-widest">Cargando secciones...</p>
    </div>

    <div v-else-if="categories.length === 0" class="bg-surface rounded-3xl p-12 text-center border border-brand-primary/10 shadow-soft-sm">
      <div class="w-16 h-16 rounded-full bg-brand-cream flex items-center justify-center text-brand-primary mx-auto mb-4">
        <Icon name="lucide:tags" class="w-8 h-8" />
      </div>
      <h3 class="text-lg font-playfair font-bold text-brand-secondary mb-1">No hay secciones registradas</h3>
      <p class="text-xs text-brand-secondary/70 font-medium max-w-md mx-auto mb-6">
        Crea secciones como "Tortas de Cumpleaños" o "Boxes para Regalo" para que aparezcan como filtros en la carta.
      </p>
      <button
        @click="openCreateModal"
        type="button"
        class="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-brand-primary text-white text-xs font-bold hover:bg-brand-secondary transition-all"
      >
        <Icon name="lucide:plus" class="w-4 h-4" />
        <span>Crear Primera Sección</span>
      </button>
    </div>

    <div v-else class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      <div
        v-for="cat in categories"
        :key="cat.id"
        class="bg-surface rounded-2xl p-5 border border-brand-primary/15 shadow-soft-sm flex flex-col justify-between hover:shadow-soft-md transition-shadow"
      >
        <div class="flex items-start justify-between gap-3 mb-4">
          <div class="flex items-center gap-3">
            <div class="w-12 h-12 rounded-xl bg-brand-cream flex items-center justify-center text-brand-primary shrink-0 border border-brand-primary/20">
              <Icon :name="cat.icon || 'lucide:sparkles'" class="w-6 h-6" />
            </div>
            <div>
              <h3 class="text-base font-playfair font-bold text-brand-secondary leading-tight">
                {{ cat.name }}
              </h3>
              <p class="text-[11px] font-mono text-brand-primary/75 mt-0.5">
                ID: {{ cat.id }}
              </p>
            </div>
          </div>

          <span
            :class="cat.is_active ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 'bg-gray-100 text-gray-500 border-gray-200'"
            class="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full border shrink-0"
          >
            {{ cat.is_active ? 'Activa' : 'Oculta' }}
          </span>
        </div>

        <div class="flex items-center justify-between pt-3 border-t border-brand-primary/10 text-xs text-brand-secondary/80 font-medium">
          <span class="text-[11px]">Orden en vitrina: <strong>#{{ cat.sort_order }}</strong></span>

          <div class="flex items-center gap-1.5">
            <button
              @click="toggleActive(cat)"
              type="button"
              class="p-2 rounded-lg hover:bg-brand-cream text-brand-secondary transition-colors"
              :title="cat.is_active ? 'Ocultar de la vitrina' : 'Mostrar en la vitrina'"
            >
              <Icon :name="cat.is_active ? 'lucide:eye' : 'lucide:eye-off'" class="w-4 h-4" />
            </button>
            <button
              @click="openEditModal(cat)"
              type="button"
              class="p-2 rounded-lg hover:bg-brand-cream text-brand-primary transition-colors"
              title="Editar sección"
            >
              <Icon name="lucide:pencil" class="w-4 h-4" />
            </button>
            <button
              @click="handleDeleteCategory(cat)"
              type="button"
              class="p-2 rounded-lg hover:bg-red-50 text-red-600 transition-colors"
              title="Eliminar sección"
            >
              <Icon name="lucide:trash-2" class="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- Modal de Creación / Edición Blindado según Estándar Arquitectónico -->
    <ClientOnly>
      <Teleport to="#admin-modal-portal">
        <div
          v-if="isModalOpen"
          class="fixed inset-0 z-[9999] flex items-center justify-center p-4 sm:p-6 overflow-y-auto custom-scrollbar pointer-events-auto"
        >
          <!-- Backdrop difuminado -->
          <div
            class="fixed inset-0 bg-[#2A321B]/50 backdrop-blur-sm transition-opacity"
            @click="closeModal"
          ></div>

          <!-- Diálogo Modal Accesible -->
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="modal-category-title"
            class="relative w-full max-w-lg bg-surface rounded-3xl p-6 sm:p-8 shadow-2xl border border-brand-primary/20 space-y-6 animate-scale-up max-h-[85vh] overflow-y-auto custom-scrollbar flex flex-col pointer-events-auto"
          >
            <div class="flex items-center justify-between border-b border-brand-primary/10 pb-4 shrink-0">
              <h3 id="modal-category-title" class="text-xl font-playfair font-bold text-brand-secondary">
                {{ isEditing ? 'Editar Sección' : 'Nueva Sección de la Carta' }}
              </h3>
              <button
                @click="closeModal"
                type="button"
                aria-label="Cerrar modal de sección"
                class="w-8 h-8 flex items-center justify-center rounded-full bg-surface border border-brand-primary/20 text-brand-secondary hover:bg-brand-cream/50 hover:scale-105 active:scale-95 transition-all shadow-sm cursor-pointer"
              >
                <Icon name="lucide:x" class="w-4 h-4" />
              </button>
            </div>

            <form @submit.prevent="handleSaveCategory" class="space-y-4 flex-1">
              <div>
                <label for="cat-name" class="block text-xs font-bold text-brand-primary uppercase tracking-wider mb-1">Nombre de la Sección</label>
                <input
                  id="cat-name"
                  v-model="categoryForm.name"
                  type="text"
                  required
                  placeholder="Ej. Tortas de Cumpleaños"
                  class="w-full px-4 py-2.5 rounded-xl border border-brand-primary/20 bg-brand-cream/30 text-sm font-semibold text-brand-secondary focus:outline-none focus:border-brand-primary focus-visible:ring-2 focus-visible:ring-brand-primary"
                />
              </div>

              <div v-if="!isEditing">
                <label for="cat-slug" class="block text-xs font-bold text-brand-primary uppercase tracking-wider mb-1">Identificador / Slug (opcional)</label>
                <input
                  id="cat-slug"
                  v-model="categoryForm.id"
                  type="text"
                  placeholder="tortas-cumpleanos (autogenerado si se deja vacío)"
                  class="w-full px-4 py-2.5 rounded-xl border border-brand-primary/20 bg-brand-cream/30 text-xs font-mono text-brand-secondary focus:outline-none focus:border-brand-primary focus-visible:ring-2 focus-visible:ring-brand-primary"
                />
              </div>

              <div>
                <label for="cat-icon" class="block text-xs font-bold text-brand-primary uppercase tracking-wider mb-1.5">Ícono Representativo</label>
                <div class="flex flex-wrap gap-2 mb-2">
                  <button
                    v-for="item in suggestedIcons"
                    :key="item.icon"
                    type="button"
                    @click="categoryForm.icon = item.icon"
                    :class="categoryForm.icon === item.icon ? 'bg-brand-primary text-white border-brand-primary' : 'bg-surface text-brand-secondary border-brand-primary/20'"
                    class="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border text-xs font-bold transition-all hover:border-brand-primary cursor-pointer"
                  >
                    <Icon :name="item.icon" class="w-3.5 h-3.5" />
                    <span>{{ item.label }}</span>
                  </button>
                </div>
                <input
                  id="cat-icon"
                  v-model="categoryForm.icon"
                  type="text"
                  placeholder="lucide:cake"
                  class="w-full px-4 py-2 rounded-xl border border-brand-primary/20 bg-brand-cream/30 text-xs font-mono text-brand-secondary focus-visible:ring-2 focus-visible:ring-brand-primary"
                />
              </div>

              <div class="grid grid-cols-2 gap-4">
                <div>
                  <label for="cat-order" class="block text-xs font-bold text-brand-primary uppercase tracking-wider mb-1">Orden (#)</label>
                  <input
                    id="cat-order"
                    v-model.number="categoryForm.sort_order"
                    type="number"
                    min="0"
                    class="w-full px-4 py-2.5 rounded-xl border border-brand-primary/20 bg-brand-cream/30 text-sm font-bold text-brand-secondary focus-visible:ring-2 focus-visible:ring-brand-primary"
                  />
                </div>
                <div class="flex items-center gap-2 pt-6">
                  <input
                    id="cat-active"
                    v-model="categoryForm.is_active"
                    type="checkbox"
                    class="w-4 h-4 rounded text-brand-primary focus:ring-brand-primary accent-brand-primary cursor-pointer"
                  />
                  <label for="cat-active" class="text-xs font-bold text-brand-secondary select-none cursor-pointer">Visible en la carta</label>
                </div>
              </div>

              <div class="pt-4 flex items-center justify-end gap-3 border-t border-brand-primary/10">
                <button
                  @click="closeModal"
                  type="button"
                  class="px-5 py-2.5 rounded-full border border-brand-primary/20 text-xs font-bold text-brand-secondary hover:bg-brand-cream transition-colors cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  :disabled="isSubmitting"
                  class="px-6 py-2.5 rounded-full bg-brand-primary hover:bg-brand-secondary text-white text-xs font-bold transition-all shadow-soft-sm disabled:opacity-50 cursor-pointer"
                >
                  {{ isSubmitting ? 'Guardando...' : (isEditing ? 'Guardar Cambios' : 'Crear Sección') }}
                </button>
              </div>
            </form>
          </div>
        </div>
      </Teleport>
    </ClientOnly>
  </div>
</template>
