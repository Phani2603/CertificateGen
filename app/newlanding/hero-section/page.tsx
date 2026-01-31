"use client"

import { useState } from "react"
import Image from "next/image"
import Link from "next/link"
import NeumorphButton from "@/components/ui/neumorph-button"
import { Caveat, Poppins } from "next/font/google"
import { cn } from "@/lib/utils"
import AnimatedContent from "@/components/AnimatedContent"
import CookieConsent from "@/components/cookie-consent"
import ScrollRevealSection from "@/components/ScrollRevealSection"
import { SectionSeparator } from "@/components/ui/section-separator"
import ReadyToStart from "@/components/ready-to-start"
import SiteFooterGlassmorphism from "@/components/site-footer-glassmorphism"
import ScrollToTop from "@/components/scroll-to-top"
import MobileNav from "@/components/mobile-nav"

const caveat = Caveat({
  subsets: ["latin"],
  weight: ["400", "700"]
})

// Add styles for the section
const styles = `
  .numbered-box {
    min-width: 60px;
    height: 56px;
    background: white;
    border-radius: 20px;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 28px;
    font-weight: 600;
    color: #000;
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08);
    position: relative;
    padding: 0 16px;
  }
  
  @media (min-width: 1024px) {
    .numbered-box {
      min-width: 80px;
      height: 64px;
      font-size: 36px;
      padding: 0 20px;
      border-radius: 24px;
    }
  }
  
  .numbered-box::before {
    content: '';
    position: absolute;
    inset: 0;
    border-radius: 20px;
    padding: 1px;
    background: linear-gradient(135deg, rgba(255,255,255,0.8) 0%, rgba(255,255,255,0) 24%, #FF6767 47%, #738DF8 81%, #00C 100%);
    -webkit-mask: linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0);
    -webkit-mask-composite: xor;
    mask-composite: exclude;
  }
  
  @media (min-width: 1024px) {
    .numbered-box::before {
      border-radius: 24px;
    }
  }
  
  .content-box-gradient {
    position: relative;
    background: white;
  }
  
  .content-box-gradient::before {
    content: '';
    position: absolute;
    inset: 0;
    border-radius: 16px;
    padding: 1px;
    background: linear-gradient(135deg, rgba(255,255,255,0.8) 0%, rgba(255,255,255,0) 24%, #FF6767 47%, #738DF8 81%, #00C 100%);
    -webkit-mask: linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0);
    -webkit-mask-composite: xor;
    mask-composite: exclude;
  }
  
  @media (min-width: 1024px) {
    .content-box-gradient::before {
      border-radius: 24px;
    }
  }
  
  .gradient-border {
    position: relative;
    background: white;
    border-radius: 20px;
  }
  
  @media (min-width: 1024px) {
    .gradient-border {
      border-radius: 24px;
    }
  }
  
  .gradient-border::before {
    content: '';
    position: absolute;
    inset: 0;
    border-radius: 20px;
    padding: 1px;
    background: linear-gradient(135deg, rgba(255,255,255,0.8) 0%, rgba(255,255,255,0) 24%, #FF6767 47%, #738DF8 81%, #00C 100%);
    -webkit-mask: linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0);
    -webkit-mask-composite: xor;
    mask-composite: exclude;
  }
  
  @media (min-width: 1024px) {
    .gradient-border::before {
      border-radius: 24px;
    }
  }
  
  .highlight-yellow {
    background: linear-gradient(180deg, transparent 50%, #fef08a 50%);
    padding: 0 8px;
  }
  
  .tab-button-container {
    position: relative;
    padding-left: 0;
  }
  
  @media (min-width: 1024px) {
    .tab-button-container {
      padding-left: 20px;
    }
  }
  
  .tab-progress-bar {
    position: absolute;
    left: 0;
    top: 40px;
    bottom: 0;
    width: 4px;
    background: #000;
    border-radius: 2px;
    display: none;
  }
  
  @media (min-width: 1024px) {
    .tab-progress-bar {
      display: block;
    }
  }
  
  .tab-progress-bar::after {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    height: 33.33%;
    background: #000;
    border-radius: 2px;
    transition: all 0.3s ease;
    opacity: 0.3;
  }
  
  .tab-progress-bar.step-2::after {
    height: 66.66%;
  }
  
  .tab-progress-bar.step-3::after {
    height: 100%;
  }
  
  .tab-button-gradient {
    position: relative;
    transition: all 0.2s ease;
    background: white;
  }
  
  .tab-button-gradient::before {
    content: '';
    position: absolute;
    inset: 0;
    border-radius: 12px;
    padding: 1px;
    background: linear-gradient(135deg, rgba(255,255,255,0.8) 0%, rgba(255,255,255,0) 24%, #FF6767 47%, #738DF8 81%, #00C 100%);
    -webkit-mask: linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0);
    -webkit-mask-composite: xor;
    mask-composite: exclude;
    opacity: 0;
    transition: opacity 0.2s ease;
  }
  
  .tab-button-gradient.active::before {
    opacity: 1;
  }
`

