"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Checkbox } from "@/components/ui/checkbox"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  Mail,
  Clock,
  CheckCircle2,
  Archive,
  Loader2,
  RefreshCw,
  Search,
  Eye,
  ChevronLeft,
  ChevronRight,
  Download,
  ArrowLeft,
  StickyNote,
  Send,
  AlertCircle
} from "lucide-react"
import { format } from "date-fns"
import { toast } from "sonner"
import Link from "next/link"

interface ContactForm {
  _id: string
  name: string
  email: string
  message: string
  status: 'new' | 'read' | 'replied' | 'archived'
  emailSent: boolean
  emailSentAt?: string
  readAt?: string
  repliedAt?: string
  notes?: string
  createdAt: string
  updatedAt: string
}

const statusColors = {
  new: "bg-red-50 text-red-700 border-red-200",
  read: "bg-blue-50 text-blue-700 border-blue-200",
  replied: "bg-green-50 text-green-700 border-green-200",
  archived: "bg-gray-50 text-gray-700 border-gray-200",
}

const statusIcons = {
  new: Mail,
  read: Clock,
  replied: CheckCircle2,
  archived: Archive,
}

export default function ContactFormsPage() {
  const [contactForms, setContactForms] = useState<ContactForm[]>([])
  const [filteredForms, setFilteredForms] = useState<ContactForm[]>([])
  const [loading, setLoading] = useState(true)
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [searchQuery, setSearchQuery] = useState("")
  const [refreshing, setRefreshing] = useState(false)
  const [selectedForm, setSelectedForm] = useState<ContactForm | null>(null)
  const [detailsDialogOpen, setDetailsDialogOpen] = useState(false)
  const [notesDialogOpen, setNotesDialogOpen] = useState(false)
  const [adminNotes, setAdminNotes] = useState("")
  const [selectedForms, setSelectedForms] = useState<Set<string>>(new Set())
  
  // Pagination
  const [currentPage, setCurrentPage] = useState(1)
  const [itemsPerPage, setItemsPerPage] = useState(10)
  
  const fetchContactForms = async () => {
    try {
      setRefreshing(true)
      const response = await fetch('/api/contact')
      const data = await response.json()
      
      if (data.success) {
        setContactForms(data.data)
      }
    } catch (error) {
      console.error('Failed to fetch contact forms:', error)
      toast.error('Failed to load contact forms')
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }

  useEffect(() => {
    fetchContactForms()
  }, [])

  // Filter and search
  useEffect(() => {
    let filtered = [...contactForms]
    
    // Status filter
    if (statusFilter !== 'all') {
      filtered = filtered.filter(f => f.status === statusFilter)
    }
    
    // Search filter
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase()
      filtered = filtered.filter(f =>
        f.name.toLowerCase().includes(query) ||
        f.email.toLowerCase().includes(query) ||
        f.message.toLowerCase().includes(query)
      )
    }
    
    setFilteredForms(filtered)
    setCurrentPage(1) // Reset to first page when filters change
  }, [contactForms, statusFilter, searchQuery])

  // Pagination
  const totalPages = Math.ceil(filteredForms.length / itemsPerPage)
  const startIndex = (currentPage - 1) * itemsPerPage
  const endIndex = startIndex + itemsPerPage
  const paginatedForms = filteredForms.slice(startIndex,endIndex)

  const stats = {
    total: contactForms.length,
    new: contactForms.filter((f) => f.status === 'new').length,
    read: contactForms.filter((f) => f.status === 'read').length,
    replied: contactForms.filter((f) => f.status === 'replied').length,
    archived: contactForms.filter((f) => f.status === 'archived').length,
  }

  const updateStatus = async (id: string, status: ContactForm['status']) => {
    try {
      const response = await fetch(`/api/contact/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status }),
      })
      
      const result = await response.json()
      
      if (result.success) {
        toast.success(`Status updated to ${status}`)
        fetchContactForms()
      } else {
        toast.error(result.error || 'Failed to update status')
      }
    } catch (error) {
      toast.error('Failed to update status')
    }
  }

  const updateNotes = async (id: string, notes: string) => {
    try {
      const response = await fetch(`/api/contact/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ notes }),
      })
      
      const result = await response.json()
      
      if (result.success) {
        toast.success('Notes updated successfully')
        fetchContactForms()
        setNotesDialogOpen(false)
      } else {
        toast.error(result.error || 'Failed to update notes')
      }
    } catch (error) {
      toast.error('Failed to update notes')
    }
  }

  const bulkArchive = async () => {
    if (selectedForms.size === 0) {
      toast.error('No forms selected')
      return
    }
    
    try {
      const promises = Array.from(selectedForms).map(id =>
        fetch(`/api/contact/${id}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ status: 'archived' }),
        })
      )
      
      await Promise.all(promises)
      toast.success(`${selectedForms.size} form(s) archived`)
      setSelectedForms(new Set())
      fetchContactForms()
    } catch (error) {
      toast.error('Failed to archive forms')
    }
  }

  const exportToCSV = () => {
    const csvContent = [
      ['Name', 'Email', 'Status', 'Submitted', 'Message'],
      ...filteredForms.map(f => [
        f.name,
        f.email,
        f.status,
        format(new Date(f.createdAt), 'yyyy-MM-dd HH:mm'),
        f.message.replace(/"/g, '""') // Escape quotes
      ])
    ].map(row => row.map(cell => `"${cell}"`).join(',')).join('\n')
    
    const blob = new Blob([csvContent], { type: 'text/csv' })
    const url = window.URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `contact-forms-${format(new Date(), 'yyyy-MM-dd')}.csv`
    a.click()
    window.URL.revokeObjectURL(url)
    toast.success('Exported to CSV')
  }

  const openDetails = (form: ContactForm) => {
    setSelectedForm(form)
    setDetailsDialogOpen(true)
    if (form.status === 'new') {
      updateStatus(form._id, 'read')
    }
  }

  const openNotes = (form: ContactForm) => {
    setSelectedForm(form)
    setAdminNotes(form.notes || '')
    setNotesDialogOpen(true)
  }

  const toggleSelection = (id: string) => {
    const newSelection = new Set(selectedForms)
    if (newSelection.has(id)) {
      newSelection.delete(id)
    } else {
      newSelection.add(id)
    }
    setSelectedForms(newSelection)
  }

  const toggleSelectAll = () => {
    if (selectedForms.size === paginatedForms.length) {
      setSelectedForms(new Set())
    } else {
      setSelectedForms(new Set(paginatedForms.map(f => f._id)))
    }
  }

  const getStatusBadge = (status: string) => {
    const Icon = statusIcons[status as keyof typeof statusIcons]
    return (
      <Badge variant="outline" className={statusColors[status as keyof typeof statusColors]}>
        <Icon className="w-3 h-3 mr-1" />
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </Badge>
    )
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="w-8 h-8 animate-spin text-[#00D492]" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <Link href="/admin">
              <Button variant="ghost" size="sm" className="h-8 gap-1">
                <ArrowLeft className="w-4 h-4" />
                Back to Dashboard
              </Button>
            </Link>
          </div>
          <h1 className="text-3xl font-bold tracking-tight text-gray-900">
            Contact Form Submissions
          </h1>
          <p className="text-gray-500">
            Manage and respond to customer inquiries
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            onClick={exportToCSV}
            variant="outline"
            size="sm"
            className="h-9"
          >
            <Download className="w-4 h-4 mr-1" />
            Export CSV
          </Button>
          <Button
            onClick={fetchContactForms}
            disabled={refreshing}
            variant="outline"
            size="sm"
            className="h-9"
          >
            <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        <Card
          className={`cursor-pointer hover:shadow-md transition-shadow border-none shadow-sm ring-1 ring-black/5 ${statusFilter === 'all' ? 'ring-2 ring-[#00D492]' : ''}`}
          onClick={() => setStatusFilter('all')}
        >
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Total</p>
                <p className="text-2xl font-bold text-gray-900">{stats.total}</p>
              </div>
              <Mail className="w-8 h-8 text-gray-400" />
            </div>
          </CardContent>
        </Card>
        
        <Card
          className={`cursor-pointer hover:shadow-md transition-shadow border-none shadow-sm ring-1 ring-black/5 ${statusFilter === 'new' ? 'ring-2 ring-red-500' : ''}`}
          onClick={() => setStatusFilter('new')}
        >
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-red-600">New</p>
                <p className="text-2xl font-bold text-red-600">{stats.new}</p>
              </div>
              <AlertCircle className="w-8 h-8 text-red-400" />
            </div>
          </CardContent>
        </Card>

        <Card
          className={`cursor-pointer hover:shadow-md transition-shadow border-none shadow-sm ring-1 ring-black/5 ${statusFilter === 'read' ? 'ring-2 ring-blue-500' : ''}`}
          onClick={() => setStatusFilter('read')}
        >
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-blue-600">Read</p>
                <p className="text-2xl font-bold text-blue-600">{stats.read}</p>
              </div>
              <Clock className="w-8 h-8 text-blue-400" />
            </div>
          </CardContent>
        </Card>

        <Card
          className={`cursor-pointer hover:shadow-md transition-shadow border-none shadow-sm ring-1 ring-black/5 ${statusFilter === 'replied' ? 'ring-2 ring-green-500' : ''}`}
          onClick={() => setStatusFilter('replied')}
        >
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-green-600">Replied</p>
                <p className="text-2xl font-bold text-green-600">{stats.replied}</p>
              </div>
              <CheckCircle2 className="w-8 h-8 text-green-400" />
            </div>
          </CardContent>
        </Card>

        <Card
          className={`cursor-pointer hover:shadow-md transition-shadow border-none shadow-sm ring-1 ring-black/5 ${statusFilter === 'archived' ? 'ring-2 ring-gray-500' : ''}`}
          onClick={() => setStatusFilter('archived')}
        >
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Archived</p>
                <p className="text-2xl font-bold text-gray-600">{stats.archived}</p>
              </div>
              <Archive className="w-8 h-8 text-gray-400" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Search and Bulk Actions */}
      <Card className="border-none shadow-sm ring-1 ring-black/5">
        <CardContent className="p-4">
          <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center justify-between">
            <div className="relative w-full sm:w-80">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
              <Input
                placeholder="Search by name, email, or message..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9"
              />
            </div>
            
            {selectedForms.size > 0 && (
              <div className="flex items-center gap-2">
                <span className="text-sm text-gray-600">
                  {selectedForms.size} selected
                </span>
                <Button
                  onClick={bulkArchive}
                  variant="outline"
                  size="sm"
                  className="h-8"
                >
                  <Archive className="w-4 h-4 mr-1" />
                  Archive
                </Button>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Contact Forms Table */}
      <Card className="border-none shadow-sm ring-1 ring-black/5">
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-12">
                  <Checkbox
                    checked={paginatedForms.length > 0 && selectedForms.size === paginatedForms.length}
                    onCheckedChange={toggleSelectAll}
                  />
                </TableHead>
                <TableHead>Name & Email</TableHead>
                <TableHead>Message Preview</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Submitted</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {paginatedForms.length > 0 ? (
                paginatedForms.map((form) => (
                  <TableRow key={form._id}>
                    <TableCell>
                      <Checkbox
                        checked={selectedForms.has(form._id)}
                        onCheckedChange={() => toggleSelection(form._id)}
                      />
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-col">
                        <span className="font-medium text-gray-900">{form.name}</span>
                        <a
                          href={`mailto:${form.email}`}
                          className="text-sm text-blue-600 hover:underline"
                        >
                          {form.email}
                        </a>
                      </div>
                    </TableCell>
                    <TableCell className="max-w-md">
                      <p className="text-sm text-gray-600 truncate">
                        {form.message}
                      </p>
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-col gap-1">
                        {getStatusBadge(form.status)}
                        {form.emailSent && (
                          <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200 text-xs">
                            ✓ Notified
                          </Badge>
                        )}
                      </div>
                    </TableCell>
                    <TableCell className="text-sm text-gray-500">
                      {format(new Date(form.createdAt), 'MMM dd, yyyy')}
                      <br />
                      <span className="text-xs text-gray-400">
                        {format(new Date(form.createdAt), 'h:mm a')}
                      </span>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-1">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => openDetails(form)}
                          className="h-8 w-8 p-0"
                        >
                          <Eye className="w-4 h-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => openNotes(form)}
                          className="h-8 w-8 p-0"
                        >
                          <StickyNote className="w-4 h-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => window.open(`mailto:${form.email}?subject=Re: Your Contact Form Submission`)}
                          className="h-8 w-8 p-0"
                        >
                          <Send className="w-4 h-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={6} className="h-32 text-center">
                    <div className="flex flex-col items-center justify-center text-gray-500">
                      <Mail className="w-12 h-12 text-gray-300 mb-2" />
                      <p>No contact forms found</p>
                    </div>
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
          
          {/* Pagination */}
          {filteredForms.length > 0 && (
            <div className="flex items-center justify-between px-6 py-4 border-t">
              <div className="flex items-center gap-2">
                <p className="text-sm text-gray-700">
                  Showing <span className="font-medium">{startIndex + 1}</span> to{" "}
                  <span className="font-medium">{Math.min(endIndex, filteredForms.length)}</span> of{" "}
                  <span className="font-medium">{filteredForms.length}</span> submissions
                </p>
              </div>
              
              <div className="flex items-center gap-2">
                <div className="flex items-center gap-2">
                  <span className="text-sm text-gray-700">Rows per page:</span>
                  <Select
                    value={itemsPerPage.toString()}
                    onValueChange={(value) => {
                      setItemsPerPage(Number(value))
                      setCurrentPage(1)
                    }}
                  >
                    <SelectTrigger className="h-8 w-[70px]">
                      <SelectValue placeholder={itemsPerPage} />
                    </SelectTrigger>
                    <SelectContent side="top">
                      {[10, 25, 50, 100].map((pageSize) => (
                        <SelectItem key={pageSize} value={pageSize.toString()}>
                          {pageSize}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="flex items-center gap-1">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setCurrentPage(currentPage - 1)}
                    disabled={currentPage === 1}
                    className="h-8 w-8 p-0"
                  >
                    <ChevronLeft className="h-4 w-4" />
                  </Button>
                  <div className="flex items-center gap-1 px-2">
                    <span className="text-sm text-gray-700">
                      Page <span className="font-medium">{currentPage}</span> of{" "}
                      <span className="font-medium">{totalPages}</span>
                    </span>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setCurrentPage(currentPage + 1)}
                    disabled={currentPage === totalPages}
                    className="h-8 w-8 p-0"
                  >
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Details Dialog */}
      <Dialog open={detailsDialogOpen} onOpenChange={setDetailsDialogOpen}>
        <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
          {selectedForm && (
            <>
              <DialogHeader>
                <DialogTitle>Contact Form Details</DialogTitle>
                <DialogDescription>
                  Submitted on {format(new Date(selectedForm.createdAt), 'PPpp')}
                </DialogDescription>
              </DialogHeader>
              
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium text-gray-700">Name</label>
                    <p className="text-gray-900 mt-1">{selectedForm.name}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-700">Email</label>
                    <a
                      href={`mailto:${selectedForm.email}`}
                      className="text-blue-600 hover:underline mt-1 block"
                    >
                      {selectedForm.email}
                    </a>
                  </div>
                </div>

                <div>
                  <label className="text-sm font-medium text-gray-700">Status</label>
                  <div className="mt-2">
                    <Select
                      value={selectedForm.status}
                      onValueChange={(value) => updateStatus(selectedForm._id, value as ContactForm['status'])}
                    >
                      <SelectTrigger className="w-[180px]">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="new">New</SelectItem>
                        <SelectItem value="read">Read</SelectItem>
                        <SelectItem value="replied">Replied</SelectItem>
                        <SelectItem value="archived">Archived</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div>
                  <label className="text-sm font-medium text-gray-700">Message</label>
                  <div className="mt-2 bg-gray-50 p-4 rounded-lg border">
                    <p className="text-gray-900 whitespace-pre-wrap">{selectedForm.message}</p>
                  </div>
                </div>

                {selectedForm.notes && (
                  <div>
                    <label className="text-sm font-medium text-gray-700">Admin Notes</label>
                    <div className="mt-2 bg-blue-50 p-4 rounded-lg border border-blue-200">
                      <p className="text-gray-900 whitespace-pre-wrap">{selectedForm.notes}</p>
                    </div>
                  </div>
                )}
              </div>

              <DialogFooter className="gap-2">
                <Button
                  variant="outline"
                  onClick={() => {
                    setDetailsDialogOpen(false)
                    openNotes(selectedForm)
                  }}
                >
                  <StickyNote className="w-4 h-4 mr-2" />
                  Add Notes
                </Button>
                <Button
                  onClick={() => window.open(`mailto:${selectedForm.email}?subject=Re: Your Contact Form Submission`)}
                  className="bg-[#00D492] hover:bg-[#00D492]/90"
                >
                  <Send className="w-4 h-4 mr-2" />
                  Send Reply
                </Button>
              </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>

      {/* Notes Dialog */}
      <Dialog open={notesDialogOpen} onOpenChange={setNotesDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Admin Notes</DialogTitle>
            <DialogDescription>
              Add internal notes for this contact form submission
            </DialogDescription>
          </DialogHeader>
          
          <Textarea
            placeholder="Enter your notes here..."
            value={adminNotes}
            onChange={(e) => setAdminNotes(e.target.value)}
            rows={6}
            className="resize-none"
          />

          <DialogFooter>
            <Button variant="outline" onClick={() => setNotesDialogOpen(false)}>
              Cancel
            </Button>
            <Button
              onClick={() => selectedForm && updateNotes(selectedForm._id, adminNotes)}
              className="bg-[#00D492] hover:bg-[#00D492]/90"
            >
              Save Notes
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
