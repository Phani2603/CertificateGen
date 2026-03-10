"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { toast } from "sonner"
import { Award, Infinity, TrendingUp, Edit, History, AlertTriangle, RotateCcw, Plus } from "lucide-react"
import { format } from "date-fns"

interface QuotaManagementProps {
  organizationSlug: string
  organizationName: string
  currentQuota?: number
  onQuotaUpdated?: () => void
}

export function QuotaManagement({ organizationSlug, organizationName, currentQuota, onQuotaUpdated }: QuotaManagementProps) {
  const [loading, setLoading] = useState(false)
  const [quota, setQuota] = useState<string>("")
  const [reason, setReason] = useState<string>("")
  const [dialogOpen, setDialogOpen] = useState(false)
  const [historyDialogOpen, setHistoryDialogOpen] = useState(false)
  const [resetDialogOpen, setResetDialogOpen] = useState(false)
  const [history, setHistory] = useState<any[]>([])
  const [quotaInfo, setQuotaInfo] = useState<any>(null)
  const [operationMode, setOperationMode] = useState<"set" | "add">("set")

  const handleUpdateQuota = async () => {
    if (!reason.trim()) {
      toast.error("Please provide a reason for the quota change")
      return
    }

    const quotaValue = quota === "-1" ? -1 : parseInt(quota)
    
    if (isNaN(quotaValue) || (quotaValue !== -1 && quotaValue < 1)) {
      toast.error("Quota must be -1 (unlimited) or a positive number")
      return
    }

    // For add mode, validate against current quota
    if (operationMode === "add" && currentQuota === -1) {
      toast.error("Cannot add to unlimited quota. Switch to 'Set' mode to change it.")
      return
    }

    setLoading(true)
    try {
      const response = await fetch(`/api/admin/orgs/${organizationSlug}/quota`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          quota: quotaValue, 
          reason,
          mode: operationMode // 'set' or 'add'
        }),
      })

      const result = await response.json()

      if (result.success) {
        const modeText = operationMode === "add" ? "added to" : "set for"
        toast.success(`Quota ${modeText} ${organizationName}`)
        setDialogOpen(false)
        setQuota("")
        setReason("")
        setOperationMode("set") // Reset to default
        onQuotaUpdated?.()
      } else {
        toast.error(result.error || 'Failed to update quota')
      }
    } catch (error) {
      toast.error('Failed to update quota')
      console.error('[QuotaManagement] Error:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleResetQuota = async () => {
    setLoading(true)
    try {
      const response = await fetch(`/api/admin/orgs/${organizationSlug}/quota/reset`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      })

      const result = await response.json()

      if (result.success) {
        toast.success(`Quota usage reset for ${organizationName}`)
        setResetDialogOpen(false)
        onQuotaUpdated?.()
      } else {
        toast.error(result.error || 'Failed to reset quota')
      }
    } catch (error) {
      toast.error('Failed to reset quota')
      console.error('[QuotaManagement] Error:', error)
    } finally {
      setLoading(false)
    }
  }

  const fetchHistory = async () => {
    try {
      const response = await fetch(`/api/admin/orgs/${organizationSlug}/quota`)
      const result = await response.json()

      if (result.success) {
        setQuotaInfo(result.data)
        setHistory(result.data.history || [])
        setHistoryDialogOpen(true)
      } else {
        toast.error('Failed to fetch quota history')
      }
    } catch (error) {
      toast.error('Failed to fetch quota history')
      console.error('[QuotaManagement] Error:', error)
    }
  }

  const getTransactionIcon = (type: string) => {
    switch (type) {
      case 'allocation': return <Award className="w-4 h-4 text-blue-600" />
      case 'usage': return <TrendingUp className="w-4 h-4 text-green-600" />
      case 'refund': return <AlertTriangle className="w-4 h-4 text-orange-600" />
      default: return <History className="w-4 h-4 text-gray-600" />
    }
  }

  const getTransactionBadge = (type: string) => {
    const styles = {
      allocation: "bg-blue-50 text-blue-700 border-blue-200",
      addition: "bg-green-50 text-green-700 border-green-200",
      usage: "bg-gray-50 text-gray-700 border-gray-200",
      refund: "bg-orange-50 text-orange-700 border-orange-200",
      reset: "bg-purple-50 text-purple-700 border-purple-200",
      adjustment: "bg-yellow-50 text-yellow-700 border-yellow-200",
    }
    return styles[type as keyof typeof styles] || styles.adjustment
  }

  return (
    <div className="flex gap-2">
      {/* Set/Add Quota Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogTrigger asChild>
          <Button variant="outline" size="sm" className="h-8">
            <Edit className="w-3 h-3 mr-1" />
            Manage Quota
          </Button>
        </DialogTrigger>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Manage Certificate Quota</DialogTitle>
            <DialogDescription>
              Configure certificate generation limit for {organizationName}
            </DialogDescription>
          </DialogHeader>
          
          <Tabs value={operationMode} onValueChange={(v) => setOperationMode(v as "set" | "add")} className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="set" className="flex items-center gap-1">
                <Edit className="w-3 h-3" />
                Set Quota
              </TabsTrigger>
              <TabsTrigger value="add" className="flex items-center gap-1">
                <Plus className="w-3 h-3" />
                Add Quota
              </TabsTrigger>
            </TabsList>
            
            <TabsContent value="set" className="space-y-4">
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 mt-4">
                <p className="text-xs text-blue-800">
                  <strong>Set Mode:</strong> Replace the total quota with a new value.
                  {currentQuota !== undefined && (
                    <> Current: <strong>{currentQuota === -1 ? 'Unlimited' : currentQuota.toLocaleString()}</strong></>
                  )}
                </p>
              </div>
              <div className="space-y-2">
                <Label htmlFor="quota-set">New Quota Amount</Label>
                <Input
                  id="quota-set"
                  type="number"
                  placeholder="Enter quota (use -1 for unlimited)"
                  value={quota}
                  onChange={(e) => setQuota(e.target.value)}
                />
                <p className="text-xs text-gray-500">
                  Enter -1 for unlimited certificates, or a positive number for a specific limit
                </p>
              </div>
              <div className="space-y-2">
                <Label htmlFor="reason-set">Reason</Label>
                <Textarea
                  id="reason-set"
                  placeholder="Why are you changing the quota?"
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  rows={3}
                />
              </div>
            </TabsContent>
            
            <TabsContent value="add" className="space-y-4">
              <div className="bg-green-50 border border-green-200 rounded-lg p-3 mt-4">
                <p className="text-xs text-green-800">
                  <strong>Add Mode:</strong> Increase the quota by adding this amount to the current total.
                  {currentQuota !== undefined && currentQuota !== -1 && (
                    <> Current: <strong>{currentQuota.toLocaleString()}</strong>, 
                    {quota && parseInt(quota) > 0 && (
                      <> New will be: <strong>{(currentQuota + parseInt(quota)).toLocaleString()}</strong></>
                    )}
                    </>
                  )}
                  {currentQuota === -1 && (
                    <span className="block mt-1 text-orange-700">⚠️ Current quota is unlimited. Use "Set" mode to change it.</span>
                  )}
                </p>
              </div>
              <div className="space-y-2">
                <Label htmlFor="quota-add">Amount to Add</Label>
                <Input
                  id="quota-add"
                  type="number"
                  placeholder="Enter amount to add"
                  value={quota}
                  onChange={(e) => setQuota(e.target.value)}
                  disabled={currentQuota === -1}
                />
                <p className="text-xs text-gray-500">
                  This amount will be added to the current quota
                </p>
              </div>
              <div className="space-y-2">
                <Label htmlFor="reason-add">Reason</Label>
                <Textarea
                  id="reason-add"
                  placeholder="Why are you adding quota?"
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  rows={3}
                />
              </div>
            </TabsContent>
          </Tabs>
          
          <DialogFooter>
            <Button variant="outline" onClick={() => {
              setDialogOpen(false)
              setQuota("")
              setReason("")
              setOperationMode("set")
            }}>
              Cancel
            </Button>
            <Button onClick={handleUpdateQuota} disabled={loading}>
              {loading ? "Updating..." : operationMode === "add" ? "Add Quota" : "Set Quota"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* View History Dialog */}
      <Dialog open={historyDialogOpen} onOpenChange={setHistoryDialogOpen}>
        <DialogTrigger asChild>
          <Button variant="outline" size="sm" className="h-8" onClick={fetchHistory}>
            <History className="w-3 h-3 mr-1" />
            History
          </Button>
        </DialogTrigger>
        <DialogContent className="sm:max-w-3xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Quota History</DialogTitle>
            <DialogDescription>
              Transaction history for {organizationName}
            </DialogDescription>
          </DialogHeader>
          
          {quotaInfo && (
            <Card className="border-gray-200">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div className="space-y-1">
                    <p className="text-sm text-gray-500">Current Quota</p>
                    <p className="text-2xl font-bold text-gray-900">
                      {quotaInfo.unlimited ? (
                        <span className="flex items-center gap-2">
                          <Infinity className="w-6 h-6" /> Unlimited
                        </span>
                      ) : (
                        quotaInfo.quota.toLocaleString()
                      )}
                    </p>
                  </div>
                  <div className="space-y-1 text-right">
                    <p className="text-sm text-gray-500">Used / Available</p>
                    <p className="text-2xl font-bold text-gray-900">
                      {quotaInfo.used.toLocaleString()} / {quotaInfo.unlimited ? '∞' : quotaInfo.available.toLocaleString()}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          <div className="space-y-4">
            <h4 className="text-sm font-semibold text-gray-900">Transaction Log</h4>
            {history.length > 0 ? (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Type</TableHead>
                    <TableHead>Amount</TableHead>
                    <TableHead>Reason</TableHead>
                    <TableHead>By</TableHead>
                    <TableHead>Date</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {history.map((transaction: any) => (
                    <TableRow key={transaction._id}>
                      <TableCell>
                        <Badge variant="outline" className={getTransactionBadge(transaction.transactionType)}>
                          <span className="flex items-center gap-1">
                            {getTransactionIcon(transaction.transactionType)}
                            {transaction.transactionType}
                          </span>
                        </Badge>
                      </TableCell>
                      <TableCell className="font-mono">
                        <span className={transaction.amount > 0 ? "text-green-600" : "text-red-600"}>
                          {transaction.amount > 0 ? "+" : ""}{transaction.amount}
                        </span>
                      </TableCell>
                      <TableCell className="text-sm text-gray-600">{transaction.reason}</TableCell>
                      <TableCell className="text-sm text-gray-500">
                        {transaction.performedBy?.name || 'System'}
                      </TableCell>
                      <TableCell className="text-sm text-gray-400">
                        {format(new Date(transaction.createdAt), 'MMM dd, yyyy')}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            ) : (
              <p className="text-sm text-gray-500 text-center py-8">No transactions yet</p>
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* Reset Quota Dialog */}
      <Dialog open={resetDialogOpen} onOpenChange={setResetDialogOpen}>
        <DialogTrigger asChild>
          <Button variant="outline" size="sm" className="h-8" onClick={() => setResetDialogOpen(true)}>
            <RotateCcw className="w-3 h-3 mr-1" />
            Reset
          </Button>
        </DialogTrigger>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Reset Quota Usage</DialogTitle>
            <DialogDescription>
              Reset certificate usage count to zero for {organizationName}
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <p className="text-sm text-gray-600">
              This will set the certificates used counter back to zero, allowing the organization to use their full quota again.
            </p>
            <p className="text-sm text-red-600 mt-3 font-medium">
              Warning: This action cannot be undone. The reset will be logged in the quota history.
            </p>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setResetDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleResetQuota} disabled={loading} variant="destructive">
              {loading ? "Resetting..." : "Reset Usage"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
