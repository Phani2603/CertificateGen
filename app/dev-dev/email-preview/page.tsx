'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { 
  Smartphone, 
  Monitor, 
  ExternalLink, 
  Send, 
  Loader2, 
  ArrowLeft, 
  CheckCircle2, 
  Sparkles,
  RefreshCw,
  Sliders,
  RotateCcw
} from 'lucide-react';
import { toast } from 'sonner';

export default function EmailPreviewPage() {
  const [recipientName, setRecipientName] = useState('Phani Kumar');
  const [eventName, setEventName] = useState('Full Stack AI Hackathon 2026');
  const [issuerName, setIssuerName] = useState('Google Developer Student Clubs');
  const [verificationId, setVerificationId] = useState('cert_demo_882910');

  // Fine-tuning states for receiver name position & size (user finalized values)
  const [topPos, setTopPos] = useState(10.4); // %
  const [fontSize, setFontSize] = useState(44); // px
  const [leftPos, setLeftPos] = useState(27.6); // %
  
  const [viewMode, setViewMode] = useState<'desktop' | 'mobile'>('desktop');
  const [testEmail, setTestEmail] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [key, setKey] = useState(0);

  // Construct query string for preview iframe
  const previewParams = new URLSearchParams({
    name: recipientName,
    event: eventName,
    issuer: issuerName,
    id: verificationId,
    fontSize: `${fontSize}px`,
    top: `${topPos}%`,
    left: `${leftPos}%`,
    v: String(key),
  });

  const previewUrl = `/api/preview/email?${previewParams.toString()}`;

  const handleResetPosition = () => {
    setTopPos(10.4);
    setFontSize(44);
    setLeftPos(27.6);
    toast.info('Position & font reset to finalized values');
  };

  const handleSendTest = async () => {
    if (!testEmail || !testEmail.includes('@')) {
      toast.error('Please enter a valid email address');
      return;
    }

    setIsSending(true);
    try {
      const res = await fetch('/api/preview/send-test', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          to: testEmail,
          recipientName,
          eventName,
          issuerName,
          verificationId,
          styling: {
            fontSize: `${fontSize}px`,
            top: `${topPos}%`,
            left: `${leftPos}%`,
          }
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Failed to send test email');
      }

      toast.success(data.message || 'Test email dispatched successfully via ZeptoMail!', {
        description: 'Check your inbox (and spam folder) in a few seconds.',
      });
    } catch (err: any) {
      toast.error(err.message || 'Error sending test email');
    } finally {
      setIsSending(false);
    }
  };

  return (
    <div className="min-h-screen bg-neutral-900 text-neutral-100 p-4 md:p-8">
      <div className="max-w-7xl mx-auto space-y-6">
        
        {/* Top Header */}
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 pb-4 border-b border-neutral-800">
          <div className="space-y-1">
            <div className="flex items-center gap-3">
              <Link href="/dev-dev">
                <Button variant="ghost" size="sm" className="text-neutral-400 hover:text-white px-2">
                  <ArrowLeft className="w-4 h-4 mr-1" />
                  Dev Dashboard
                </Button>
              </Link>
              <span className="text-neutral-600">/</span>
              <span className="text-xs uppercase tracking-wider font-semibold text-emerald-400 bg-emerald-950/60 border border-emerald-800/60 px-2 py-0.5 rounded-full flex items-center gap-1">
                <Sparkles className="w-3 h-3" />
                Live Preview
              </span>
            </div>
            <h1 className="text-2xl md:text-3xl font-bold text-white tracking-tight">
              Participant Certificate Email Preview
            </h1>
            <p className="text-sm text-neutral-400">
              Interactive testbed for the redesigned participant delivery template.
            </p>
          </div>

          <div className="flex items-center gap-3 w-full md:w-auto">
            <a href={previewUrl} target="_blank" rel="noopener noreferrer">
              <Button variant="outline" size="sm" className="border-neutral-700 bg-neutral-800 text-neutral-200 hover:bg-neutral-700 hover:text-white">
                <ExternalLink className="w-4 h-4 mr-2" />
                Open Raw HTML
              </Button>
            </a>
            <Button 
              variant="outline" 
              size="sm" 
              onClick={() => setKey(prev => prev + 1)}
              className="border-neutral-700 bg-neutral-800 text-neutral-200 hover:bg-neutral-700"
            >
              <RefreshCw className="w-4 h-4 mr-2" />
              Refresh
            </Button>
          </div>
        </div>

        {/* Main Content Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          
          {/* Left Controls & Customizer (5 cols) */}
          <div className="lg:col-span-5 space-y-6">
            
            {/* Banner Fine-Tuning Controls */}
            <Card className="bg-neutral-800/95 border-emerald-500/30 p-5 rounded-xl shadow-lg space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="text-base font-semibold text-white flex items-center gap-2">
                  <Sliders className="w-4 h-4 text-emerald-400" />
                  Receiver Name Tuning (Hero Banner)
                </h2>
                <Button 
                  variant="ghost" 
                  size="sm" 
                  onClick={handleResetPosition}
                  className="h-7 px-2 text-xs text-neutral-400 hover:text-white"
                  title="Reset to recommended"
                >
                  <RotateCcw className="w-3 h-3 mr-1" />
                  Reset
                </Button>
              </div>
              <p className="text-xs text-neutral-400">
                Adjust position and size live to align with &ldquo;Hey!&rdquo; perfectly.
              </p>

              <div className="space-y-4 pt-1">
                {/* Font Size Control */}
                <div className="space-y-2">
                  <div className="flex justify-between items-center text-xs">
                    <span className="font-medium text-neutral-300">Font Size:</span>
                    <span className="font-mono text-emerald-400 font-semibold">{fontSize}px</span>
                  </div>
                  <input
                    type="range"
                    min="32"
                    max="52"
                    step="1"
                    value={fontSize}
                    onChange={(e) => setFontSize(Number(e.target.value))}
                    className="w-full h-1.5 bg-neutral-700 rounded-lg appearance-none cursor-pointer accent-emerald-500"
                  />
                  <div className="flex justify-between text-[10px] text-neutral-500">
                    <span>32px</span>
                    <span>Finalized: 44px</span>
                    <span>52px</span>
                  </div>
                </div>

                {/* Y-Position Control (Top %) */}
                <div className="space-y-2">
                  <div className="flex justify-between items-center text-xs">
                    <span className="font-medium text-neutral-300">Vertical Offset (Y-Axis):</span>
                    <span className="font-mono text-emerald-400 font-semibold">{topPos.toFixed(1)}%</span>
                  </div>
                  <input
                    type="range"
                    min="7"
                    max="16"
                    step="0.2"
                    value={topPos}
                    onChange={(e) => setTopPos(Number(e.target.value))}
                    className="w-full h-1.5 bg-neutral-700 rounded-lg appearance-none cursor-pointer accent-emerald-500"
                  />
                  <div className="flex justify-between text-[10px] text-neutral-500">
                    <span>Higher Up (7%)</span>
                    <span>Finalized: 10.4%</span>
                    <span>Lower Down (16%)</span>
                  </div>
                </div>

                {/* X-Position Control (Left %) */}
                <div className="space-y-2">
                  <div className="flex justify-between items-center text-xs">
                    <span className="font-medium text-neutral-300">Horizontal Spacing (X-Axis):</span>
                    <span className="font-mono text-emerald-400 font-semibold">{leftPos.toFixed(1)}%</span>
                  </div>
                  <input
                    type="range"
                    min="25"
                    max="33"
                    step="0.2"
                    value={leftPos}
                    onChange={(e) => setLeftPos(Number(e.target.value))}
                    className="w-full h-1.5 bg-neutral-700 rounded-lg appearance-none cursor-pointer accent-emerald-500"
                  />
                  <div className="flex justify-between text-[10px] text-neutral-500">
                    <span>Closer to &ldquo;!&rdquo; (25%)</span>
                    <span>Finalized: 27.6%</span>
                    <span>Further (33%)</span>
                  </div>
                </div>
              </div>
            </Card>

            {/* Field Inputs Card */}
            <Card className="bg-neutral-800/90 border-neutral-700/80 p-5 rounded-xl shadow-lg space-y-4">
              <h2 className="text-base font-semibold text-white flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-emerald-400"></span>
                Dynamic Template Content
              </h2>

              <div className="space-y-3 pt-1">
                <div className="space-y-1.5">
                  <Label htmlFor="candidateName" className="text-xs font-medium text-neutral-300">
                    Candidate Name
                  </Label>
                  <Input
                    id="candidateName"
                    value={recipientName}
                    onChange={(e) => setRecipientName(e.target.value)}
                    placeholder="e.g. Jane Doe"
                    className="bg-neutral-900 border-neutral-700 text-white placeholder:text-neutral-500"
                  />
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="eventName" className="text-xs font-medium text-neutral-300">
                    Event Name
                  </Label>
                  <Input
                    id="eventName"
                    value={eventName}
                    onChange={(e) => setEventName(e.target.value)}
                    placeholder="e.g. National Hackathon"
                    className="bg-neutral-900 border-neutral-700 text-white placeholder:text-neutral-500"
                  />
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="issuerName" className="text-xs font-medium text-neutral-300">
                    Issued By (Organization / Club)
                  </Label>
                  <Input
                    id="issuerName"
                    value={issuerName}
                    onChange={(e) => setIssuerName(e.target.value)}
                    placeholder="e.g. Senement Corporation"
                    className="bg-neutral-900 border-neutral-700 text-white placeholder:text-neutral-500"
                  />
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="verificationId" className="text-xs font-medium text-neutral-300">
                    Verification ID
                  </Label>
                  <Input
                    id="verificationId"
                    value={verificationId}
                    onChange={(e) => setVerificationId(e.target.value)}
                    placeholder="e.g. cert_12345"
                    className="bg-neutral-900 border-neutral-700 text-white font-mono text-xs placeholder:text-neutral-500"
                  />
                </div>
              </div>
            </Card>

            {/* Send Real Test Email Card */}
            <Card className="bg-neutral-800/90 border-neutral-700/80 p-5 rounded-xl shadow-lg space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="text-base font-semibold text-white flex items-center gap-2">
                  <Send className="w-4 h-4 text-emerald-400" />
                  Send Test via ZeptoMail
                </h2>
                <span className="text-[11px] bg-neutral-700 text-neutral-300 px-2 py-0.5 rounded">
                  Live Inbox Test
                </span>
              </div>
              <p className="text-xs text-neutral-400">
                Send this exact customized email to your personal inbox.
              </p>

              <div className="space-y-3 pt-1">
                <div className="space-y-1.5">
                  <Label htmlFor="testEmail" className="text-xs font-medium text-neutral-300">
                    Your Email Address
                  </Label>
                  <Input
                    id="testEmail"
                    type="email"
                    value={testEmail}
                    onChange={(e) => setTestEmail(e.target.value)}
                    placeholder="your-name@gmail.com"
                    className="bg-neutral-900 border-neutral-700 text-white placeholder:text-neutral-500"
                  />
                </div>

                <Button
                  onClick={handleSendTest}
                  disabled={isSending}
                  className="w-full bg-emerald-500 hover:bg-emerald-600 text-black font-semibold text-sm transition-all"
                >
                  {isSending ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Sending to ZeptoMail...
                    </>
                  ) : (
                    <>
                      <Send className="w-4 h-4 mr-2" />
                      Dispatch Test Email
                    </>
                  )}
                </Button>
              </div>
            </Card>

          </div>

          {/* Right Live Preview Canvas (7 cols) */}
          <div className="lg:col-span-7 space-y-4">
            
            {/* Device Switcher Bar */}
            <div className="flex items-center justify-between bg-neutral-800/80 border border-neutral-700/80 px-4 py-2.5 rounded-xl">
              <div className="text-xs font-medium text-neutral-300">
                Viewport Preview:
              </div>
              <div className="flex items-center gap-1 bg-neutral-900 p-1 rounded-lg border border-neutral-700">
                <button
                  type="button"
                  onClick={() => setViewMode('desktop')}
                  className={`flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-md font-medium transition-all ${
                    viewMode === 'desktop' 
                      ? 'bg-neutral-700 text-white shadow' 
                      : 'text-neutral-400 hover:text-neutral-200'
                  }`}
                >
                  <Monitor className="w-3.5 h-3.5" />
                  Desktop (600px)
                </button>
                <button
                  type="button"
                  onClick={() => setViewMode('mobile')}
                  className={`flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-md font-medium transition-all ${
                    viewMode === 'mobile' 
                      ? 'bg-neutral-700 text-white shadow' 
                      : 'text-neutral-400 hover:text-neutral-200'
                  }`}
                >
                  <Smartphone className="w-3.5 h-3.5" />
                  Mobile (380px)
                </button>
              </div>
            </div>

            {/* Iframe Frame Container */}
            <div className="w-full flex justify-center bg-neutral-950/60 p-4 rounded-2xl border border-neutral-800 overflow-hidden min-h-[780px]">
              <div 
                className="transition-all duration-300 ease-in-out shadow-2xl rounded-xl overflow-hidden border border-neutral-700/50 bg-white"
                style={{
                  width: viewMode === 'desktop' ? '600px' : '380px',
                  maxWidth: '100%',
                }}
              >
                <iframe
                  title="Participant Email Preview"
                  src={previewUrl}
                  className="w-full h-[850px] border-0"
                />
              </div>
            </div>

          </div>

        </div>

      </div>
    </div>
  );
}
