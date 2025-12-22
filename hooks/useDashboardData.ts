import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'

export function useDashboardData() {
  const { data: session, status } = useSession()
  const [loading, setLoading] = useState(true)
  const [profile, setProfile] = useState<any>(null)
  const [organization, setOrganization] = useState<any>(null)
  const [clubs, setClubs] = useState<any[]>([])
  const [userClubIds, setUserClubIds] = useState<string[]>([])
  const [events, setEvents] = useState<Record<string, any[]>>({})
  const [history, setHistory] = useState<any[]>([])
  const [pagination, setPagination] = useState({
    currentPage: 1,
    totalPages: 1,
    totalItems: 0,
    hasNextPage: false,
    hasPrevPage: false,
  })

  const fetchProfile = async () => {
    try {
      const res = await fetch('/api/profile')
      const data = await res.json()
      console.log('[useDashboardData] Profile response:', data)
      if (data.success) {
        setProfile(data.user)
        setOrganization(data.user.organization)
        console.log('[useDashboardData] Organization set to:', data.user.organization)
      }
    } catch (error) {
      console.error('Failed to fetch profile:', error)
    }
  }

  const fetchClubs = async () => {
    try {
      const res = await fetch('/api/clubs')
      const data = await res.json()
      if (data.success) {
        setClubs(data.clubs)
        setUserClubIds(data.userClubs || [])
      }
    } catch (error) {
      console.error('Failed to fetch clubs:', error)
    }
  }

  const fetchEvents = async (clubId?: string) => {
    try {
      const url = clubId ? `/api/events?clubId=${clubId}` : '/api/events'
      const res = await fetch(url)
      const data = await res.json()
      if (data.success) {
        setEvents(data.events)
      }
    } catch (error) {
      console.error('Failed to fetch events:', error)
    }
  }

  // Fetch events for all clubs in organization (not just user's clubs)
  const fetchAllClubEvents = async () => {
    try {
      // Fetch events for each club
      const res = await fetch('/api/clubs')
      const clubsData = await res.json()
      if (clubsData.success && clubsData.clubs.length > 0) {
        const allEvents: Record<string, any[]> = {}
        
        // Fetch events for each club in parallel
        await Promise.all(
          clubsData.clubs.map(async (club: any) => {
            const clubId = club._id.toString()
            const eventsRes = await fetch(`/api/events?clubId=${clubId}`)
            const eventsData = await eventsRes.json()
            if (eventsData.success && eventsData.events[clubId]) {
              allEvents[clubId] = eventsData.events[clubId]
            }
          })
        )
        
        setEvents(allEvents)
      }
    } catch (error) {
      console.error('Failed to fetch all club events:', error)
    }
  }

  const fetchHistory = async (page = 1, limit = 10) => {
    try {
      const res = await fetch(`/api/history?page=${page}&limit=${limit}`)
      const data = await res.json()
      if (data.success) {
        setHistory(data.history)
        setPagination(data.pagination)
      }
    } catch (error) {
      console.error('Failed to fetch history:', error)
    }
  }

  const createOrganization = async (orgData: any) => {
    try {
      const res = await fetch('/api/organizations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'create', ...orgData }),
      })
      const data = await res.json()
      if (data.success) {
        // Normalize organization format to match profile API
        const normalizedOrg = {
          id: data.organization._id || data.organization.id,
          name: data.organization.name,
          logoUrl: data.organization.logoUrl,
        }
        setOrganization(normalizedOrg)
        // Refresh clubs and events after creating organization
        await fetchClubs()
        await fetchAllClubEvents()
      }
      return data
    } catch (error) {
      console.error('Failed to create organization:', error)
      return { success: false, error: 'Failed to create organization' }
    }
  }

  const joinOrganization = async (organizationId: string) => {
    try {
      const res = await fetch('/api/organizations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'join', organizationId }),
      })
      const data = await res.json()
      if (data.success) {
        // Normalize organization format to match profile API
        const normalizedOrg = {
          id: data.organization._id || data.organization.id,
          name: data.organization.name,
          logoUrl: data.organization.logoUrl,
        }
        setOrganization(normalizedOrg)
        // Refresh clubs and events after joining organization
        await fetchClubs()
        await fetchAllClubEvents()
      }
      return data
    } catch (error) {
      console.error('Failed to join organization:', error)
      return { success: false, error: 'Failed to join organization' }
    }
  }

  const createClub = async (clubData: any) => {
    try {
      const res = await fetch('/api/clubs', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'create', ...clubData }),
      })
      const data = await res.json()
      if (data.success) {
        await fetchClubs()
      }
      return data
    } catch (error) {
      console.error('Failed to create club:', error)
      return { success: false, error: 'Failed to create club' }
    }
  }

  const joinClub = async (clubId: string) => {
    try {
      const res = await fetch('/api/clubs', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'join', clubId }),
      })
      const data = await res.json()
      if (data.success) {
        await fetchClubs()
      }
      return data
    } catch (error) {
      console.error('Failed to join club:', error)
      return { success: false, error: 'Failed to join club' }
    }
  }

  const createEvent = async (eventData: any) => {
    try {
      const res = await fetch('/api/events', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(eventData),
      })
      const data = await res.json()
      if (data.success) {
        await fetchAllClubEvents() // Refresh all club events
      }
      return data
    } catch (error) {
      console.error('Failed to create event:', error)
      return { success: false, error: 'Failed to create event' }
    }
  }

  const addHistoryEntry = async (historyData: any) => {
    try {
      const res = await fetch('/api/history', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(historyData),
      })
      const data = await res.json()
      if (data.success) {
        await fetchHistory(pagination.currentPage)
      }
      return data
    } catch (error) {
      console.error('Failed to add history entry:', error)
      return { success: false, error: 'Failed to add history entry' }
    }
  }

  const updateProfile = async (profileData: any) => {
    try {
      const res = await fetch('/api/profile', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(profileData),
      })
      const data = await res.json()
      if (data.success) {
        await fetchProfile()
      }
      return data
    } catch (error) {
      console.error('Failed to update profile:', error)
      return { success: false, error: 'Failed to update profile' }
    }
  }
  const leaveOrganization = async () => {
    try {
      const res = await fetch('/api/organizations', {
        method: 'DELETE',
      })
      const data = await res.json()
      if (data.success) {
        setOrganization(null)
        await fetchProfile()
        await fetchClubs() // Clear clubs when leaving organization
      }
      return data
    } catch (error) {
      console.error('Failed to leave organization:', error)
      return { success: false, error: 'Failed to leave organization' }
    }
  }

  const leaveClub = async (clubId: string) => {
    try {
      const res = await fetch(`/api/clubs?clubId=${clubId}`, {
        method: 'DELETE',
      })
      const data = await res.json()
      if (data.success) {
        await fetchClubs()
      }
      return data
    } catch (error) {
      console.error('Failed to leave club:', error)
      return { success: false, error: 'Failed to leave club' }
    }
  }
  useEffect(() => {
    const loadData = async () => {
      // Only load data if user is authenticated
      if (status !== 'authenticated') {
        setLoading(false)
        return
      }

      setLoading(true)
      try {
        // Fetch all data in parallel for faster loading
        await Promise.all([
          fetchProfile(),
          fetchClubs(),
          fetchHistory()
        ])
        // Fetch events after clubs are loaded
        await fetchAllClubEvents()
      } catch (error) {
        console.error('[useDashboardData] Error loading data:', error)
      } finally {
        setLoading(false)
      }
    }

    loadData()
  }, [status]) // Re-run when authentication status changes

  return {
    loading,
    profile,
    organization,
    clubs,
    userClubIds,
    events,
    history,
    pagination,
    fetchProfile,
    fetchClubs,
    fetchEvents,
    fetchAllClubEvents,
    fetchHistory,
    createOrganization,
    joinOrganization,
    createClub,
    joinClub,
    createEvent,
    addHistoryEntry,
    updateProfile,
    leaveOrganization,
    leaveClub,
  }
}
