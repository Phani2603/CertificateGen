import Link from "next/link"
import { Button } from "@/components/ui/button"
import { ArrowRight, Award, Users, Zap } from "lucide-react"
import Image from "next/image"

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-[#f6f6f6]">
      {/* Header */}
      <header className="border-b border-gray-200 bg-white sticky top-0 z-50">
        <div className="container mx-auto px-3 md:px-7 py-4 md:py-5 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Image
              src="/c.svg"
              alt="CertificateHash Logo"
              width={52}
              height={52} />
          </div>
          <nav className="hidden md:flex items-center gap-6 lg:gap-8">
            <Link href="#features" className="text-sm lg:text-base text-gray-600 hover:text-[#21808D] transition">
              Features
            </Link>
            <Link href="#how-it-works" className="text-sm lg:text-base text-gray-600 hover:text-[#21808D] transition">
              How It Works
            </Link>
    
          </nav>
          <div className="flex items-center gap-2 md:gap-4">
            <Link href="/login" className="">
              <Button variant="ghost" size="sm" className="text-gray-700 hover:text-[#21808D] text-sm md:text-base">
                Sign In
              </Button>
            </Link>
            <Link href="/dashboard">
              <Button size="sm" className="bg-[#21808D] hover:bg-[#1a6570] text-white text-xs md:text-sm px-3 md:px-4">
                Get Started
                <ArrowRight className="ml-1 md:ml-2 h-3 w-3 md:h-4 md:w-4" />
              </Button>
            </Link>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="container mx-auto px-4 md:px-6 py-12 md:py-20 lg:py-32">
        <div className="grid md:grid-cols-2 gap-8 md:gap-12 items-center">
          <div>
            <h1 className="text-3xl sm:text-4xl md:text-6xl lg:text-7xl xl:text-8xl font-black leading-tight mb-4 md:mb-8">
              CERTIFICATE
              <br />
              <span className="text-[#21808D]">GENERATION</span>
              <br />
              MADE SIMPLE
            </h1>
            <p className="text-lg sm:text-xl md:text-xl lg:text-3xl text-gray-600 mb-6 md:mb-8 max-w-lg">
              Where ideas turn into certified achievements,
              students become recognized creators,
              and organizations grow with trust, not tricks.
            </p>
            <Link href="/dashboard">
              <Button size="lg" className="bg-[#21808D] hover:bg-[#1a6570] text-white text-sm md:text-base lg:text-lg px-6 md:px-8 py-4 md:py-6 rounded-full w-full sm:w-auto">
                Explore Now
              </Button>
            </Link>
          </div>

          {/* Stats Cards */}
          <div className="grid grid-cols-2 gap-3 md:gap-4 mt-8 md:mt-0">
            <div className="bg-[#FF5733] text-white p-6 md:p-7 lg:p-9 rounded-2xl md:rounded-3xl">
              <div className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-black mb-1 md:mb-2">1000+</div>
              <div className="text-xs sm:text-sm md:text-base lg:text-lg font-medium">Certificates Generated</div>
            </div>
            <div className="bg-[#8FD6BD] text-black p-6 md:p-7 lg:p-9 rounded-2xl md:rounded-3xl">
              <div className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-black mb-1 md:mb-2">200+</div>
              <div className="text-xs sm:text-sm md:text-base lg:text-lg font-medium">Organizations Trust Us</div>
            </div>
            <div className="bg-[#E0E0E0] text-black p-6 md:p-7 lg:p-9 rounded-2xl md:rounded-3xl">
              <div className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-black mb-1 md:mb-2">50+</div>
              <div className="text-xs sm:text-sm md:text-base lg:text-lg font-medium">Active Clubs</div>
            </div>
            <div className="bg-[#F4E04D] text-black p-6 md:p-7 lg:p-9 rounded-2xl md:rounded-3xl">
              <div className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-black mb-1 md:mb-2">24/7</div>
              <div className="text-xs sm:text-sm md:text-base lg:text-lg font-medium">Support Available</div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-12 md:py-16 lg:py-20 bg-white">
        <div className="container mx-auto px-4 md:px-6">
          <h2 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl xl:text-7xl font-black mb-8 md:mb-12 lg:mb-16 text-center">
            WHY CHOOSE US?
          </h2>

          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6 lg:gap-8">
            <div className="p-6 md:p-8 bg-[#f6f6f6] rounded-2xl hover:shadow-lg transition">
              <div className="w-12 h-12 md:w-16 md:h-16 bg-[#21808D] rounded-full flex items-center justify-center mb-4 md:mb-6">
                <Zap className="h-6 w-6 md:h-8 md:w-8 text-white" />
              </div>
              <h3 className="text-lg md:text-2xl lg:text-3xl font-bold mb-3 md:mb-4">Bulk Generation</h3>
              <p className="text-gray-600 text-lg md:text-lg lg:text-xl">
                Generate hundreds of certificates in seconds. Upload CSV, customize fields, and send via email instantly.
              </p>
            </div>

            <div className="p-6 md:p-8 bg-[#f6f6f6] rounded-2xl hover:shadow-lg transition">
              <div className="w-12 h-12 md:w-16 md:h-16 bg-[#21808D] rounded-full flex items-center justify-center mb-4 md:mb-6">
                <Award className="h-6 w-6 md:h-8 md:w-8 text-white" />
              </div>
              <h3 className="text-lg md:text-2xl lg:text-3xl font-bold mb-3 md:mb-4">Verified Certificates</h3>
              <p className="text-gray-600 text-lg md:text-lg lg:text-xl">
                Each certificate gets a unique verification link. Recipients can prove authenticity anytime, anywhere.
              </p>
            </div>

            <div className="p-6 md:p-8 bg-[#f6f6f6] rounded-2xl hover:shadow-lg transition">
              <div className="w-12 h-12 md:w-16 md:h-16 bg-[#21808D] rounded-full flex items-center justify-center mb-4 md:mb-6">
                <Users className="h-6 w-6 md:h-8 md:w-8 text-white" />
              </div>
              <h3 className="text-lg md:text-2xl lg:text-3xl font-bold mb-3 md:mb-4">Team Collaboration</h3>
              <p className="text-gray-600 text-lg md:text-lg lg:text-xl">
                Manage organizations, clubs, and chapters. Grant access to team members with role-based permissions.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section id="how-it-works" className="py-12 md:py-16 lg:py-20">
        <div className="container mx-auto px-4 md:px-6">
          <h2 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl xl:text-7xl font-black mb-8 md:mb-12 lg:mb-16 text-center">
            HOW IT WORKS
          </h2>

          <div className="max-w-4xl mx-auto space-y-6 md:space-y-8 lg:space-y-12">
            <div className="flex gap-4 md:gap-6 items-start">
              <div className="w-10 h-10 md:w-12 md:h-12 bg-[#21808D] text-white rounded-full flex items-center justify-center font-bold text-xl md:text2xl flex-shrink-0">
                1
              </div>
              <div>
                <h3 className="text-xl md:text-xl lg:text-3xl font-bold mb-1 md:mb-2">Create or Join Organization</h3>
                <p className="text-gray-600 text-lg md:text-lg lg:text-2xl">
                  Sign in with Google and create your college/company organization or join an existing one.
                </p>
              </div>
            </div>
            <div className="flex gap-4 md:gap-6 items-start">
              <div className="w-10 h-10 md:w-12 md:h-12 bg-[#21808D] text-white rounded-full flex items-center justify-center font-bold text-xl md:text2xl flex-shrink-0">
                2
              </div>
              <div>
                <h3 className="text-xl md:text-xl lg:text-3xl font-bold mb-1 md:mb-2">Upload Certificate Template</h3>
                <p className="text-gray-600 text-lg md:text-lg lg:text-2xl">
                  Upload your custom certificate design and configure text fields like name, date, and event details.
                </p>
              </div>
            </div>

            <div className="flex gap-4 md:gap-6 items-start">
              <div className="w-10 h-10 md:w-12 md:h-12 bg-[#21808D] text-white rounded-full flex items-center justify-center font-bold text-xl md:text2xl flex-shrink-0">
                3
              </div>
              <div>
                <h3 className="text-xl md:text-xl lg:text-3xl font-bold mb-1 md:mb-2">Upload Recipients CSV</h3>
                <p className="text-gray-600 text-lg md:text-lg lg:text-2xl">
                  Upload a CSV file with recipient details. Auto-map columns to certificate fields.
                </p>
              </div>
            </div>

            <div className="flex gap-4 md:gap-6 items-start">
              <div className="w-10 h-10 md:w-12 md:h-12 bg-[#21808D] text-white rounded-full flex items-center justify-center font-bold text-xl md:text2xl flex-shrink-0">
                4
              </div>
              <div>
                <h3 className="text-xl md:text-xl lg:text-3xl font-bold mb-1 md:mb-2">Generate & Send</h3>
                <p className="text-gray-600 text-lg md:text-lg lg:text-2xl">
                  Generate all certificates instantly and send them via email. Each certificate includes a verification link.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-12 md:py-16 lg:py-20 bg-[#21808D]">
        <div className="container mx-auto px-4 md:px-6 text-center">
          <h2 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl xl:text-7xl font-black text-white mb-4 md:mb-6 lg:mb-8">
            READY TO START?
          </h2>
          <p className="text-lg sm:text-xl md:text-2xl lg:text-3xl text-white/90 mb-6 md:mb-8 max-w-2xl mx-auto px-4">
            Join hundreds of organizations already using CertificateHash to create and verify professional certificates.
          </p>
          <Link href="/dashboard">
            <Button size="lg" className="bg-white text-[#21808D] hover:bg-gray-100 text-sm md:text-base lg:text-lg px-6 md:px-8 py-4 md:py-6 rounded-full font-bold w-full sm:w-auto">
              Get Started Free
              <ArrowRight className="ml-2 h-4 w-4 md:h-5 md:w-5" />
            </Button>
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-white border-t border-gray-200 py-8 md:py-12">
        <div className="container mx-auto px-4 md:px-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 md:gap-8">
            <div>
              <div className="flex items-center gap-2 mb-4">
              <Image
                src="/c.svg"
                alt="CertificateHash Logo"
                width={40}
                height={40}
              />
              </div>
              <p className="text-gray-600  text-lg sm:hidden md:block">
                Professional certificate generation and verification platform.
              </p>
            </div>

            <div>
              <h4 className="font-bold mb-4 text-xl">Product</h4>
              <ul className="space-y-2 text-gray-600 text-lg">
                <li><Link href="#features" className="hover:text-[#21808D]">Features</Link></li>
                <li><Link href="#pricing" className="hover:text-[#21808D]">Pricing</Link></li>
                <li><Link href="#how-it-works" className="hover:text-[#21808D]">How It Works</Link></li>
              </ul>
            </div>

            <div>
              <h4 className="font-bold mb-4 text-xl">Company</h4>
              <ul className="space-y-2 text-gray-600 text-lg">
                <li><Link href="/about" className="hover:text-[#21808D]">About</Link></li>
                <li><Link href="/contact" className="hover:text-[#21808D]">Contact</Link></li>
                <li><Link href="/privacy" className="hover:text-[#21808D]">Privacy</Link></li>
              </ul>
            </div>

            <div>
              <h4 className="font-bold mb-4 text-xl">Support</h4>
              <ul className="space-y-2 text-gray-600 text-lg">
                <li><Link href="/help" className="hover:text-[#21808D]">Help Center</Link></li>
                <li><Link href="/docs" className="hover:text-[#21808D]">Documentation</Link></li>
                <li><Link href="/faq" className="hover:text-[#21808D]">FAQ</Link></li>
              </ul>
            </div>
          </div>

          <div className="border-t border-gray-200 mt-12 pt-8 text-center text-gray-600">
            <p>&copy; 2025 CertificateHash. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  )
}
