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

  async function fetchProfile(userId?: string): Promise<UserProfile | null> {
    const supabaseUser = useSupabaseUser()
    const targetId = userId || user.value?.id || supabaseUser.value?.id
    if (!targetId) return null

    if (!user.value && supabaseUser.value) {
      user.value = supabaseUser.value as unknown as User
    }

    isLoading.value = true
    try {
      // 1. Intentar consultar vía endpoint seguro de servidor (evita bloqueos de RLS en SSR / reload)
      try {
        const response = await $fetch<{ success: boolean, data: UserProfile }>('/api/auth/profile')
        if (response?.data) {
          profile.value = response.data
          return response.data
        }
      } catch {
        // Continuar con fallback directo a Supabase cliente
      }

      const supabase = useSupabaseClient<Database>()
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', targetId)
        .maybeSingle()
        
      if (error) throw error
      if (data) {
        profile.value = data
        return data
      }
    } catch (err: unknown) {
      console.error('Error al obtener perfil de usuario:', err)
    } finally {
      isLoading.value = false
    }
    return profile.value
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

  function clearSession(): void {
    user.value = null
    profile.value = null
    addresses.value = []
  }

  function setUser(newUser: User | null): void {
    user.value = newUser
    if (newUser) {
      if (!profile.value || profile.value.id !== newUser.id) {
        fetchProfile(newUser.id)
      }
      fetchAddresses()
    } else {
      clearSession()
    }
  }

  // Sincronización automática en cliente con Supabase Auth
  let authListenerSubscribed = false

  async function initAuth(): Promise<void> {
    if (import.meta.client) {
      const supabase = useSupabaseClient<Database>()
      const supabaseUser = useSupabaseUser()
      
      // Sincronización inicial con el estado real de Supabase
      if (supabaseUser.value) {
        if (!user.value || user.value.id !== supabaseUser.value.id) {
          setUser(supabaseUser.value as unknown as User)
        } else if (!profile.value) {
          await fetchProfile(supabaseUser.value.id)
        }
      } else {
        // En recarga o hidratación, consultar getSession() antes de purgar sesión
        try {
          const { data: sessionData } = await supabase.auth.getSession()
          if (sessionData?.session?.user) {
            setUser(sessionData.session.user as unknown as User)
          } else if (!user.value) {
            clearSession()
          }
        } catch {
          if (!user.value) {
            clearSession()
          }
        }
      }

      // Escuchar cambios de autenticación en tiempo real
      if (!authListenerSubscribed) {
        authListenerSubscribed = true
        supabase.auth.onAuthStateChange((event, session) => {
          if (event === 'SIGNED_OUT' || !session?.user) {
            clearSession()
          } else if (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED' || event === 'USER_UPDATED' || event === 'INITIAL_SESSION') {
            setUser(session.user as unknown as User)
          }
        })
      }
    }
  }

  async function signOut(): Promise<void> {
    if (import.meta.client) {
      try {
        const supabase = useSupabaseClient<Database>()
        await supabase.auth.signOut()
      } catch (err) {
        console.error('Error al cerrar sesión en Supabase:', err)
      }
    }
    clearSession()
  }

  async function updateProfile(payload: { full_name?: string, phone?: string }): Promise<{ success: boolean, error?: string }> {
    if (!user.value?.id) return { success: false, error: 'Usuario no autenticado' }
    try {
      const supabase = useSupabaseClient<Database>()
      const updates: { full_name?: string, phone?: string, updated_at: string } = {
        updated_at: new Date().toISOString()
      }
      if (payload.full_name !== undefined) updates.full_name = payload.full_name.trim()
      if (payload.phone !== undefined) updates.phone = payload.phone.trim()

      const { data, error } = await supabase
        .from('profiles')
        .update(updates)
        .eq('id', user.value.id)
        .select()
        .single()

      if (error) throw error
      if (data) {
        profile.value = data
      }
      return { success: true }
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Error al actualizar perfil'
      console.error('Error al actualizar perfil:', err)
      return { success: false, error: message }
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
    clearSession,
    signOut,
    initAuth,
    fetchProfile,
    updateProfile,
    fetchAddresses,
    saveAddress,
    addAddress: saveAddress,
    updateAddress,
    deleteAddress
  }
}, {
  persist: true
})
