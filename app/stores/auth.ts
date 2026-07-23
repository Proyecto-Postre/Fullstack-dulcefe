import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { useSupabaseClient } from '#imports'

export interface UserProfile {
  id: string
  full_name: string | null
  phone: string | null
  birth_date: string | null
  points: number
  is_admin: boolean
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

  async function fetchProfile() {
    if (!user.value) return
    isLoading.value = true
    try {
      const supabase = useSupabaseClient()
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.value.id)
        .single()
        
      if (error) throw error
      profile.value = data
    } catch (err) {
      console.error('Error fetching profile:', err)
    } finally {
      isLoading.value = false
    }
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
