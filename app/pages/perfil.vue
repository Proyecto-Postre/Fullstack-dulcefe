<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { navigateTo } from 'nuxt/app'
import { useAuthStore, type UserAddress } from '~/stores/auth'
import { useCartStore } from '~/stores/cart'
import type { ProfileAddressItem, ProfileTab } from '~/types/profile'
import { useProfileOrders } from '~/composables/useProfileOrders'
import ProfileHeader from '~/components/profile/ProfileHeader.vue'
import ProfileUserCard from '~/components/profile/ProfileUserCard.vue'
import ProfileNavTabs from '~/components/profile/ProfileNavTabs.vue'
import ProfileOrdersHistory from '~/components/profile/ProfileOrdersHistory.vue'
import ProfileAddressesList from '~/components/profile/ProfileAddressesList.vue'
import ProfileAddressModal from '~/components/profile/ProfileAddressModal.vue'
import ProfileLoyaltyTab from '~/components/profile/ProfileLoyaltyTab.vue'
import CustomerOrderDetailsModal from '~/components/CustomerOrderDetailsModal.vue'

const authStore = useAuthStore()
const cartStore = useCartStore()

// Redirigir si no está logueado
if (import.meta.client && !authStore.isLoggedIn) {
  navigateTo('/login', { replace: true })
}

const activeTab = ref<ProfileTab>('history')
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
  selectedOrder,
  showOrderDetailsModal,
  fetchOrders,
  openOrderDetails,
  closeOrderDetails,
  formatOrderDate,
  getStatusBadgeClass,
  getStatusLabel
} = useProfileOrders()

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
  <div class="max-w-5xl mx-auto py-10 px-6">
    <!-- Encabezado -->
    <ProfileHeader @logout="logout" />

    <div class="grid grid-cols-1 lg:grid-cols-12 gap-8">
      <!-- Sidebar (Usuario y Pestañas) -->
      <div class="lg:col-span-4 space-y-6">
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
        <div class="bg-surface border border-brand-primary/10 rounded-[2rem] p-8 shadow-soft-md min-h-[400px]">
          <!-- Pestaña Historial -->
          <ProfileOrdersHistory
            v-if="activeTab === 'history'"
            :orders="orders"
            :is-loading="isLoadingOrders"
            :format-date="formatOrderDate"
            :get-status-badge="getStatusBadgeClass"
            :get-status-label="getStatusLabel"
            @select-order="openOrderDetails"
          />

          <!-- Pestaña Direcciones -->
          <ProfileAddressesList
            v-if="activeTab === 'addresses'"
            :addresses="authStore.addresses"
            :is-deleting-id="isDeletingAddressId"
            @new-address="openNewAddressModal"
            @edit-address="openEditAddressModal"
            @delete-address="handleDeleteAddress"
          />

          <!-- Pestaña Puntos -->
          <ProfileLoyaltyTab
            v-if="activeTab === 'points'"
            :points="authStore.profile?.points || 0"
          />
        </div>
      </div>
    </div>

    <!-- Modales -->
    <CustomerOrderDetailsModal 
      :show="showOrderDetailsModal" 
      :order="selectedOrder" 
      @close="closeOrderDetails" 
    />

    <ProfileAddressModal
      :show="showAddressModal"
      :address="newAddress"
      :is-saving="isSavingAddress"
      @close="showAddressModal = false"
      @save="handleSaveAddress"
    />
  </div>
</template>
