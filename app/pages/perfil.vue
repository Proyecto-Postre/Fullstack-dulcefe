<script setup lang="ts">
import { ref, onMounted, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { navigateTo } from 'nuxt/app'
import { useAuthStore, type UserAddress } from '~/stores/auth'
import { useCartStore } from '~/stores/cart'
import { toast } from 'vue-sonner'
import type { ProfileAddressItem, ProfileTab, ProfileOrder } from '~/types/profile'
import { useProfileOrders } from '~/composables/useProfileOrders'
import ProfileHeader from '~/components/profile/ProfileHeader.vue'
import ProfileUserCard from '~/components/profile/ProfileUserCard.vue'
import ProfileNavTabs from '~/components/profile/ProfileNavTabs.vue'
import ProfilePersonalTab from '~/components/profile/ProfilePersonalTab.vue'
import ProfileOrdersHistory from '~/components/profile/ProfileOrdersHistory.vue'
import ProfileAddressesList from '~/components/profile/ProfileAddressesList.vue'
import ProfileAddressModal from '~/components/profile/ProfileAddressModal.vue'

const authStore = useAuthStore()
const cartStore = useCartStore()
const route = useRoute()
const router = useRouter()

// Redirigir si no está logueado
if (import.meta.client && !authStore.isLoggedIn) {
  navigateTo('/login', { replace: true })
}

const TAB_MAPPING: Record<string, ProfileTab> = {
  personal: 'personal',
  datos: 'personal',
  perfil: 'personal',
  pedidos: 'history',
  history: 'history',
  orders: 'history',
  direcciones: 'addresses',
  addresses: 'addresses'
}

const TAB_TO_QUERY: Record<ProfileTab, string> = {
  personal: 'personal',
  history: 'pedidos',
  addresses: 'direcciones',
  points: 'personal'
}

// Determinar tab inicial desde la URL o defecto 'personal' (Datos Personales primero)
const queryTab = route.query.tab as string | undefined
const initialTab: ProfileTab = queryTab && TAB_MAPPING[queryTab] ? TAB_MAPPING[queryTab] : 'personal'
const activeTab = ref<ProfileTab>(initialTab)

// Sincronizar cambios en activeTab con la URL sin recargar pantalla (SPA pushState)
watch(activeTab, (newTab) => {
  const targetQuery = TAB_TO_QUERY[newTab]
  if (route.query.tab !== targetQuery) {
    if (newTab === 'personal') {
      const { tab: _, ...rest } = route.query
      router.push({ query: rest })
    } else {
      router.push({ query: { ...route.query, tab: targetQuery } })
    }
  }
})

// Responder cuando el usuario hace clic en enlaces del header o usa botones Atrás/Adelante
watch(() => route.query.tab, (newQuery) => {
  if (typeof newQuery === 'string' && TAB_MAPPING[newQuery]) {
    const matched = TAB_MAPPING[newQuery]
    if (activeTab.value !== matched) {
      activeTab.value = matched
    }
  } else if (!newQuery && activeTab.value !== 'personal') {
    activeTab.value = 'personal'
  }
})
const showAddressModal = ref(false)

const newAddress = ref<ProfileAddressItem>({
  id: '',
  label: '',
  address_line: '',
  reference: ''
})
const isSavingAddress = ref(false)
const isDeletingAddressId = ref<string | null>(null)

// Composable de Pedidos
const {
  orders,
  isLoading: isLoadingOrders,
  fetchOrders,
  formatOrderDate,
  getStatusBadgeClass,
  getStatusLabel,
  getStatusIcon,
  isOrderActive
} = useProfileOrders()

const handleRepeatOrder = (order: ProfileOrder) => {
  if (!order.order_items || order.order_items.length === 0) {
    toast.error('No se encontraron productos para reordenar en este pedido.')
    return
  }

  let addedCount = 0
  for (const item of order.order_items) {
    const productId = item.products?.id || item.product_id || item.id
    const productName = item.products?.name || 'Postre Dulce Fe'
    const productPrice = item.products?.price ?? item.price_at_time
    const imageUrl = item.products?.image_url || null

    if (productId) {
      cartStore.addToCart({
        id: productId,
        name: productName,
        price: Number(productPrice) || 0,
        image_url: imageUrl
      }, item.quantity || 1)
      addedCount++
    }
  }

  if (addedCount > 0) {
    toast.success(`¡Se agregaron ${addedCount} postre(s) al carrito!`)
    cartStore.openDrawer()
  } else {
    toast.error('No se pudo reordenar los productos seleccionados.')
  }
}

const openNewAddressModal = () => {
  newAddress.value = { id: '', label: '', address_line: '', reference: '' }
  showAddressModal.value = true
}

const openEditAddressModal = (address: UserAddress) => {
  let addressLine = address.address_line || ''
  let reference = ''
  const refMatch = addressLine.match(/ \(Ref: (.*?)\)$/)
  if (refMatch && refMatch[1] && refMatch[0]) {
    reference = refMatch[1]
    addressLine = addressLine.replace(refMatch[0], '')
  }

  newAddress.value = {
    id: address.id,
    label: address.label,
    address_line: addressLine,
    reference: reference
  }
  showAddressModal.value = true
}

const handleDeleteAddress = async (id: string) => {
  if (!confirm('¿Estás seguro de que deseas eliminar esta dirección?')) return
  
  isDeletingAddressId.value = id
  const result = await authStore.deleteAddress(id)
  isDeletingAddressId.value = null
  
  if (!result?.success) {
    alert('Error al eliminar la dirección: ' + result?.error)
  }
}

const handleSaveAddress = async () => {
  if (!newAddress.value.label || !newAddress.value.address_line) return
  
  isSavingAddress.value = true
  
  if (newAddress.value.id) {
    await authStore.updateAddress(newAddress.value.id, {
      label: newAddress.value.label,
      address_line: newAddress.value.address_line,
      reference: newAddress.value.reference
    })
  } else {
    await authStore.addAddress({
      label: newAddress.value.label,
      address_line: newAddress.value.address_line,
      reference: newAddress.value.reference
    })
  }
  
  isSavingAddress.value = false
  showAddressModal.value = false
}

const logout = async () => {
  await authStore.signOut()
  cartStore.clearCart()
  navigateTo('/login')
}

onMounted(() => {
  if (authStore.isLoggedIn) {
    authStore.fetchAddresses()
    fetchOrders()
  }
})
</script>

<template>
  <div class="max-w-5xl mx-auto py-6 sm:py-10 px-3.5 sm:px-6 flex-1 w-full min-h-[calc(100vh-14rem)] flex flex-col justify-start">
    <!-- Encabezado -->
    <ProfileHeader @logout="logout" />

    <div class="grid grid-cols-1 lg:grid-cols-12 gap-5 sm:gap-6 lg:gap-8 flex-1 items-start">
      <!-- Sidebar (Usuario y Pestañas) - Sticky en Desktop, fluida en Mobile -->
      <div class="lg:col-span-4 space-y-3 sm:space-y-4 lg:space-y-6 lg:sticky lg:top-24">
        <ProfileUserCard 
          :user="authStore.user" 
          :profile="authStore.profile" 
        />
        <ProfileNavTabs 
          :active-tab="activeTab" 
          @update:active-tab="activeTab = $event" 
        />
      </div>

      <!-- Contenido Principal -->
      <div class="lg:col-span-8">
        <div class="bg-surface border border-brand-primary/10 rounded-3xl sm:rounded-[2rem] p-4 sm:p-8 shadow-soft-md min-h-[380px] sm:min-h-[420px]">
          <!-- Pestaña 1: Datos Personales (FIRST!) -->
          <ProfilePersonalTab
            v-if="activeTab === 'personal'"
          />

          <!-- Pestaña 2: Historial de Pedidos -->
          <ProfileOrdersHistory
            v-else-if="activeTab === 'history'"
            :orders="orders"
            :is-loading="isLoadingOrders"
            :format-date="formatOrderDate"
            :get-status-badge="getStatusBadgeClass"
            :get-status-label="getStatusLabel"
            :get-status-icon="getStatusIcon"
            :is-order-active="isOrderActive"
            @repeat-order="handleRepeatOrder"
          />

          <!-- Pestaña 3: Mis Direcciones -->
          <ProfileAddressesList
            v-else-if="activeTab === 'addresses'"
            :addresses="authStore.addresses"
            :is-deleting-id="isDeletingAddressId"
            @new-address="openNewAddressModal"
            @edit-address="openEditAddressModal"
            @delete-address="handleDeleteAddress"
          />
        </div>
      </div>
    </div>

    <!-- Modales -->
    <ProfileAddressModal
      :show="showAddressModal"
      :address="newAddress"
      :is-saving="isSavingAddress"
      @close="showAddressModal = false"
      @save="handleSaveAddress"
    />
  </div>
</template>
