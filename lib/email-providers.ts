/**
 * Email Provider Configuration
 * 
 * Follows SOLID principles:
 * - Single Responsibility: Each provider config holds only its own data
 * - Open/Closed: Easy to add new providers without modifying existing code
 * - Liskov Substitution: All providers follow same interface
 * - Interface Segregation: Clean provider interface
 * - Dependency Inversion: Depends on abstractions, not concrete implementations
 */

export interface EmailProvider {
  id: string
  name: string
  email: string
  displayName: string
  host?: string
  port?: number
  secure?: boolean
  description?: string
  envPrefix: string // Prefix for environment variables
  icon?: string
  color?: string
}

export interface EmailConfig {
  provider: EmailProvider
  apiKey?: string
  username?: string
  password?: string
  host?: string
  port?: number
}

/**
 * Available email providers
 */
export const EMAIL_PROVIDERS: EmailProvider[] = [
  {
    id: 'senement-forge',
    name: 'Senement Forge',
    email: 'forge@senement.com',
    displayName: 'Forge (Senement)',
    host: process.env.NEXT_PUBLIC_CORPORATE_EMAIL_HOST || 'smtp.secureserver.net', // GoDaddy SMTP
    port: parseInt(process.env.NEXT_PUBLIC_CORPORATE_EMAIL_PORT || '587'),
    secure: process.env.NEXT_PUBLIC_CORPORATE_EMAIL_SECURE === 'true', // false for STARTTLS on port 587
    description: 'Corporate email provider (GoDaddy)',
    envPrefix: 'CORPORATE_EMAIL',
    icon: '',
    color: '',
  },
  {
    id: 'gocertiflo-support',
    name: 'GoCertiflo Support',
    email: 'support@gocertiflo.com',
    displayName: 'Support (GoCertiflo)',
    host: process.env.NEXT_PUBLIC_GOCERTIFLO_SUPPORT_HOST || 'smtp.hostinger.com',
    port: parseInt(process.env.NEXT_PUBLIC_GOCERTIFLO_SUPPORT_PORT || '465'),
    secure: process.env.NEXT_PUBLIC_GOCERTIFLO_SUPPORT_SECURE !== 'false', // Default true for SSL
    description: 'Customer support and general correspondence',
    envPrefix: 'GOCERTIFLO_SUPPORT',
    icon: '',
    color: '',
  },
]

/**
 * Get provider by ID
 */
export function getProviderById(id: string): EmailProvider | undefined {
  return EMAIL_PROVIDERS.find(provider => provider.id === id)
}

/**
 * Get provider by email
 */
export function getProviderByEmail(email: string): EmailProvider | undefined {
  return EMAIL_PROVIDERS.find(provider => provider.email === email)
}

/**
 * Validate email provider configuration (SERVER-SIDE ONLY)
 * 
 * This function checks server-side environment variables and should only
 * be called from API routes or server components.
 * 
 * @param provider - Email provider to validate
 * @returns Validation result with missing variables list
 */
export function validateProviderConfig(provider: EmailProvider): {
  valid: boolean
  missingVars: string[]
} {
  const missingVars: string[] = []
  const prefix = provider.envPrefix

  // Check required environment variables (USER and PASSWORD)
  // HOST and PORT have defaults, so they're optional
  if (!process.env[`${prefix}_USER`]) {
    missingVars.push(`${prefix}_USER`)
  }
  if (!process.env[`${prefix}_PASSWORD`]) {
    missingVars.push(`${prefix}_PASSWORD`)
  }

  return {
    valid: missingVars.length === 0,
    missingVars,
  }
}

/**
 * Get email configuration for a provider
 * Note: This only returns non-sensitive data. Sensitive data (passwords, API keys) 
 * should be accessed server-side only.
 */
export function getEmailConfig(providerId: string): EmailConfig | null {
  const provider = getProviderById(providerId)
  if (!provider) return null

  return {
    provider,
    host: provider.host,
    port: provider.port,
  }
}