export default function NewLandingPage() {
  const [activeTab, setActiveTab] = useState("howItWorks")

  const renderTabContent = () => {
    switch (activeTab) {
      case "howItWorks":
        return (
          <div className="space-y-4 sm:space-y-5 lg:space-y-6">
            {/* Step 1 */}
            <div className="flex gap-3 sm:gap-4 lg:gap-5 items-start">
              <div className="numbered-box shrink-0">1</div>
              <div className="content-box-gradient flex-1 bg-white rounded-2xl lg:rounded-3xl p-4 sm:p-5 lg:p-6 shadow-sm hover:shadow-md transition-shadow duration-200">
                <p className="text-gray-700 font-poppins text-sm sm:text-base leading-relaxed">
                  Sign in with Google and create your college/company organization or join an existing one.
                </p>
              </div>
            </div>

            {/* Step 2 */}
            <div className="flex gap-3 sm:gap-4 lg:gap-5 items-start">
              <div className="numbered-box shrink-0">2</div>
              <div className="content-box-gradient flex-1 bg-white rounded-2xl lg:rounded-3xl p-4 sm:p-5 lg:p-6 shadow-sm hover:shadow-md transition-shadow duration-200">
                <p className="text-gray-700 font-poppins text-sm sm:text-base leading-relaxed">
                  Upload your custom certificate design and configure text fields like name, date, and event details.
                </p>
              </div>
            </div>

            {/* Step 3 */}
            <div className="flex gap-3 sm:gap-4 lg:gap-5 items-start">
              <div className="numbered-box shrink-0">3</div>
              <div className="content-box-gradient flex-1 bg-white rounded-2xl lg:rounded-3xl p-4 sm:p-5 lg:p-6 shadow-sm hover:shadow-md transition-shadow duration-200">
                <p className="text-gray-700 font-poppins text-sm sm:text-base leading-relaxed">
                  Upload a CSV file with recipient details. Auto-map columns to certificate fields.
                </p>
              </div>
            </div>

            {/* Step 4 */}
            <div className="flex gap-3 sm:gap-4 lg:gap-5 items-start">
              <div className="numbered-box shrink-0">4</div>
              <div className="content-box-gradient flex-1 bg-white rounded-2xl lg:rounded-3xl p-4 sm:p-5 lg:p-6 shadow-sm hover:shadow-md transition-shadow duration-200">
                <p className="text-gray-700 font-poppins text-sm sm:text-base leading-relaxed">
                  Generate all certificates instantly and send them via email. Each certificate includes a verification link.
                </p>
              </div>
            </div>
          </div>
        )

      case "forWhom":
        return (
          <div className="space-y-4 sm:space-y-5 lg:space-y-6">
            {/* Category Pills */}
            <div className="grid grid-cols-1 xs:grid-cols-2 sm:grid-cols-2 lg:grid-cols-3 gap-2 sm:gap-3">
              <div className="content-box-gradient bg-white rounded-full px-3 sm:px-4 py-2 shadow-sm text-center">
                <p className="text-gray-800 font-poppins text-xs sm:text-sm font-medium">Educational Institution</p>
              </div>
              <div className="content-box-gradient bg-white rounded-full px-3 sm:px-4 py-2 shadow-sm text-center">
                <p className="text-gray-800 font-poppins text-xs sm:text-sm font-medium">Event Organizers</p>
              </div>
              <div className="content-box-gradient bg-white rounded-full px-3 sm:px-4 py-2 shadow-sm text-center">
                <p className="text-gray-800 font-poppins text-xs sm:text-sm font-medium">Companies</p>
              </div>
              <div className="content-box-gradient bg-white rounded-full px-3 sm:px-4 py-2 shadow-sm text-center">
                <p className="text-gray-800 font-poppins text-xs sm:text-sm font-medium">Clubs & Communities</p>
              </div>
              <div className="content-box-gradient bg-white rounded-full px-3 sm:px-4 py-2 shadow-sm text-center">
                <p className="text-gray-800 font-poppins text-xs sm:text-sm font-medium">Skill Platforms</p>
              </div>
              <div className="content-box-gradient bg-white rounded-full px-3 sm:px-4 py-2 shadow-sm text-center">
                <p className="text-gray-800 font-poppins text-xs sm:text-sm font-medium">NGOs / GOs</p>
              </div>
            </div>

            {/* Description Box */}
            <div className="content-box-gradient bg-white rounded-2xl lg:rounded-3xl p-4 sm:p-5 lg:p-6 shadow-sm">
              <p className="text-gray-800 font-poppins text-sm sm:text-base leading-relaxed">
                Generate all certificates instantly and send them via email. Each certificate includes a verification link.
              </p>
            </div>
          </div>
        )

      case "whyChoose":
        return (
          <div className="content-box-gradient bg-white rounded-2xl lg:rounded-3xl p-4 sm:p-5 lg:p-6 shadow-sm">
            <p className="text-gray-800 font-poppins text-sm sm:text-base leading-relaxed">
              Generate all certificates instantly and send them via email. Each certificate includes a verification link.
            </p>
          </div>
        )

      default:
        return null
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 relative overflow-hidden">
      {/* Dot Background - Moved to Top Level */}
      <div
        className="relative bg-[#F9FAFB] overflow-hidden pb-12 sm:pb-20 lg:pb-28"
        style={{
          borderBottomLeftRadius: '30% 100px',
          borderBottomRightRadius: '30% 100px'
        }}
      >
        {/* Dot Background - Scoped to this container with Top Focus & Faded Edges */}
        <div
          className={cn(
            "absolute inset-x-0 top-0 h-full z-0", // restored full height but masked
            "[background-size:20px_20px]",
            "[background-image:radial-gradient(#c5c8c9_1.2px,transparent_1px)]",
            "[mask-image:radial-gradient(ellipse_60%_80%_at_50%_0%,black_40%,transparent_100%)]" // Fades out at edges and bottom, focused at top
          )}
        />


        {/* Navigation */}
        {/* Navigation */}
        {/* ============================== */}
        {/* UNIFIED NAVIGATION             */}
        {/* ============================== */}
        <nav className="hidden md:flex fixed top-0 left-0 right-0 w-full z-50 items-center justify-between px-6 py-4 lg:px-12 bg-transparent pointer-events-none">

          {/* LOGO */}
          <div className="pointer-events-auto">
            <Link href="/" className="flex flex-col items-center cursor-pointer group">
              <div className="text-2xl font-semibold text-gray-900 font-raleway group-hover:opacity-80 transition-opacity">
                Certiflo
              </div>
              <div className="text-sm text-gray-600 font-medium font-pacifico group-hover:opacity-80 transition-opacity">
                by SENEMENT
              </div>
            </Link>
          </div>

          {/* DESKTOP CENTER LINKS (Absolute Centered) */}
          <div className="hidden md:flex absolute left-1/2 top-1/2 transform -translate-x-1/2 -translate-y-1/2 items-center space-x-1 bg-white p-1.5 rounded-full shadow-[0_2px_10px_rgba(0,0,0,0.05)] border border-gray-100 pointer-events-auto">
            <Link href="https://senement.com" target="_blank" className="text-gray-600 hover:text-black px-5 py-2 rounded-full hover:bg-gray-50 transition-all duration-200 text-sm font-medium">
              Senement
            </Link>
            <Link href="/" className="text-gray-600 hover:text-black px-5 py-2 rounded-full hover:bg-gray-50 transition-all duration-200 text-sm font-medium">
              Pricing
            </Link>
            <Link href="#" className="text-gray-600 hover:text-black px-5 py-2 rounded-full hover:bg-gray-50 transition-all duration-200 text-sm font-medium">
              Verify
            </Link>
            <Link href="#" className="text-gray-600 hover:text-black px-5 py-2 rounded-full hover:bg-gray-50 transition-all duration-200 text-sm font-medium">
              Contact
            </Link>
          </div>

          {/* DESKTOP RIGHT ACTIONS */}
          <div className="hidden md:flex items-center gap-3 pointer-events-auto">
            <button className="px-5 py-2 text-sm font-semibold text-gray-700 hover:text-black transition-colors">
              Login
            </button>
            <button className="px-5 py-2 text-sm font-semibold text-white bg-black rounded-full hover:bg-gray-800 transition-colors shadow-lg active:scale-95 transform duration-100">
              Join Now
            </button>
          </div>



        </nav>

        {/* MOBILE NAVIGATION */}
        <MobileNav />

        {/* Hero Section */}
        {/* Hero Section */}
        <div className="relative w-full mt-10 overflow-hidden">


          <div className="relative z-10 px-6 py-8 lg:px-12 lg:py-16">
            <div className="max-w-7xl mx-auto">
              <div className="grid lg:grid-cols-2 gap-8 lg:gap-12 items-center">
                {/* Left Content */}
                {/* Left Content */}
                <div className="space-y-6 lg:space-y-8 order-1">
                  <AnimatedContent
                    distance={60}
                    direction="vertical"
                    reverse={false}
                    delay={0}
                  >
                    <div className="space-y-4 lg:space-y-6">
                      <h1 className="text-3xl sm:text-4xl lg:text-5xl xl:text-6xl leading-tight">
                        <div className={`${caveat.className} font-semibold text-4xl sm:text-5xl lg:text-6xl xl:text-7xl text-gray-900`}>
                          Certificate Generation And
                        </div>
                        <div className={`${caveat.className} font-semibold text-4xl sm:text-5xl lg:text-6xl xl:text-7xl mt-2 text-gray-900`}>
                          Issuance{" "}
                          <span className="relative inline-block">
                            Made Simple
                            <div className="absolute -bottom-1 lg:bottom-0 left-0 w-full h-6 lg:h-15 bg-emerald-400 rounded-full -z-10"></div>
                          </span>
                        </div>
                      </h1>

                      <p className="text-medium lg:text-lg text-gray-900 max-w-lg leading-relaxed font-poppins">
                        Create, Send, And Verify Certificates For Events, Programs, And Organizations, Securely
                        And At Scale.
                      </p>
                    </div>
                  </AnimatedContent>

                  {/* CTA Buttons */}
                  <AnimatedContent
                    distance={40}
                    direction="vertical"
                    reverse={false}
                    delay={0.2}
                  >
                    <div className="flex flex-col sm:flex-row gap-3 lg:gap-4">
                      <NeumorphButton size="medium" intent="primary" className="shadow-[2px_2px_5px_rgba(0,0,0,0.1),-2px_-2px_5px_rgba(255,255,255,0.7)] transition-all duration-50">
                        Contact Us
                      </NeumorphButton>
                      <NeumorphButton intent={"default"} className="shadow-[2px_2px_5px_rgba(0,0,0,0.1),-2px_-2px_5px_rgba(255,255,255,0.7)]">                  Create Certificate
                      </NeumorphButton>
                    </div>
                  </AnimatedContent>

                  {/* Trust Badge */}
                  <AnimatedContent
                    distance={40}
                    direction="vertical"
                    reverse={false}
                    delay={0.3}
                  >
                    <div className="pt-2 lg:pt-4">
                      <p className="text-sm text-gray-500 font-poppins">
                        No Credit Card Required • Free For Early Partners*
                      </p>
                    </div>
                  </AnimatedContent>
                </div>

                {/* Right Content - Certificate Preview */}
                <AnimatedContent
                  distance={60}
                  direction="vertical"
                  reverse={false}
                  delay={0.2}
                  className="relative order-2"
                >
                  <div className="relative max-w-xs sm:max-w-sm lg:max-w-md mx-auto lg:mx-0">
                    {/* Main Certificate Display using verifyimg.svg */}
                    <div className="relative">
                      <Image
                        src="/verifyimg.svg"
                        alt="Certificate Verification Interface"
                        width={400}
                        height={320}
                        className="w-full h-auto rounded-lg lg:rounded-xl shadow-lg lg:shadow-xl"
                      />

                      {/* Certificate Verified Badge */}
                      <div className="absolute -top-2 -left-2 lg:-top-3 lg:-left-3 bg-emerald-100 rounded-full p-1.5 lg:p-2 shadow-md">
                        <div className="flex items-center space-x-1">
                          <div className="w-1.5 h-1.5 lg:w-2 lg:h-2 bg-emerald-500 rounded-full"></div>
                          <span className="text-[10px] lg:text-xs font-medium text-emerald-700 font-poppins">Verified</span>
                        </div>
                      </div>

                      {/* Verified Badge */}
                      <div className="absolute top-4 lg:top-6 -right-2 lg:-right-3 bg-white rounded-xl p-1.5 lg:p-2 shadow-md">
                        <div className={`${caveat.className} text-base lg:text-lg font-semibold text-gray-900`}>Verified</div>
                      </div>
                    </div>

                    {/* Verification Panel - Hidden on small screens */}
                    <div className="hidden sm:block absolute -bottom-4 lg:-bottom-6 -right-4 lg:-right-6 bg-white rounded-lg shadow-md p-2.5 lg:p-3 w-40 lg:w-52 transform -rotate-1">
                      <div className="space-y-1.5 lg:space-y-2">
                        <div className="flex items-center justify-between">
                          <span className={`${caveat.className} text-lg lg:text-xl font-semibold`}>Issued</span>
                          <div className="w-3 h-3 lg:w-4 lg:h-4 bg-emerald-400 rounded"></div>
                        </div>

                        <div className="space-y-0.5 lg:space-y-1">
                          <div className="text-[10px] lg:text-xs text-gray-500 font-poppins">Recipient Info</div>
                          <div className="space-y-0.5">
                            <div className="h-0.5 lg:h-1 bg-gray-200 rounded w-full"></div>
                            <div className="h-0.5 lg:h-1 bg-gray-200 rounded w-2/3"></div>
                          </div>
                        </div>

                        <div className="space-y-0.5 lg:space-y-1">
                          <div className="text-[10px] lg:text-xs text-gray-500 font-poppins">Verification</div>
                          <div className="space-y-0.5">
                            <div className="h-0.5 lg:h-1 bg-gray-200 rounded w-full"></div>
                            <div className="h-0.5 lg:h-1 bg-gray-200 rounded w-3/4"></div>
                            <div className="h-0.5 lg:h-1 bg-gray-200 rounded w-1/2"></div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </AnimatedContent>
              </div>
            </div>
          </div>

          {/* Verified Badge - Positioned at Bottom Center of the Curved Container */}
          <div className="absolute bottom-6 left-1/2 transform -translate-x-1/2 z-30 w-full flex justify-center pointer-events-none">
            <AnimatedContent
              distance={40}
              direction="vertical"
              reverse={false}
              delay={0.6}
              className="inline-block pointer-events-auto"
            >
              <div className="bg-white/90 backdrop-blur-sm border border-gray-100 shadow-[0_8px_30px_rgb(0,0,0,0.06)] rounded-full py-2 px-6 flex items-center space-x-2">
                <div className="w-1.5 h-1.5 lg:w-2 lg:h-2 rounded-full bg-blue-500 animate-pulse"></div>
                <span className={`${caveat.className} text-lg sm:text-xl font-bold text-gray-800 pt-1`}>
                  Verified Certification Partner
                </span>
              </div>
            </AnimatedContent>
          </div>
        </div>

      </div>


      {/* Trust Section - Outside the Grid */}
      <ScrollRevealSection>
        <div className="px-6 py-12 lg:py-16 bg-gray-50">
          <div className="max-w-7xl mx-auto">


            {/* Logos Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-7 gap-4 lg:gap-6 items-center justify-center">
              {/* Senement */}
              <div className="flex items-center justify-center">
                <span className="text-sm lg:text-lg font-extrabold text-gray-900 font-coda">Senement</span>
              </div>

              {/* Visey */}
              <div className="flex items-center justify-center">
                <span className="text-sm lg:text-lg font-extrabold text-gray-900 font-coda">Visey</span>
              </div>

              {/* KL University */}
              <div className="flex items-center justify-center">
                <span className="text-sm lg:text-lg font-extrabold text-gray-900 font-coda">KL University</span>
              </div>

              {/* S-Nest */}
              <div className="flex items-center justify-center">
                <span className="text-sm lg:text-lg font-extrabold text-gray-900 font-coda">S-Nest</span>
              </div>

              {/* Student Tribe */}
              <div className="flex items-center justify-center">
                <span className="text-sm lg:text-lg font-extrabold text-gray-900 font-coda">Student Tribe</span>
              </div>

              {/* Hashing Events */}
              <div className="flex items-center justify-center">
                <span className="text-sm lg:text-lg font-extrabold text-gray-900 font-coda">Hashing Events</span>
              </div>

              {/* 100 more + */}
              <div className="flex items-center justify-center">
                <span className={`${caveat.className} text-sm lg:text-3xl font-bold text-gray-900`}>100 more +</span>
              </div>
            </div>
          </div>
        </div>
      </ScrollRevealSection>

      {/* First Separator - Wide (Extending beyond the vertical grid) */}
      <div className="max-w-full mx-auto px-0">
        <SectionSeparator className="my-0 " />
      </div>

      {/* Continuous Grid Wrapper for Trust, Tabs, and Savings */}
      <div className="relative bg-gray-50 border-gray-200 overflow-hidden">
        {/* The Continuous Vertical Grid Lines */}
        <div className="absolute inset-0 max-w-[90%] mx-auto dashed-y-custom pointer-events-none z-0"></div>

        <div className="relative z-10">

          {/* Interactive Tabbed Section */}
          <ScrollRevealSection>
            <div className="px-6 py-12 sm:py-16 lg:py-20">
              <style jsx>{styles}</style>
              <div className="max-w-[88%] mx-auto">
                {/* Section Header */}
                <div className="text-center mb-8 sm:mb-12 lg:mb-16">
                  <span className={`highlight-yellow inline-block rounded-3xl text-3xl sm:text-3xl lg:text-5xl font-bold text-gray-900 max-w-2xl ${caveat.className}`}>
                    Verified Certification Partner
                  </span>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-[280px_1fr] gap-6 sm:gap-8 lg:gap-12 lg:items-center">
                  {/* Left Navigation */}
                  <div className="lg:col-span-1">
                    <div className="tab-button-container space-y-2 sm:space-y-3">
                      <div className={`tab-progress-bar ${activeTab === "howItWorks" ? "step-1" :
                        activeTab === "forWhom" ? "step-2" : "step-3"
                        }`}></div>

                      <div className="text-xs text-gray-400 font-poppins mb-4 sm:mb-6 uppercase tracking-wider font-medium">
                        {activeTab === "howItWorks" ? "Why Choose Us" :
                          activeTab === "forWhom" ? "How It Works" :
                            "For Whom Is It"}
                      </div>

                      <button
                        onClick={() => setActiveTab("howItWorks")}
                        className={`tab-button-gradient w-full text-left px-4 sm:px-5 py-3 sm:py-4 rounded-xl transition-all duration-200 font-poppins text-sm sm:text-base ${activeTab === "howItWorks"
                          ? "active bg-white shadow-md text-gray-900 font-semibold"
                          : "text-gray-600 hover:text-gray-900 hover:bg-gray-50"
                          }`}
                      >
                        How It Works
                      </button>

                      <button
                        onClick={() => setActiveTab("forWhom")}
                        className={`tab-button-gradient w-full text-left px-4 sm:px-5 py-3 sm:py-4 rounded-xl transition-all duration-200 font-poppins text-sm sm:text-base ${activeTab === "forWhom"
                          ? "active bg-white shadow-md text-gray-900 font-semibold"
                          : "text-gray-600 hover:text-gray-900 hover:bg-gray-50"
                          }`}
                      >
                        For Whom Is It
                      </button>

                      <button
                        onClick={() => setActiveTab("whyChoose")}
                        className={`tab-button-gradient w-full text-left px-4 sm:px-5 py-3 sm:py-4 rounded-xl transition-all duration-200 font-poppins text-sm sm:text-base ${activeTab === "whyChoose"
                          ? "active bg-white shadow-md text-gray-900 font-semibold"
                          : "text-gray-600 hover:text-gray-900 hover:bg-gray-50"
                          }`}
                      >
                        Why Choose Us
                      </button>
                    </div>
                  </div>

                  {/* Main Content Area */}
                  <div className="lg:col-span-1">
                    <div className="gradient-border relative bg-white rounded-2xl lg:rounded-3xl shadow-lg overflow-hidden">
                      {/* Subtle gradient overlay */}
                      <div className="absolute inset-0 bg-gradient-to-br from-indigo-50/10 via-transparent to-pink-50/10 pointer-events-none"></div>

                      {/* Content */}
                      <div className="relative z-10 p-6 sm:p-8 lg:p-12">
                        {renderTabContent()}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </ScrollRevealSection>

          <div className="max-w-[90%] mx-auto px-0">
            <SectionSeparator />
          </div>

          {/* What You Save Section */}
          <ScrollRevealSection>
            <div className="px-6 py-12 sm:py-16 lg:py-24 overflow-hidden relative">
              <div className="max-w-[88%] mx-auto relative z-10">
                {/* Section Header */}
                <div className="text-center mb-16 lg:mb-24">
                  <h2 className={`${caveat.className} text-4xl sm:text-5xl lg:text-7xl font-bold text-gray-900 relative inline-block`}>
                    What You Save ?
                    {/* Decorative Underline */}
                    <div className="absolute -bottom-6 lg:-bottom-6 left-1/2 transform -translate-x-1/2 w-48 lg:w-84">
                      <Image src="/underline-1.svg" alt="Underline" width={200} height={20} className="w-full h-auto" />
                    </div>
                  </h2>
                </div>

                {/* Grid Layout */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 lg:gap-12 relative">

                  {/* Desktop Connector - Time & Cost */}
                  <div className="hidden lg:block absolute -bottom-35 -left-96 -right-1 h-24 z-0 pointer-events-none">
                    <Image src="/time-cost.svg" alt="Connector" layout="fill" objectFit="contain" className="opacity-80" />
                  </div>


                  {/* Column 1: Your Time */}
                  <div className="relative group text-center px-4">
                    {/* Background Decoration */}
                    <div className="absolute inset-0 -z-10 flex items-center justify-center opacity-60 group-hover:opacity-100 transition-opacity duration-300">
                      <Image src="/bg-lines-img1.svg" alt="Background Lines" width={300} height={300} className="w-full max-w-[280px] lg:max-w-[340px]" />
                    </div>

                    <div className="relative z-10 space-y-8 lg:space-y-10">
                      <h3 className="font-poppins font-semibold text-2xl lg:text-3xl text-gray-900">Your Time</h3>
                      <div className="h-32 lg:h-40 flex items-center justify-center">
                        <Image src="/Vector.svg" alt="Your Time" width={100} height={100} className="w-auto h-full max-h-28 lg:max-h-42 object-contain" />
                      </div>
                      <p className="font-poppins text-gray-900 text-sm lg:text-base leading-relaxed px-2">
                        Generate and send thousands of <span className="text-[#B33259] font-semibold">certificates in minutes,</span> not days.
                      </p>
                    </div>
                  </div>

                  {/* Column 2: Cost & Efforts */}
                  <div className="relative group text-center px-4 mt-8 lg:mt-0">
                    {/* Background Decoration */}
                    <div className="absolute inset-0 -z-10 flex items-center justify-center opacity-60 group-hover:opacity-100 transition-opacity duration-300">
                      <Image src="/bg-lines-img2.svg" alt="Background Lines" width={300} height={300} className="w-full max-w-[280px] lg:max-w-[340px]" />
                    </div>

                    <div className="relative z-10 space-y-8 lg:space-y-10">
                      <h3 className="font-poppins font-semibold text-2xl lg:text-3xl text-gray-900">Cost & Efforts</h3>
                      <div className="h-32 lg:h-40 flex items-center justify-center">
                        <Image src="/cost-optimization-concept-idea-financial-marketing-strategy-cost-income-balance-spending-cost-reduction-while-maximizing-business-value-isolated-flat-illustration-vector 1.svg" alt="Cost & Efforts" width={120} height={120} className="w-auto h-full max-h-28 lg:max-h-42 object-contain" />
                      </div>
                      <p className="font-poppins text-gray-900 text-sm lg:text-base leading-relaxed px-2">
                        Eliminate printing, logistics, and reissue expenses. <span className="text-[#B33259] font-semibold">No Excel chaos, no name corrections,</span> no repeated follow-ups.
                      </p>
                    </div>
                  </div>

                  {/* Column 3: Risk */}
                  <div className="relative group text-center px-4 mt-8 lg:mt-0">
                    {/* Background Decoration */}
                    <div className="absolute inset-0 -z-10 flex items-center justify-center opacity-60 group-hover:opacity-100 transition-opacity duration-300">
                      <Image src="/bg-lines-img3.svg" alt="Background Lines" width={300} height={300} className="w-full max-w-[280px] lg:max-w-[340px]" />
                    </div>

                    <div className="relative z-10 space-y-8 lg:space-y-10">
                      <h3 className="font-poppins font-semibold text-2xl lg:text-3xl text-gray-900">Risk</h3>
                      <div className="h-32 lg:h-40 flex items-center justify-center">
                        <Image src="/risk 1.svg" alt="Risk" width={100} height={100} className="w-auto h-full max-h-32 lg:max-h-42 object-contain" />
                      </div>
                      <p className="font-poppins text-gray-900 text-sm lg:text-base leading-relaxed px-2">
                        Prevent fake, duplicated, or altered certificates. Reduce <span className="text-[#B33259] font-semibold">'Is this certificate valid?'</span> and 'Please resend' queries.
                      </p>
                    </div>
                  </div>

                  {/* Desktop Connector - Risk Arrow */}
                  <div className="hidden lg:block absolute -bottom-40 right-[10%] w-36 h-36 z-0 pointer-events-none -rotate-15">
                    <Image src="/1212121.svg" alt="Arrow" width={150} height={150} className="w-full h-full text-[#8B4513]" />
                  </div>

                </div>

                {/* Bottom Summary */}
                <div className="mt-12 lg:mt-36 flex flex-col lg:flex-row items-center justify-center gap-6 lg:gap-66 text-center">
                  <p className="font-poppins text-gray-900 text-base lg:text-lg font-medium max-w-xs">
                    What usually takes 6-10 hours of manual certificate work is done in minutes with Certiflo.
                  </p>
                  <p className={`$ font-poppins text-gray-900 text-base lg:text-lg text-left font-medium max-w-lg `}>
                    Save your events legitimacy.
                  </p>
                </div>

              </div>
            </div>
          </ScrollRevealSection>
          <div className="max-w-[90%] mx-auto px-0">
            <SectionSeparator />
          </div>

          <ScrollRevealSection>
            <div className="max-w-[90%] mx-auto px-0">
              <ReadyToStart />
            </div>
          </ScrollRevealSection>

          {/* Closing Separator - Outside scroll reveal, no bottom margin to stop grid lines perfectly */}
          <div className="max-w-[90%] mx-auto px-0">
            <SectionSeparator />
          </div>

        </div>
      </div>

      <div className="bg-gray-50 h-24"></div>

      <SiteFooterGlassmorphism />

      {/* Cookie Consent Banner */}
      <CookieConsent />
      <ScrollToTop />
    </div >
  )
}