"use client"

import { useState } from "react"
import { Menu, X } from "lucide-react"
import Image from "next/image"
import Link from "next/link"
import NeumorphButton from "@/components/ui/neumorph-button"
import { Caveat } from "next/font/google"

const caveat = Caveat({ 
  subsets: ["latin"],
  weight: ["400", "700"]
})

export default function NewLandingPage() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  return (
    <div className="min-h-screen bg-gray-50 ">
      {/* Navigation */}
      <nav className="relative z-50 flex items-center justify-between px-6 py-4 lg:px-12 bg-gray-50">
        {/* Logo */}
        <div className="flex flex-col items-center space-x-2">
          <div className="text-2xl font-semibold text-gray-900 font-raleway">
            Certiflo
          </div>
          <div className="text-sm text-gray-600 font-medium font-pacifico">
            by SENEMENT
          </div>
        </div>

        {/* Navigation Links - Hidden on mobile */}
        <div className="hidden md:flex items-center space-x-8">
          <Link href="#" className="text-gray-600 hover:text-gray-900 transition-colors font-poppins">
            Senement
          </Link>
          <Link href="#" className="text-gray-600 hover:text-gray-900 transition-colors font-poppins">
            Pricing
          </Link>
          <Link href="#" className="text-gray-600 hover:text-gray-900 transition-colors font-poppins">
            Verify
          </Link>
          <Link href="#" className="text-gray-600 hover:text-gray-900 transition-colors font-poppins">
            Contact
          </Link>
        </div>

        {/* Desktop Auth Buttons */}
        <div className="hidden md:flex items-center space-x-3">
          <NeumorphButton size="small" intent="default" className=" shadow-[inset_2px_2px_5px_rgba(0,0,0,0.1),inset_-2px_-2px_5px_rgba(255,255,255,0.7)]  transition-all duration-50">
            Login
          </NeumorphButton>
          <NeumorphButton size={"small"} intent={"primary"} className=" shadow-[2px_2px_5px_rgba(0,0,0,0.1),-2px_-2px_5px_rgba(255,255,255,0.7)] transition-all duration-50">
            Join Now
          </NeumorphButton>
        </div>

        {/* Mobile Menu Button */}
        <NeumorphButton
        size={"small"}
        intent={"secondary"}
          className="md:hidden p-2 shadow-[inset_2px_2px_5px_rgba(0,0,0,0.1),inset_-2px_-2px_5px_rgba(255,255,255,0.7)] transition-all duration-50"
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
        >
          {mobileMenuOpen ? (
            <X className="h-6 w-6 text-gray-900" />
          ) : (
            <Menu className="h-6 w-6 text-gray-900" />
          )}
        </NeumorphButton>

        {/* Mobile Menu */}
        {mobileMenuOpen && (
          <div className="absolute top-full left-0 right-0 bg-gray-50 border-t border-gray-200 shadow-lg md:hidden">
            <div className="px-6 py-4 space-y-4">
              <Link href="#" className="block text-gray hover:text-gray-900 transition-colors font-poppins">
                Senement
              </Link>
              <Link href="#" className="block text-gray hover:text-gray-900 transition-colors font-poppins">
                Pricing
              </Link>
              <Link href="#" className="block text-gray hover:text-gray-900 transition-colors font-poppins">
                Verify
              </Link>
              <Link href="#" className="block text-gray hover:text-gray-900 transition-colors font-poppins">
                Contact
              </Link>
              <div className=" justify-center flex flex-row gap-4 pt-4 space-y-3">
                <NeumorphButton size={"small"} intent={"secondary"} className="shadow-[inset_2px_2px_5px_rgba(0,0,0,0.1),inset_-2px_-2px_5px_rgba(255,255,255,0.7)]  transition-all duration-50">
                  Login
                </NeumorphButton>
                <NeumorphButton size={"small"} intent={"primary"} className=" shadow-[2px_2px_5px_rgba(0,0,0,0.1),-2px_-2px_5px_rgba(255,255,255,0.7)]  transition-all duration-50">
                  Join Now
                </NeumorphButton>
              </div>
            </div>
          </div>
        )}
      </nav>

      {/* Hero Section */}
      <div className="px-6 py-8 lg:px-12 lg:py-16 bg-gray-50">
        <div className="max-w-7xl mx-auto">
          <div className="grid lg:grid-cols-2 gap-8 lg:gap-12 items-center">
            {/* Left Content */}
            <div className="space-y-6 lg:space-y-8 order-1">
              <div className="space-y-4 lg:space-y-6">
                <h1 className="text-3xl sm:text-4xl lg:text-5xl xl:text-6xl leading-tight">
                  <div className={`${caveat.className} font-semibold text-4xl sm:text-5xl lg:text-6xl xl:text-7xl text-gray-900`}>
                    Certificate Generation And
                  </div>
                  <div className={`${caveat.className} font-semibold text-4xl sm:text-5xl lg:text-6xl xl:text-7xl mt-2 text-gray-900`}>
                    Issuance{" "}
                    <span className="relative inline-block">
                      Made Simple
                      <div className="absolute -bottom-1 lg:-bottom-2 left-0 w-full h-6 lg:h-8 bg-emerald-400 rounded-full -z-10"></div>
                    </span>
                  </div>
                </h1>
                
                <p className="text-medium lg:text-lg text-gray-900 max-w-lg leading-relaxed font-poppins">
                  Create, Send, And Verify Certificates For Events, Programs, And Organizations, Securely 
                  And At Scale.
                </p>
              </div>

              {/* CTA Buttons */}
              <div className="flex flex-col sm:flex-row gap-3 lg:gap-4">
                <NeumorphButton size="medium" intent ="primary" className="shadow-[2px_2px_5px_rgba(0,0,0,0.1),-2px_-2px_5px_rgba(255,255,255,0.7)] transition-all duration-50">
                  Contact Us
                </NeumorphButton>
                <NeumorphButton intent={"default"} className="shadow-[2px_2px_5px_rgba(0,0,0,0.1),-2px_-2px_5px_rgba(255,255,255,0.7)]">                  Create Certificate
                </NeumorphButton>
              </div>

              {/* Trust Badge */}
              <div className="pt-2 lg:pt-4">
                <p className="text-sm text-gray-500 font-poppins">
                  No Credit Card Required • Free For Early Partners*
                </p>
              </div>
            </div>

            {/* Right Content - Certificate Preview */}
            <div className="relative order-2">
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
            </div>
          </div>
        </div>
      </div>

      {/* Trust Section */}
      <div className="px-6 py-12 lg:py-16 bg-gray-50 border-t border-gray-200">
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
              <span className="text-sm lg:text-xl font-caveat font-semibold text-gray-900">100 more +</span>
            </div>
          </div>
        </div>
          </div>
          {/* Heading */}
          <div className="text-center mb-8 lg:mb-12">
            <p className="text-xs lg:text-sm text-gray-500 font-poppins tracking-wide uppercase mb-2">
              Trusted By Event Organizers & Institutions
            </p>
      </div>
    </div>
  )
}