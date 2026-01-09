"use client"

import { useEffect, useState } from "react"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Mail, Plus, UserPlus, Clock, CheckCircle, XCircle, Users, Shield } from "lucide-react"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { useIslandAlerts } from "@/components/ui/island-alerts"

interface Invitation {
  _id: string
  email: string
  status: "pending" | "accepted" | "rejected" | "expired"
  invitedBy: string
  createdAt: string
  expiresAt: string
}

interface Member {
  _id: string
  name: string
  email: string
  image?: string
}

interface InvitationsSectionProps {
  organizationId: string
  organizationSlug: string
  isOwner: boolean
}

export function InvitationsSection({ organizationId, organizationSlug, isOwner }: InvitationsSectionProps) {
  const [invitations, setInvitations] = useState<Invitation[]>([])
  const [members, setMembers] = useState<Member[]>([])
  const [owner, setOwner] = useState<Member | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [showInviteForm, setShowInviteForm] = useState(false)
  const [inviteEmail, setInviteEmail] = useState("")
  const [isSending, setIsSending] = useState(false)
  const { show } = useIslandAlerts()

  console.log('[InvitationsSection] Props:', { organizationId, organizationSlug, isOwner })

  useEffect(() => {
    if (organizationSlug) {
      fetchData()
    }
  }, [organizationSlug])

  const fetchData = async () => {
    setIsLoading(true)
    try {
      await Promise.all([fetchInvitations(), fetchMembers()])
    } catch (error) {
      console.error('Error fetching data:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const fetchInvitations = async () => {
    try {
      const response = await fetch(`/api/private-orgs/${organizationSlug}/invite`)
      const data = await response.json()
      if (data.success) {
        setInvitations(data.invitations || [])
      }
    } catch (error) {
      console.error('Error fetching invitations:', error)
    }
  }

  const fetchMembers = async () => {
    try {
      const response = await fetch(`/api/private-orgs/${organizationSlug}/members`)
      const data = await response.json()
      if (data.success) {
        setMembers(data.members || [])
        setOwner(data.owner)
      }
    } catch (error) {
      console.error('Error fetching members:', error)
    }
  }

  const handleSendInvitation = async () => {
    if (!inviteEmail) return

    console.log('[Invite] Sending invitation to:', inviteEmail)
    console.log('[Invite] Organization slug:', organizationSlug)
    setIsSending(true)
    try {
      const response = await fetch(`/api/private-orgs/${organizationSlug}/invite`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: inviteEmail,
        }),
      })

      const data = await response.json()
      console.log('[Invite] Response:', data)

      if (data.success) {
        setInviteEmail("")
        setShowInviteForm(false)
        fetchInvitations()
        show({
          title: 'Invite email sent',
          description: `Delivered to ${inviteEmail}`,
          tone: 'success'
        })
      } else {
        show({
          title: 'Invite failed',
          description: data.error || 'Failed to send invitation',
          tone: 'error'
        })
      }
    } catch (error) {
      console.error('Error sending invitation:', error)
      show({
        title: 'Something went wrong',
        description: 'Unable to send invite right now',
        tone: 'error'
      })
    } finally {
      setIsSending(false)
    }
  }

  const handleResendInvitation = async (invitationId: string) => {
    if (!confirm('Resend invitation email?')) return
    setIsSending(true)
    try {
      const response = await fetch(`/api/private-orgs/${organizationSlug}/invite/resend`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ invitationId }),
      })

      const data = await response.json()

      if (data.success) {
        show({
          title: 'Invite resent',
          description: 'We re-delivered the invitation email.',
          tone: 'success'
        })
        fetchInvitations()
      } else {
        show({
          title: 'Resend failed',
          description: data.error || 'Failed to resend invitation',
          tone: 'error'
        })
      }
    } catch (error) {
      console.error('Error resending invitation:', error)
      show({
        title: 'Something went wrong',
        description: 'Unable to resend invite right now',
        tone: 'error'
      })
    } finally {
      setIsSending(false)
    }
  }

  const handleRemoveMember = async (memberId: string) => {
    if (!confirm('Are you sure you want to remove this member from the organization?')) return

    try {
      const response = await fetch(`/api/private-orgs/${organizationSlug}/members`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ memberId }),
      })

      const data = await response.json()

      if (data.success) {
        show({
          title: 'Member removed',
          description: 'The user no longer has access.',
          tone: 'info'
        })
        fetchMembers()
      } else {
        show({
          title: 'Remove failed',
          description: data.error || 'Failed to remove member',
          tone: 'error'
        })
      }
    } catch (error) {
      console.error('Error removing member:', error)
      show({
        title: 'Something went wrong',
        description: 'Unable to remove this member right now',
        tone: 'error'
      })
    }
  }

  const handleTransferOwnership = async (newOwnerId: string) => {
    if (!confirm('Are you sure you want to transfer ownership? You will become a regular member.')) return

    try {
      const response = await fetch(`/api/private-orgs/${organizationSlug}/transfer-ownership`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ newOwnerId }),
      })

      const data = await response.json()

      if (data.success) {
        show({
          title: 'Ownership transferred',
          description: 'Reloading to reflect the new owner.',
          tone: 'info'
        })
        window.location.reload()
      } else {
        show({
          title: 'Transfer failed',
          description: data.error || 'Failed to transfer ownership',
          tone: 'error'
        })
      }
    } catch (error) {
      console.error('Error transferring ownership:', error)
      show({
        title: 'Something went wrong',
        description: 'Unable to transfer ownership right now',
        tone: 'error'
      })
    }
  }



  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'accepted':
        return <CheckCircle className="w-4 h-4 text-green-600" />
      case 'rejected':
        return <XCircle className="w-4 h-4 text-red-600" />
      case 'expired':
        return <Clock className="w-4 h-4 text-gray-400" />
      default:
        return <Clock className="w-4 h-4 text-yellow-600" />
    }
  }

  const getStatusText = (status: string) => {
    return status.charAt(0).toUpperCase() + status.slice(1)
  }

  return (
    <div className="space-y-8">
      {/* Members Section */}
      <div className="space-y-4">
        <div>
          <h2 className="text-2xl font-bold flex items-center gap-2">
            <Users className="w-6 h-6 text-[#21808D]" />
            Team Members
          </h2>
          <p className="text-sm text-gray-600 mt-1">
            People with access to this organization
          </p>
        </div>

        <Card className="divide-y">
          {/* Owner */}
          {owner && (
            <div className="p-4 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Avatar>
                  <AvatarImage src={owner.image} />
                  <AvatarFallback>{owner.name?.charAt(0) || 'O'}</AvatarFallback>
                </Avatar>
                <div>
                  <p className="font-medium text-gray-900">{owner.name}</p>
                  <p className="text-sm text-gray-500">{owner.email}</p>
                </div>
              </div>
              <div className="flex items-center gap-2 text-[#21808D] bg-[#21808D]/10 px-3 py-1 rounded-full">
                <Shield className="w-4 h-4" />
                <span className="text-xs font-medium">Owner</span>
              </div>
            </div>
          )}

          {/* Other Members */}
          {members.map((member) => (
            <div key={member._id} className="p-4 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Avatar>
                  <AvatarImage src={member.image} />
                  <AvatarFallback>{member.name?.charAt(0) || 'M'}</AvatarFallback>
                </Avatar>
                <div>
                  <p className="font-medium text-gray-900">{member.name}</p>
                  <p className="text-sm text-gray-500">{member.email}</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-gray-500 text-sm mr-2">Member</span>
                {isOwner && (
                  <>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleTransferOwnership(member._id)}
                      className="text-blue-600 hover:text-blue-700 hover:bg-blue-50"
                      title="Transfer ownership"
                    >
                      <Shield className="w-4 h-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleRemoveMember(member._id)}
                      className="text-red-600 hover:text-red-700 hover:bg-red-50"
                      title="Remove member"
                    >
                      <XCircle className="w-4 h-4" />
                    </Button>
                  </>
                )}
              </div>
            </div>
          ))}
        </Card>
      </div>

      {/* Invitations Section - Only visible to owner */}
      {isOwner && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-bold flex items-center gap-2">
                <UserPlus className="w-6 h-6 text-[#8FD6BD]" />
                Invitations
              </h2>
              <p className="text-sm text-gray-600 mt-1">
                Pending invitations to join your organization
              </p>
            </div>
            <Button 
              onClick={() => setShowInviteForm(!showInviteForm)}
              className="bg-[#8FD6BD] text-black hover:bg-[#7bc4ab]"
            >
              <Plus className="w-4 h-4 mr-2" />
              Invite Member
            </Button>
          </div>

          {showInviteForm && (
            <Card className="p-6">
              <div className="space-y-4">
                <div>
                  <label className="text-sm font-medium">Email Address</label>
                  <div className="flex gap-2 mt-2">
                    <Input
                      type="email"
                      placeholder="colleague@company.com"
                      value={inviteEmail}
                      onChange={(e) => setInviteEmail(e.target.value)}
                      className="flex-1"
                    />
                    <Button
                      onClick={handleSendInvitation}
                      disabled={isSending || !inviteEmail}
                      className="bg-[#21808D] hover:bg-[#1a6370]"
                    >
                      <Mail className="w-4 h-4 mr-2" />
                      {isSending ? 'Sending...' : 'Send'}
                    </Button>
                  </div>
                  <p className="text-xs text-gray-500 mt-2">
                    An invitation email will be sent to this address
                  </p>
                </div>
              </div>
            </Card>
          )}

          {isLoading ? (
            <Card className="p-8">
              <div className="flex items-center justify-center">
                <div className="text-center">
                  <div className="w-10 h-10 border-4 border-[#21808D] border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
                  <p className="text-gray-600">Loading invitations...</p>
                </div>
              </div>
            </Card>
          ) : invitations.length === 0 ? (
            <Card className="p-12">
              <div className="text-center">
                <Mail className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-gray-900 mb-2">No pending invitations</h3>
                <p className="text-gray-600">
                  Invite team members to collaborate on your organization
                </p>
              </div>
            </Card>
          ) : (
            <Card>
              <div className="divide-y">
                {invitations.map((invitation) => (
                  <div key={invitation._id} className="p-4 hover:bg-gray-50 transition-colors">
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <Mail className="w-4 h-4 text-gray-400" />
                          <span className="font-medium">{invitation.email}</span>
                        </div>
                        <p className="text-xs text-gray-500 mt-1">
                          Sent {new Date(invitation.createdAt).toLocaleDateString()} • 
                          Expires {new Date(invitation.expiresAt).toLocaleDateString()}
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        {getStatusIcon(invitation.status)}
                        <span className={`text-sm font-medium ${
                          invitation.status === 'accepted' ? 'text-green-600' :
                          invitation.status === 'rejected' ? 'text-red-600' :
                          invitation.status === 'expired' ? 'text-gray-400' :
                          'text-yellow-600'
                        }`}>
                          {getStatusText(invitation.status)}
                        </span>
                        {(invitation.status === 'pending' || invitation.status === 'expired') && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleResendInvitation(invitation._id)}
                            className="ml-2 h-7 text-xs"
                          >
                            Resend
                          </Button>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </Card>
          )}
        </div>
      )}
    </div>
  )
}
