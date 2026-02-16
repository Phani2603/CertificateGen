import useSWR from 'swr'

export function useProfile() {
  const { data, error, isLoading, mutate } = useSWR('/api/profile')
  
  return {
    userData: data?.success ? data.user : null,
    isLoading,
    isError: error,
    mutate,
  }
}

export function useMyCertificates() {
  const { data, error, isLoading, mutate } = useSWR('/api/my-certificates')
  
  return {
    certificates: data?.success ? data.certificates : [],
    isLoading,
    isError: error,
    mutate,
  }
}

export function useDashboardStats() {
  const { data, error, isLoading, mutate } = useSWR('/api/dashboard/stats')
  
  return {
    stats: data?.success ? data : null,
    isLoading,
    isError: error,
    mutate,
  }
}

export function usePrivateOrg(orgSlug: string | null) {
  const { data, error, isLoading, mutate } = useSWR(
    orgSlug ? `/api/private-orgs/${orgSlug}` : null
  )
  
  return {
    orgData: data?.success ? data.organization : null,
    isLoading,
    isError: error,
    mutate,
  }
}

export function useOrgMembers(orgSlug: string | null) {
  const { data, error, isLoading, mutate } = useSWR(
    orgSlug ? `/api/private-orgs/${orgSlug}/members` : null
  )
  
  return {
    members: data?.success ? data.members : [],
    owner: data?.success ? data.owner : null,
    isLoading,
    isError: error,
    mutate,
  }
}

export function useOrgInvitations(orgSlug: string | null) {
  const { data, error, isLoading, mutate } = useSWR(
    orgSlug ? `/api/private-orgs/${orgSlug}/invite` : null
  )
  
  return {
    invitations: data?.success ? data.invitations : [],
    isLoading,
    isError: error,
    mutate,
  }
}

export function useOrgEvents(orgSlug: string | null) {
  const { data, error, isLoading, mutate } = useSWR(
    orgSlug ? `/api/private-orgs/${orgSlug}/events` : null
  )
  
  return {
    events: data?.success ? data.events : [],
    isLoading,
    isError: error,
    mutate,
  }
}

// Admin hooks
export function useAdminStats() {
  const { data, error, isLoading, mutate } = useSWR('/api/admin/stats')
  
  return {
    stats: data?.success ? data.stats : null,
    isLoading,
    isError: error,
    mutate,
  }
}

export function useAdminUsers(filters?: { page?: number; limit?: number; search?: string; userType?: string; status?: string }) {
  const params = new URLSearchParams()
  if (filters?.page) params.set('page', filters.page.toString())
  if (filters?.limit) params.set('limit', filters.limit.toString())
  if (filters?.search) params.set('search', filters.search)
  if (filters?.userType) params.set('userType', filters.userType)
  if (filters?.status) params.set('status', filters.status)
  
  const queryString = params.toString()
  const { data, error, isLoading, mutate } = useSWR(
    `/api/admin/users${queryString ? `?${queryString}` : ''}`
  )
  
  return {
    users: data?.success ? data.users : [],
    totalPages: data?.totalPages || 1,
    currentPage: data?.currentPage || 1,
    isLoading,
    isError: error,
    mutate,
  }
}

export function useAdminAccessRequests() {
  const { data, error, isLoading, mutate } = useSWR('/api/admin/access-requests')
  
  return {
    requests: data?.success ? data.requests : [],
    isLoading,
    isError: error,
    mutate,
  }
}

export function useAdminOrganizations(filters?: { page?: number; limit?: number; search?: string; type?: string }) {
  const params = new URLSearchParams()
  if (filters?.page) params.set('page', filters.page.toString())
  if (filters?.limit) params.set('limit', filters.limit.toString())
  if (filters?.search) params.set('search', filters.search)
  if (filters?.type) params.set('type', filters.type)
  
  const queryString = params.toString()
  const { data, error, isLoading, mutate } = useSWR(
    `/api/admin/organizations${queryString ? `?${queryString}` : ''}`
  )
  
  return {
    organizations: data?.success ? data.organizations : [],
    totalPages: data?.totalPages || 1,
    currentPage: data?.currentPage || 1,
    isLoading,
    isError: error,
    mutate,
  }
}

export function useAdminLogs(filters?: { page?: number; limit?: number; level?: string; source?: string }) {
  const params = new URLSearchParams()
  if (filters?.page) params.set('page', filters.page.toString())
  if (filters?.limit) params.set('limit', filters.limit.toString())
  if (filters?.level) params.set('level', filters.level)
  if (filters?.source) params.set('source', filters.source)
  
  const queryString = params.toString()
  const { data, error, isLoading, mutate } = useSWR(
    `/api/admin/logs${queryString ? `?${queryString}` : ''}`
  )
  
  return {
    logs: data?.success ? data.logs : [],
    totalPages: data?.totalPages || 1,
    currentPage: data?.currentPage || 1,
    isLoading,
    isError: error,
    mutate,
  }
}

export function useAdminSuspensionAppeals(status?: string) {
  const { data, error, isLoading, mutate } = useSWR(
    `/api/admin/suspension-appeals${status ? `?status=${status}` : ''}`
  )
  
  return {
    appeals: data?.success ? data.appeals : [],
    isLoading,
    isError: error,
    mutate,
  }
}

// Corporate dashboard specific hooks
export function useOrgEventsByOrgId(organizationId: string | null) {
  const { data, error, isLoading, mutate } = useSWR(
    organizationId ? `/api/events?privateOrgId=${organizationId}` : null
  )
  
  return {
    events: data?.success ? data.events : [],
    isLoading,
    isError: error,
    mutate,
  }
}

export function useOrgStats(organizationId: string | null) {
  const { data: eventsData, error: eventsError, isLoading: eventsLoading, mutate: mutateEvents } = useSWR(
    organizationId ? `/api/events?privateOrgId=${organizationId}` : null
  )
  
  const { data: historyData, error: historyError, isLoading: historyLoading, mutate: mutateHistory } = useSWR(
    organizationId ? `/api/history?privateOrgId=${organizationId}&limit=1000` : null
  )
  
  return {
    events: eventsData?.success ? eventsData.events : [],
    history: historyData?.success ? historyData.history : [],
    isLoading: eventsLoading || historyLoading,
    isError: eventsError || historyError,
    mutateEvents,
    mutateHistory,
  }
}

export function usePermissionRequests(organizationId: string | null) {
  const { data, error, isLoading, mutate } = useSWR(
    organizationId ? `/api/permission-requests?privateOrgId=${organizationId}&status=pending` : null
  )
  
  console.log('[usePermissionRequests]', {
    organizationId,
    data,
    error,
    isLoading,
    requests: data?.success ? data.requests : []
  })
  
  return {
    requests: data?.success ? data.requests : [],
    isLoading,
    isError: error,
    mutate,
  }
}

export function useActiveEvent(organizationId: string | null) {
  const { data, error, isLoading, mutate } = useSWR(
    organizationId ? `/api/history?privateOrgId=${organizationId}&limit=1` : null
  )
  
  return {
    activeEvent: data?.success && data.history?.length > 0 ? { eventName: data.history[0].eventName } : null,
    isLoading,
    isError: error,
    mutate,
  }
}
