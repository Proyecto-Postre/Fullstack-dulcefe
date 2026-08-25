import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { useSupabaseClient, useSupabaseUser } from '#imports'

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

  const isLoggedIn = computed(() => {
    return Boolean(user.value)
  })

  const isAdmin = computed(() => {
    if (!user.value) return false
    return Boolean(
      profile.value?.is_admin || 
      user.value?.user_metadata?.is_admin ||
      user.value?.app_metadata?.is_admin
    )
  })

  async function fetchProfile() {
    if (!user.value?.id) return
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
    if (!user.value?.id) return
    try {
      const supabase = useSupabaseClient()
      const { data, error } = await supabase
        .from('addresses')
        .select('*')
        .eq('profile_id', user.value.id)
        .order('created_at', { ascending: false })
        
      if (error) throw error
      addresses.value = data || []
    } catch (err) {
      console.error('Error fetching addresses:', err)
    }
  }

  async function saveAddress(address: { label: string, address_line: string, reference?: string }) {
    if (!user.value?.id) return
    try {
      const supabase = useSupabaseClient()
      const { data, error } = await supabase
        .from('addresses')
        .insert({
          profile_id: user.value.id,
          label: address.label,
          address_line: address.address_line + (address.reference ? ` (Ref: ${address.reference})` : '')
        } as any)
        .select()
        .single()
        
      if (error) throw error
      if (data) {
        addresses.value.unshift(data)
      }
      return { success: true }
    } catch (err: any) {
      console.error('Error saving address:', err)
      return { success: false, error: err.message }
    }
  }

  async function deleteAddress(id: string) {
    if (!user.value?.id) return
    try {
      const supabase = useSupabaseClient()
      const { error } = await supabase
        .from('addresses')
        .delete()
        .eq('id', id)
        
      if (error) throw error
      addresses.value = addresses.value.filter(a => a.id !== id)
      return { success: true }
    } catch (err: any) {
      console.error('Error deleting address:', err)
      return { success: false, error: err.message }
    }
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

  // Auto-sync on client initialization if session exists
  function initAuth() {
    if (import.meta.client) {
      const supabaseUser = useSupabaseUser()
      if (supabaseUser.value && !user.value) {
        setUser(supabaseUser.value)
      }
    }
  }

  return {
    user,
    profile,
    addresses,
    isLoading,
    isLoggedIn,
    isAdmin,
    setUser,
    initAuth,
    fetchProfile,
    fetchAddresses,
    saveAddress,
    deleteAddress
  }
}, {
  persist: true
})
