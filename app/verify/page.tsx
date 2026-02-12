"use client"

import { useState, useRef, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { FaShieldAlt, FaCheckCircle, FaFileAlt, FaArrowRight } from "react-icons/fa"
import { BiSearch } from "react-icons/bi"
import NewLandingDesktopNav from "@/components/newlanding-desktop-nav"
import MobileNav from "@/components/mobile-nav"
import { cn } from "@/lib/utils"
import { Caveat, Poppins } from "next/font/google"
import gsap from "gsap"
import { useGSAP } from "@gsap/react"

const caveat = Caveat({
  subsets: ["latin"],
  weight: ["400", "700"]
})

const poppins = Poppins({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"]
})

export default function VerifyLandingPage() {
  const router = useRouter()
  const [verificationId, setVerificationId] = useState("")
  const [error, setError] = useState("")
  
  const heroIconRef = useRef<HTMLDivElement>(null)
  const heroTitleRef = useRef<HTMLHeadingElement>(null)
  const heroDescRef = useRef<HTMLParagraphElement>(null)
  const formRef = useRef<HTMLDivElement>(null)
  const formLabelRef = useRef<HTMLLabelElement>(null)
  const formInputRef = useRef<HTMLInputElement>(null)
  const formButtonRef = useRef<HTMLButtonElement>(null)
  const featuresRef = useRef<HTMLDivElement>(null)
  const infoRef = useRef<HTMLDivElement>(null)

  useGSAP(() => {
    const tl = gsap.timeline({ defaults: { ease: "power2.out" } })
    
    // Animate hero elements
    if (heroIconRef.current) {
      tl.from(heroIconRef.current, {
        opacity: 0,
        scale: 0.8,
        duration: 0.6,
        delay: 0.1
      })
    }
    
    if (heroTitleRef.current) {
      tl.from(heroTitleRef.current, {
        opacity: 0,
        y: 20,
        duration: 0.7
      }, "-=0.3")
    }
    
    if (heroDescRef.current) {
      tl.from(heroDescRef.current, {
        opacity: 0,
        y: 15,
        duration: 0.6
      }, "-=0.4")
    }
    
    // Animate form
    if (formRef.current) {
      tl.from(formRef.current, {
        opacity: 0,
        y: 30,
        duration: 0.8
      }, "-=0.3")
    }
    
    // Animate form children individually
    if (formLabelRef.current) {
      tl.from(formLabelRef.current, {
        opacity: 0,
        x: -10,
        duration: 0.5
      }, "-=0.5")
    }
    
    if (formInputRef.current) {
      tl.from(formInputRef.current, {
        opacity: 0,
        y: 10,
        duration: 0.5
      }, "-=0.4")
    }
    
    if (formButtonRef.current) {
      tl.from(formButtonRef.current, {
        opacity: 0,
        scale: 0.95,
        duration: 0.5
      }, "-=0.3")
    }
    
    // Animate feature cards
    if (featuresRef.current?.children) {
      tl.from(Array.from(featuresRef.current.children), {
        opacity: 0,
        y: 25,
        scale: 0.98,
        duration: 0.7,
        stagger: 0.12
      }, "-=0.4")
    }
    
    // Animate info card
    if (infoRef.current) {
      tl.from(infoRef.current, {
        opacity: 0,
        y: 20,
        duration: 0.6
      }, "-=0.5")
    }
  }, [])

  const handleVerify = (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!verificationId.trim()) {
      setError("Please enter a verification ID")
      return
    }

    // Navigate to the verification page
    router.push(`/verify/${verificationId.trim()}`)
  }

  return (
    <div className="min-h-screen bg[#F9FAFB]/20 relative overflow-hidden">
      {/* Dot Background Section */}
      <div
        className="relative bg-[#F9FAFB] overflow-hidden pb-32"
        style={{
          borderBottomLeftRadius: '30% 100px',
          borderBottomRightRadius: '30% 100px'
        }}
      >
        {/* Dot Background Pattern */}
        <div
          className={cn(
            "absolute inset-x-0 top-0 h-full z-0",
            "[background-size:20px_20px]",
            "[background-image:radial-gradient(#C5C8C9_1.2px,transparent_1px)]",
            "[mask-image:radial-gradient(ellipse_60%_80%_at_50%_0%,black_15%,transparent_100%)]"
          )}
        />

        {/* Navigation */}
        <NewLandingDesktopNav />
        <MobileNav />

        {/* Hero Section */}
        <div className="relative z-10 px-6 py-8 lg:px-12 lg:py-16 mt-10">
          <div className="max-w-4xl mx-auto space-y-8">
            {/* Header */}
            <div className="text-center space-y-4">
              <div className="flex justify-center">
                <div ref={heroIconRef} className="w-16 h-16 bg-[#1A2517] border border-[#1A2517] rounded-xl flex items-center justify-center">
                  <FaShieldAlt className="w-8 h-8 text-[#ACC8A2]" />
                </div>
              </div>
              <h1 ref={heroTitleRef} className={`${poppins.className} text-4xl md:text-5xl lg:text-6xl font-bold text-[#1A2517]`}>
                Verify Certificate
              </h1>
              <p ref={heroDescRef} className={`${poppins.className} text-base text-[#1A2517]/70 max-w-2xl mx-auto`}>
                Enter the unique verification ID to check the authenticity and details of any certificate
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="relative z-10 px-6 -mt-20 lg:px-12 pb-16">
        <div className="max-w-4xl mx-auto space-y-8">
          {/* Verification Form */}
          <Card ref={formRef} className="bg-white border-[#ACC8A2]">
            <CardContent className="p-6">
              <form onSubmit={handleVerify} className="space-y-6">
                <div>
                  <label ref={formLabelRef} htmlFor="verificationId" className={`${poppins.className} block text-sm font-medium text-[#1A2517] mb-2`}>
                    Verification ID
                  </label>
                  <Input
                    ref={formInputRef}
                    id="verificationId"
                    type="text"
                    placeholder="e.g., 550e8400-e29b-41d4-a716-446655440000"
                    value={verificationId}
                    onChange={(e) => {
                      setVerificationId(e.target.value)
                      setError("")
                    }}
                    className={`${poppins.className} text-sm h-10 bg-white border-[#ACC8A2] text-[#1A2517] placeholder:text-[#1A2517]/40`}
                  />
                  {error && (
                    <p className={`${poppins.className} mt-2 text-sm text-red-600`}>{error}</p>
                  )}
                  <p className={`${poppins.className} mt-2 text-xs text-[#1A2517]/60`}>
                    The verification ID can be found on your certificate or in the email you received
                  </p>
                </div>

                <Button
                  ref={formButtonRef}
                  type="submit"
                  className={`${poppins.className} w-auto bg-[#1A2517] hover:bg-[#1A2517]/90 text-[#ACC8A2] text-sm px-6 py-2 h-10`}
                >
                  <BiSearch className="w-4 h-4 mr-2" />
                  Verify Certificate
                  <FaArrowRight className="w-3 h-3 ml-2" />
                </Button>
              </form>
            </CardContent>
          </Card>

          {/* Features */}
          <div ref={featuresRef} className="grid md:grid-cols-3 gap-6">
            <Card className="border-[#ACC8A2] bg-white">
              <CardContent className="p-6 text-center">
                <div className="w-10 h-10 bg-[#ACC8A2]/30 border border-[#ACC8A2] rounded-lg flex items-center justify-center mx-auto mb-3">
                  <FaCheckCircle className="w-5 h-5 text-[#1A2517]" />
                </div>
                <CardTitle className={`${poppins.className} text-base font-semibold text-[#1A2517] mb-2`}>Instant Verification</CardTitle>
                <CardDescription className={`${poppins.className} text-sm text-[#1A2517]/70`}>
                  Get immediate confirmation of certificate authenticity
                </CardDescription>
              </CardContent>
            </Card>

            <Card className="border-[#ACC8A2] bg-white">
              <CardContent className="p-6 text-center">
                <div className="w-10 h-10 bg-[#ACC8A2]/30 border border-[#ACC8A2] rounded-lg flex items-center justify-center mx-auto mb-3">
                  <FaShieldAlt className="w-5 h-5 text-[#1A2517]" />
                </div>
                <CardTitle className={`${poppins.className} text-base font-semibold text-[#1A2517] mb-2`}>Secure & Tamper-Proof</CardTitle>
                <CardDescription className={`${poppins.className} text-sm text-[#1A2517]/70`}>
                  Protected with SHA-256 hash verification
                </CardDescription>
              </CardContent>
            </Card>

            <Card className="border-[#ACC8A2] bg-white">
              <CardContent className="p-6 text-center">
                <div className="w-10 h-10 bg-[#ACC8A2]/30 border border-[#ACC8A2] rounded-lg flex items-center justify-center mx-auto mb-3">
                  <FaFileAlt className="w-5 h-5 text-[#1A2517]" />
                </div>
                <CardTitle className={`${poppins.className} text-base font-semibold text-[#1A2517] mb-2`}>Complete Details</CardTitle>
                <CardDescription className={`${poppins.className} text-sm text-[#1A2517]/70`}>
                  View all certificate information and metadata
                </CardDescription>
              </CardContent>
            </Card>
          </div>

          {/* Info */}
          <Card ref={infoRef} className="border-[#ACC8A2] bg-white">
            <CardContent className="p-6">
              <div className="flex items-start gap-3">
                <FaFileAlt className="w-5 h-5 text-[#1A2517] mt-0.5 flex-shrink-0" />
                <div className="flex-1">
                  <p className={`${poppins.className} font-medium text-[#1A2517] mb-2`}>Where to find your Verification ID?</p>
                  <ul className={`${poppins.className} text-sm text-[#1A2517]/70 space-y-1 list-disc list-inside`}>
                    <li>Check the email you received with your certificate</li>
                    <li>Look for the verification ID on your certificate document</li>
                    <li>Contact the organization that issued your certificate</li>
                  </ul>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
