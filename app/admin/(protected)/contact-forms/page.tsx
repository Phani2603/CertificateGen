"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Mail, Clock, CheckCircle2, Archive, Loader2, RefreshCw } from "lucide-react";
import { format } from "date-fns";

interface ContactForm {
  _id: string;
  name: string;
  email: string;
  message: string;
  status: 'new' | 'read' | 'replied' | 'archived';
  emailSent: boolean;
  emailSentAt?: string;
  readAt?: string;
  repliedAt?: string;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

const statusColors = {
  new: "bg-red-500",
  read: "bg-blue-500",
  replied: "bg-green-500",
  archived: "bg-gray-500",
};

const statusIcons = {
  new: Mail,
  read: Clock,
  replied: CheckCircle2,
  archived: Archive,
};

export default function ContactFormsPage() {
  const [contactForms, setContactForms] = useState<ContactForm[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [refreshing, setRefreshing] = useState(false);

  const fetchContactForms = async () => {
    try {
      setRefreshing(true);
      const response = await fetch(`/api/contact?status=${statusFilter}`);
      const data = await response.json();
      
      if (data.success) {
        setContactForms(data.data);
      }
    } catch (error) {
      console.error('Failed to fetch contact forms:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchContactForms();
  }, [statusFilter]);

  const getStatusBadge = (status: string) => {
    const Icon = statusIcons[status as keyof typeof statusIcons];
    return (
      <Badge className={`${statusColors[status as keyof typeof statusColors]} text-white`}>
        <Icon className="w-3 h-3 mr-1" />
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </Badge>
    );
  };

  const stats = {
    total: contactForms.length,
    new: contactForms.filter((f) => f.status === 'new').length,
    read: contactForms.filter((f) => f.status === 'read').length,
    replied: contactForms.filter((f) => f.status === 'replied').length,
    archived: contactForms.filter((f) => f.status === 'archived').length,
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-7xl">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Contact Forms</h1>
          <p className="text-gray-500 mt-1">Manage and respond to customer inquiries</p>
        </div>
        <Button
          onClick={fetchContactForms}
          disabled={refreshing}
          variant="outline"
          className="flex items-center gap-2"
        >
          <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
          Refresh
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-8">
        <Card className="cursor-pointer hover:shadow-md transition-shadow" onClick={() => setStatusFilter('all')}>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">Total</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold">{stats.total}</p>
          </CardContent>
        </Card>
        
        <Card className="cursor-pointer hover:shadow-md transition-shadow" onClick={() => setStatusFilter('new')}>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-red-600">New</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold text-red-600">{stats.new}</p>
          </CardContent>
        </Card>

        <Card className="cursor-pointer hover:shadow-md transition-shadow" onClick={() => setStatusFilter('read')}>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-blue-600">Read</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold text-blue-600">{stats.read}</p>
          </CardContent>
        </Card>

        <Card className="cursor-pointer hover:shadow-md transition-shadow" onClick={() => setStatusFilter('replied')}>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-green-600">Replied</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold text-green-600">{stats.replied}</p>
          </CardContent>
        </Card>

        <Card className="cursor-pointer hover:shadow-md transition-shadow" onClick={() => setStatusFilter('archived')}>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">Archived</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold text-gray-600">{stats.archived}</p>
          </CardContent>
        </Card>
      </div>

      {/* Filter */}
      <div className="mb-6">
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium text-gray-700">Filter:</span>
          <Badge variant={statusFilter === 'all' ? 'default' : 'outline'} className="cursor-pointer" onClick={() => setStatusFilter('all')}>
            All
          </Badge>
          <Badge variant={statusFilter === 'new' ? 'default' : 'outline'} className="cursor-pointer" onClick={() => setStatusFilter('new')}>
            New
          </Badge>
          <Badge variant={statusFilter === 'read' ? 'default' : 'outline'} className="cursor-pointer" onClick={() => setStatusFilter('read')}>
            Read
          </Badge>
          <Badge variant={statusFilter === 'replied' ? 'default' : 'outline'} className="cursor-pointer" onClick={() => setStatusFilter('replied')}>
            Replied
          </Badge>
          <Badge variant={statusFilter === 'archived' ? 'default' : 'outline'} className="cursor-pointer" onClick={() => setStatusFilter('archived')}>
            Archived
          </Badge>
        </div>
      </div>

      {/* Contact Forms List */}
      <div className="space-y-4">
        {contactForms.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center">
              <Mail className="w-12 h-12 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-500">No contact forms found</p>
            </CardContent>
          </Card>
        ) : (
          contactForms.map((form) => (
            <Card key={form._id} className="hover:shadow-md transition-shadow">
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="space-y-1">
                    <CardTitle className="text-xl">{form.name}</CardTitle>
                    <CardDescription>
                      <a href={`mailto:${form.email}`} className="text-blue-600 hover:underline">
                        {form.email}
                      </a>
                    </CardDescription>
                  </div>
                  <div className="flex items-center gap-2">
                    {getStatusBadge(form.status)}
                    {form.emailSent && (
                      <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                        ✓ Email Sent
                      </Badge>
                    )}
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div>
                    <h4 className="text-sm font-semibold text-gray-700 mb-2">Message:</h4>
                    <p className="text-gray-600 whitespace-pre-wrap bg-gray-50 p-4 rounded-lg border">
                      {form.message}
                    </p>
                  </div>

                  <Separator />

                  <div className="flex items-center justify-between text-sm text-gray-500">
                    <div className="flex items-center gap-4">
                      <span>
                        <strong>Submitted:</strong>{' '}
                        {format(new Date(form.createdAt), 'PPp')}
                      </span>
                      {form.emailSentAt && (
                        <span>
                          <strong>Email Sent:</strong>{' '}
                          {format(new Date(form.emailSentAt), 'PPp')}
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => window.open(`mailto:${form.email}?subject=Re: Your Contact Form Submission`)}
                      >
                        <Mail className="w-4 h-4 mr-1" />
                        Reply
                      </Button>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  );
}
