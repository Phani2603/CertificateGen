"use client"

import { useState, useEffect } from "react"
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Search, FileText, Terminal } from "lucide-react"
import { useToast } from "@/hooks/use-toast"

interface AdminLog {
  _id: string
  adminId?: {
    name: string
    email: string
  }
  action: string
  targetType: string
  targetId: string
  details: any
  ipAddress: string
  userAgent?: string
  createdAt: string
}

export default function LogsPage() {
  const [logs, setLogs] = useState<AdminLog[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState("")
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const { toast } = useToast()
  const latestLogin = logs.find((log) => log.action === 'ADMIN_LOGIN')

  useEffect(() => {
    fetchLogs()
  }, [page, search])

  // Debounce search
  useEffect(() => {
    const timer = setTimeout(() => {
      if (page !== 1) setPage(1)
      else fetchLogs()
    }, 500)
    return () => clearTimeout(timer)
  }, [search])

  const fetchLogs = async () => {
    try {
      setLoading(true)
      const params = new URLSearchParams({
        page: page.toString(),
        limit: "20",
        action: search
      })
      
      console.log('[Logs Page] Fetching logs with params:', params.toString())
      const res = await fetch(`/api/admin/logs?${params}`)
      const data = await res.json()
      console.log('[Logs Page] Response:', { status: res.status, data })
      
      if (!res.ok && res.status === 401) {
        window.location.href = '/admin/login'
        return
      }
      
      if (data.success) {
        console.log('[Logs Page] Setting logs:', data.logs.length, 'items')
        setLogs(data.logs)
        setTotalPages(data.pagination.pages)
      } else {
        console.error('[Logs Page] Failed to fetch logs:', data.error, data.details)
      }
    } catch (error) {
      console.error("[Logs Page] Failed to fetch logs", error)
      toast({
        title: "Error",
        description: "Failed to load audit logs",
        variant: "destructive"
      })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Audit Logs</h2>
          <p className="text-muted-foreground">Track all administrative actions and system events.</p>
        </div>
      </div>

      {latestLogin && (
        <Card className="border-l-4 border-l-blue-500">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-semibold">Latest Admin Login</CardTitle>
          </CardHeader>
          <CardContent className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-sm text-muted-foreground">
            <div>
              <p className="font-semibold text-slate-800">{new Date(latestLogin.createdAt).toLocaleString()}</p>
              <p>Time</p>
            </div>
            <div>
              <p className="font-semibold text-slate-800 truncate" title={latestLogin.userAgent}>{latestLogin.userAgent || '—'}</p>
              <p>Device / Agent</p>
            </div>
            <div>
              <p className="font-semibold text-slate-800">
                {[latestLogin.details?.geo?.city, latestLogin.details?.geo?.region, latestLogin.details?.geo?.country]
                  .filter(Boolean)
                  .join(', ') || '—'}
              </p>
              <p>Location</p>
            </div>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between gap-4">
            <div className="relative flex-1 max-w-sm">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search by action..."
                className="pl-8"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Timestamp</TableHead>
                  <TableHead>Admin</TableHead>
                  <TableHead>Action</TableHead>
                  <TableHead>Target</TableHead>
                  <TableHead>IP</TableHead>
                  <TableHead>Device</TableHead>
                  <TableHead>Location</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  <TableRow>
                    <TableCell colSpan={5} className="h-24 text-center">
                      Loading logs...
                    </TableCell>
                  </TableRow>
                ) : logs.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} className="h-24 text-center">
                      No logs found.
                    </TableCell>
                  </TableRow>
                ) : (
                  logs.map((log) => (
                    <TableRow key={log._id}>
                      <TableCell className="font-mono text-xs text-muted-foreground">
                        {new Date(log.createdAt).toLocaleString()}
                      </TableCell>
                      <TableCell>
                        {log.adminId ? (
                          <div className="flex flex-col">
                            <span className="font-medium text-sm">{log.adminId.name}</span>
                            <span className="text-xs text-muted-foreground">{log.adminId.email}</span>
                          </div>
                        ) : (
                          <span className="text-muted-foreground italic">System</span>
                        )}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Terminal className="w-3 h-3 text-gray-400" />
                          <span className="font-medium">{log.action}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex flex-col">
                          <span className="text-sm">{log.targetType}</span>
                          <span className="text-xs font-mono text-muted-foreground">{log.targetId}</span>
                        </div>
                      </TableCell>
                      <TableCell className="font-mono text-xs">{log.ipAddress}</TableCell>
                      <TableCell className="text-xs text-muted-foreground max-w-[180px] truncate" title={log.userAgent}>
                        {log.userAgent || '—'}
                      </TableCell>
                      <TableCell className="text-xs text-muted-foreground">
                        {log.details?.geo?.city || log.details?.geo?.region || log.details?.geo?.country ? (
                          <>
                            {[log.details?.geo?.city, log.details?.geo?.region, log.details?.geo?.country]
                              .filter(Boolean)
                              .join(', ')}
                          </>
                        ) : (
                          '—'
                        )}
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>

          {/* Pagination */}
          <div className="flex items-center justify-end space-x-2 py-4">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setPage(p => Math.max(1, p - 1))}
              disabled={page === 1}
            >
              Previous
            </Button>
            <div className="text-sm text-muted-foreground">
              Page {page} of {totalPages}
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setPage(p => Math.min(totalPages, p + 1))}
              disabled={page === totalPages}
            >
              Next
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
