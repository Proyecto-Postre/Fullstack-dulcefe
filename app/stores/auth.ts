import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import type { User } from '@supabase/supabase-js'
import { useSupabaseClient, useSupabaseUser } from '#imports'
import type { Database } from '~/types/database.types'

export type UserProfile = Database['public']['Tables']['profiles']['Row']

export interface UserAddress {
  id: string
  profile_id: string
  label: string
  address_line: string
  is_default: boolean
  created_at: string
}

export interface SaveAddressInput {
  label: string
  address_line: string
  reference?: string
}

export interface AddressOperationResult {
  success: boolean
  error?: string
}

export const useAuthStore = defineStore('auth', () => {
  const user = ref<User | null>(null)
  const profile = ref<UserProfile | null>(null)
  const addresses = ref<UserAddress[]>([])
  const isLoading = ref<boolean>(false)

  const isLoggedIn = computed<boolean>(() => {
    return Boolean(user.value)
  })

  // 🔒 CIERRE DE VULNERABILIDAD S5:
  // Solo se otorga rol de administrador si la base de datos PostgreSQL indica is_admin === true.
  // Se prohíbe terminantemente evaluar user_metadata o app_metadata del JWT.
  const isAdmin = computed<boolean>(() => {
    if (!user.value || !profile.value) return false
    return profile.value.is_admin === true
  })

  async function fetchProfile(): Promise<void> {
    if (!user.value?.id) return
    isLoading.value = true
    try {
      const supabase = useSupabaseClient<Database>()
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.value.id)
        .single()
        
      if (error) throw error
      profile.value = data
    } catch (err: unknown) {
      console.error('Error al obtener perfil de usuario:', err)
    } finally {
      isLoading.value = false
    }
  }

  async function fetchAddresses(): Promise<void> {
    if (!user.value?.id) return
    try {
      const supabase = useSupabaseClient<Database>()
      const { data, error } = await supabase
        .from('addresses')
        .select('*')
        .eq('profile_id', user.value.id)
        .order('created_at', { ascending: false })
        
      if (error) throw error
      addresses.value = (data as UserAddress[]) || []
    } catch (err: unknown) {
      console.error('Error al obtener direcciones:', err)
    }
  }

  async function saveAddress(address: SaveAddressInput): Promise<AddressOperationResult> {
    if (!user.value?.id) return { success: false, error: 'Usuario no autenticado' }
    try {
      const supabase = useSupabaseClient<Database>()
      const { data, error } = await supabase
        .from('addresses')
        .insert({
          profile_id: user.value.id,
          label: address.label,
          address_line: address.address_line + (address.reference ? ` (Ref: ${address.reference})` : '')
        })
        .select()
        .single()
        
      if (error) throw error
      if (data) {
        addresses.value.unshift(data as UserAddress)
      }
      return { success: true }
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Error desconocido al guardar dirección'
      console.error('Error guardando dirección:', err)
      return { success: false, error: message }
    }
  }

  async function updateAddress(id: string, address: SaveAddressInput): Promise<AddressOperationResult> {
    if (!user.value?.id) return { success: false, error: 'Usuario no autenticado' }
    try {
      const supabase = useSupabaseClient<Database>()
      const { data, error } = await supabase
        .from('addresses')
        .update({
          label: address.label,
          address_line: address.address_line + (address.reference ? ` (Ref: ${address.reference})` : '')
        })
        .eq('id', id)
        .select()
        .single()
        
      if (error) throw error
      if (data) {
        const idx = addresses.value.findIndex(a => a.id === id)
        if (idx !== -1) {
          addresses.value[idx] = data as UserAddress
        }
      }
      return { success: true }
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Error desconocido al actualizar dirección'
      console.error('Error actualizando dirección:', err)
      return { success: false, error: message }
    }
  }

  async function deleteAddress(id: string): Promise<AddressOperationResult> {
    if (!user.value?.id) return { success: false, error: 'Usuario no autenticado' }
    try {
      const supabase = useSupabaseClient<Database>()
      const { error } = await supabase
        .from('addresses')
        .delete()
        .eq('id', id)
        
      if (error) throw error
      addresses.value = addresses.value.filter(a => a.id !== id)
      return { success: true }
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Error desconocido al eliminar dirección'
      console.error('Error eliminando dirección:', err)
      return { success: false, error: message }
    }
  }

  function setUser(newUser: User | null): void {
    user.value = newUser
    if (newUser) {
      fetchProfile()
      fetchAddresses()
    } else {
      profile.value = null
      addresses.value = []
    }
  }

  // Sincronización automática en cliente si existe sesión
  function initAuth(): void {
    if (import.meta.client) {
      const supabaseUser = useSupabaseUser()
      if (supabaseUser.value && !user.value) {
        setUser(supabaseUser.value as unknown as User)
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
    addAddress: saveAddress,
    updateAddress,
    deleteAddress
  }
}, {
  persist: true
})
