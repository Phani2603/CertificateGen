import { useState, useEffect, useCallback } from 'react'
import { 
  encryptCredentials, 
  decryptCredentials, 
  clearCredentials, 
  hasValidCredentials,
  validateCredentials 
} from '@/utils/secure-storage'

interface CredentialState {
  isAuthenticated: boolean
  email: string | null
  isLoading: boolean
  error: string | null
  isValidating: boolean
}

interface UseCredentialsReturn extends CredentialState {
  login: (email: string, appPassword: string) => Promise<boolean>
  logout: () => void
  checkCredentials: () => Promise<void>
  clearError: () => void
}

export function useCredentials(): UseCredentialsReturn {
  const [state, setState] = useState<CredentialState>({
    isAuthenticated: false,
    email: null,
    isLoading: true,
    error: null,
    isValidating: false
  })

  // Check for existing credentials on mount
  const checkCredentials = useCallback(async () => {
    try {
      setState(prev => ({ ...prev, isLoading: true, error: null }))
      
      const credentials = await decryptCredentials()
      if (credentials) {
        setState(prev => ({
          ...prev,
          isAuthenticated: true,
          email: credentials.email,
          isLoading: false
        }))
        console.log('[useCredentials] Restored credentials for:', credentials.email)
      } else {
        setState(prev => ({
          ...prev,
          isAuthenticated: false,
          email: null,
          isLoading: false
        }))
      }
    } catch (error) {
      console.error('[useCredentials] Error checking credentials:', error)
      setState(prev => ({
        ...prev,
        isAuthenticated: false,
        email: null,
        isLoading: false,
        error: 'Failed to check stored credentials'
      }))
    }
  }, [])

  // Login with email and app password
  const login = useCallback(async (email: string, appPassword: string): Promise<boolean> => {
    try {
      setState(prev => ({ 
        ...prev, 
        isValidating: true, 
        error: null,
        isLoading: true 
      }))

      // Validate input format
      if (!email || !appPassword) {
        setState(prev => ({ 
          ...prev, 
          error: 'Email and app password are required',
          isValidating: false,
          isLoading: false
        }))
        return false
      }

      // Test credentials with server
      console.log('[useCredentials] Validating credentials for:', email)
      console.log('[useCredentials] Password length:', appPassword.length)
      console.log('[useCredentials] Password (first 4):', appPassword.substring(0, 4))
      const isValid = await validateCredentials(email, appPassword)
      
      if (!isValid) {
        setState(prev => ({ 
          ...prev, 
          error: 'Invalid email or app password. Please check your credentials.',
          isValidating: false,
          isLoading: false
        }))
        return false
      }

      // Encrypt and store credentials
      await encryptCredentials(email, appPassword)
      
      setState(prev => {
        const newState = {
          ...prev,
          isAuthenticated: true,
          email: email.trim().toLowerCase(),
          isValidating: false,
          isLoading: false,
          error: null
        }
        console.log('[useCredentials] Setting new state:', newState)
        return newState
      })

      console.log('[useCredentials] Successfully authenticated:', email)
      return true

    } catch (error) {
      console.error('[useCredentials] Login error:', error)
      
      let errorMessage = 'Authentication failed. Please try again.'
      
      if (error instanceof Error) {
        if (error.message.includes('fetch')) {
          errorMessage = 'Network error. Please check your connection.'
        } else if (error.message.includes('Gmail')) {
          errorMessage = 'Invalid Gmail credentials or connection failed.'
        } else {
          errorMessage = error.message
        }
      }

      setState(prev => ({
        ...prev,
        isAuthenticated: false,
        email: null,
        isValidating: false,
        isLoading: false,
        error: errorMessage
      }))

      return false
    }
  }, [])

  // Logout and clear credentials
  const logout = useCallback(() => {
    try {
      clearCredentials()
      setState({
        isAuthenticated: false,
        email: null,
        isLoading: false,
        error: null,
        isValidating: false
      })
      console.log('[useCredentials] Logged out successfully')
    } catch (error) {
      console.error('[useCredentials] Logout error:', error)
    }
  }, [])

  // Clear error state
  const clearError = useCallback(() => {
    setState(prev => ({ ...prev, error: null }))
  }, [])

  // Check credentials on mount
  useEffect(() => {
    checkCredentials()
  }, [checkCredentials])

  // Auto-logout on page visibility change (optional security measure)
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.hidden) {
        // Optional: Auto-logout when tab becomes hidden
        // logout()
      }
    }

    document.addEventListener('visibilitychange', handleVisibilityChange)
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange)
    }
  }, [logout])

  return {
    ...state,
    login,
    logout,
    checkCredentials,
    clearError
  }
}