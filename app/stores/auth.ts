import { defineStore } from 'pinia'
import { ref, computed } from 'vue'

export interface UserProfile {
  id: string
  full_name: string | null
  phone: string | null
  birth_date: string | null
  points: number
}

export interface UserAddress {
  id: string
  label: string
  address_line: string
  is_default: boolean
}

export const useAuthStore = defineStore('auth', () => {
  const user = ref<any>(null)
  const profile = ref<UserProfile | null>(null)
  const addresses = ref<UserAddress[]>([])
  const isLoading = ref(false)

  const isLoggedIn = computed(() => !!user.value)

  // TODO: Implement Supabase calls to fetch profile and addresses
  async function fetchProfile() {
    // Placeholder
  }

  async function fetchAddresses() {
    // Placeholder
  }

  function setUser(newUser: any) {
    user.value = newUser
    if (newUser) {
      fetchProfile()
      fetchAddresses()
    } else {
      profile.value = null
      addresses.value = []
    }
  }

  return {
    user,
    profile,
    addresses,
    isLoading,
    isLoggedIn,
    setUser,
    fetchProfile,
    fetchAddresses
  }
}, {
  persist: true
})
