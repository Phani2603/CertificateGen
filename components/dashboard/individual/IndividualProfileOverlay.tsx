"use client"

import { useEffect, useMemo, useState, type ReactNode } from "react"
import { useSession } from "next-auth/react"
import { ExpandableScreen, ExpandableScreenContent, ExpandableScreenTrigger } from "@/components/ui/expandable-screen"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { MyCertificatesSection } from "@/components/dashboard/individual/MyCertificatesSection"
import { Badge } from "@/components/ui/badge"
import { Mail, Phone, Shield, Sparkles, Loader2, Palette } from "lucide-react"
import {
  FloatingPanelRoot,
  FloatingPanelTrigger,
  FloatingPanelContent,
  FloatingPanelBody,
  FloatingPanelButton,
} from "@/components/ui/floating-panel"
import clsx from "clsx"

interface IndividualProfileOverlayProps {
  trigger: ReactNode
}

interface ProfileForm {
  name: string
  email: string
  phone: string
  bio: string
  image: string
}

export function IndividualProfileOverlay({ trigger }: IndividualProfileOverlayProps) {
  const { data: session, status, update } = useSession()
  const [formData, setFormData] = useState<ProfileForm>({
    name: "",
    email: "",
    phone: "",
    bio: "",
    image: "",
  })
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [certCount, setCertCount] = useState<number | null>(null)
  const [viewMode, setViewMode] = useState<"profile" | "certs">("profile")
  const [bannerKey, setBannerKey] = useState<string>("ind-banner-default")
  const [banner, setBanner] = useState<{ from: string; to: string }>(() => {
    if (typeof window === "undefined") return { from: "#21808D", to: "#1a6370" }
    try {
      const stored = localStorage.getItem("ind-banner-default")
      if (stored) {
        const parsed = JSON.parse(stored)
        if (parsed?.from && parsed?.to) return parsed
      }
    } catch (e) {
      console.warn("Failed to read banner preference")
    }
    return { from: "#21808D", to: "#1a6370" }
  })

  useEffect(() => {
    if (session?.user?.email) {
      setBannerKey(`ind-banner-${session.user.email}`)
    }
  }, [session?.user?.email])

  const bannerOptions = [
    { from: "#FF6B3D", to: "#FF6B3D" },
    { from: "#16D36B", to: "#16D36B" },
    { from: "#2F68FF", to: "#2F68FF" },
    { from: "#F23BF2", to: "#F23BF2" },
    { from: "#26E7E7", to: "#26E7E7" },
    { from: "#E8E83A", to: "#E8E83A" },
  ]

  const initials = useMemo(() => {
    return (
      formData.name
        ?.split(" ")
        .map((n) => n[0])
        .join("")
        .toUpperCase() || "U"
    )
  }, [formData.name])

  useEffect(() => {
    if (status !== "authenticated") return

    const loadProfile = async () => {
      try {
        const response = await fetch("/api/profile")
        const data = await response.json()

        if (data.success) {
          setFormData({
            name: data.user.name || "",
            email: data.user.email || "",
            phone: data.user.phone || "",
            bio: data.user.bio || "",
            image: data.user.image || "",
          })
        }
      } catch (error) {
        console.error("Failed to load profile:", error)
      } finally {
        setIsLoading(false)
      }
    }

    const loadCertificates = async () => {
      try {
        const res = await fetch("/api/my-certificates")
        const data = await res.json()
        if (data.success) {
          setCertCount((data.certificates || []).length)
        }
      } catch (error) {
        console.error("Failed to load certificates:", error)
      }
    }

    loadProfile()
    loadCertificates()
  }, [status])

  useEffect(() => {
    if (!bannerKey || typeof window === "undefined") return
    const storedBanner = localStorage.getItem(bannerKey)
    if (storedBanner) {
      try {
        const parsed = JSON.parse(storedBanner)
        if (parsed?.from && parsed?.to) {
          setBanner(parsed)
          return
        }
      } catch (e) {
        console.warn("Failed to parse banner preference")
      }
    }
    // Fallback to default if user-scoped preference is missing
    const defaultStored = localStorage.getItem("ind-banner-default")
    if (defaultStored) {
      try {
        const parsedDefault = JSON.parse(defaultStored)
        if (parsedDefault?.from && parsedDefault?.to) setBanner(parsedDefault)
      } catch (e) {
        console.warn("Failed to parse default banner preference")
      }
    }
  }, [bannerKey])

  useEffect(() => {
    if (!bannerKey || typeof window === "undefined") return
    try {
      localStorage.setItem(bannerKey, JSON.stringify(banner))
      // Also keep a default fallback so the banner sticks before session loads
      localStorage.setItem("ind-banner-default", JSON.stringify(banner))
    } catch (e) {
      console.warn("Failed to persist banner preference")
    }
  }, [banner, bannerKey])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSaving(true)
    try {
      const response = await fetch("/api/profile", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: formData.name,
          phone: formData.phone,
          bio: formData.bio,
          image: formData.image,
        }),
      })

      const data = await response.json()
      if (data.success) {
        await update({ name: data.user.name, image: data.user.image })
      }
    } catch (error) {
      console.error("Failed to update profile:", error)
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <ExpandableScreen
      layoutId="individual-profile"
      contentRadius="28px"
      triggerRadius="9999px"
      lockScroll={false}
      animationDuration={0}
    >
      <ExpandableScreenTrigger className="align-middle">
        {trigger}
      </ExpandableScreenTrigger>

      <ExpandableScreenContent
        className="bg-white text-gray-900 dark:bg-neutral-950 dark:text-gray-100 shadow-2xl border border-black/5 dark:border-white/10 max-w-5xl mx-auto max-h-[90vh] overflow-y-auto no-scrollbar"
        overlayClassName="backdrop-blur-md bg-black/30"
      >
        <style>{`.no-scrollbar{scrollbar-width:none;-ms-overflow-style:none;}.no-scrollbar::-webkit-scrollbar{display:none;}`}</style>
        <div className="grid md:grid-cols-[320px,1fr] h-full w-full">
          <aside
            className="text-white p-6 md:p-8 flex flex-col gap-6"
            style={{
              background: `linear-gradient(180deg, ${banner.from}, ${banner.to})`,
            }}
          >
            <div className="space-y-4">
              <div className="flex items-start gap-4">
                <Avatar className="h-20 w-20 ring-2 ring-white/70 shrink-0">
                  <AvatarImage src={formData.image} alt={formData.name} />
                  <AvatarFallback className="bg-white/10 text-white text-2xl">{initials}</AvatarFallback>
                </Avatar>
                <div className="flex-1 min-w-0 space-y-1.5">
                  <p className="text-xs text-white/70 uppercase tracking-wider">Signed in</p>
                  <h3 className="text-2xl font-bold leading-tight truncate">{formData.name || session?.user?.name}</h3>
                  <div className="flex items-center gap-2 text-sm text-white/80">
                    <Mail className="h-3.5 w-3.5 shrink-0" />
                    <span className="truncate">{formData.email || session?.user?.email}</span>
                  </div>
                </div>
              </div>

              <div className="flex items-start justify-between gap-3">
                <div className="flex flex-wrap items-center gap-2">
                  <Badge variant="outline" className="border-white/40 text-white bg-white/10 text-xs">
                    <Shield className="h-3 w-3 mr-1.5" /> Individual
                  </Badge>
                  {certCount !== null && (
                    <Badge variant="outline" className="border-white/40 text-white bg-white/10 text-xs px-3 py-1.5">
                      <span className="font-semibold text-lg mr-1.5">{certCount}</span>
                      <span className="text-white/70">certificates</span>
                    </Badge>
                  )}
                </div>

                <div className="flex items-center gap-2 shrink-0">
                <Button
                  variant="secondary"
                  size="sm"
                  className="bg-white text-[#1a4a52] hover:bg-white/90 text-sm px-3 py-2"
                  onClick={() => setViewMode("certs")}
                >
                  My Certificates
                </Button>

                <FloatingPanelRoot>
                  <FloatingPanelTrigger title="Banner color" className="h-10 px-3 text-sm gap-2 bg-white/20 text-white border-white/40">
                    <Palette className="h-4 w-4" />
                    Colors
                  </FloatingPanelTrigger>
                  <FloatingPanelContent className="w-52 rounded-xl overflow-hidden shadow-xl">
                    <FloatingPanelBody className="bg-white dark:bg-zinc-900 grid grid-cols-3 gap-3 p-4">
                      {bannerOptions.map((opt, idx) => (
                        <FloatingPanelButton
                          key={`${opt.from}-${idx}`}
                          onClick={() => setBanner(opt)}
                          className="h-12 w-12 p-0 rounded-full border border-black/10 dark:border-white/10"
                          aria-label="Select color"
                        >
                          <span
                            className="h-full w-full rounded-full block"
                            style={{ background: opt.from }}
                          />
                        </FloatingPanelButton>
                      ))}
                    </FloatingPanelBody>
                  </FloatingPanelContent>
                </FloatingPanelRoot>
                </div>
              </div>
            </div>
          </aside>

          <section className="p-6 md:p-8">
            {viewMode === "profile" ? (
              <>
                <div className="flex items-center justify-between gap-4 mb-6">
                  <div>
                    <p className="text-sm text-gray-500 dark:text-gray-400">Profile</p>
                    <h2 className="text-2xl font-bold">Your details</h2>
                  </div>
                  {isSaving && <Loader2 className="h-5 w-5 animate-spin text-[#21808D]" />}
                </div>

                <form onSubmit={handleSubmit} className="space-y-5">
                  <div className="grid md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="name">Full Name</Label>
                      <Input
                        id="name"
                        value={formData.name}
                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                        placeholder="Your name"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="email">Email</Label>
                      <Input id="email" value={formData.email} disabled className="bg-gray-100 dark:bg-neutral-900" />
                    </div>
                  </div>

                  <div className="grid md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="phone" className="flex items-center gap-2"><Phone className="h-4 w-4" /> Phone</Label>
                      <Input
                        id="phone"
                        value={formData.phone}
                        onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                        placeholder="Add a contact number"
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="bio" className="flex items-center gap-2"><Sparkles className="h-4 w-4" /> Bio</Label>
                    <Textarea
                      id="bio"
                      value={formData.bio}
                      onChange={(e) => setFormData({ ...formData, bio: e.target.value })}
                      placeholder="Tell us about yourself"
                      className="resize-none"
                      rows={3}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="image">Avatar URL</Label>
                    <Input
                      id="image"
                      type="url"
                      value={formData.image}
                      onChange={(e) => setFormData({ ...formData, image: e.target.value })}
                      placeholder="https://example.com/avatar.jpg"
                    />
                  </div>

                  <div className="flex items-center gap-3">
                    <Button type="submit" className="bg-[#21808D] hover:bg-[#1a6570]" disabled={isSaving}>
                      {isSaving ? "Saving..." : "Save changes"}
                    </Button>
                    <Button type="button" variant="outline" onClick={() => setViewMode("certs")}>
                      Jump to My Certificates
                    </Button>
                  </div>
                </form>
              </>
            ) : (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-500 dark:text-gray-400">Certificates</p>
                    <h2 className="text-2xl font-bold">My Certificates</h2>
                  </div>
                  <Button variant="ghost" size="sm" onClick={() => setViewMode("profile")}>Back to Profile</Button>
                </div>
                <MyCertificatesSection userId={session?.user?.id as string | undefined} />
              </div>
            )}
          </section>
        </div>

        {isLoading && (
          <div className="absolute inset-0 bg-white/70 dark:bg-black/50 backdrop-blur-sm flex items-center justify-center">
            <Loader2 className="h-8 w-8 animate-spin text-[#21808D]" />
          </div>
        )}
      </ExpandableScreenContent>
    </ExpandableScreen>
  )
}
