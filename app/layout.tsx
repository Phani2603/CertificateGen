import type React from "react"
import type { Metadata } from "next"
import {
  Roboto,
  Caveat,
  Playfair_Display,
  Cormorant_Garamond,
  Lora,
  Crimson_Text,
  Merriweather,
  Montserrat,
  Open_Sans,
  Poppins,
  Inter,
  Raleway,
  Marck_Script,
  Great_Vibes,
  Pacifico,
  Dancing_Script,
  Tangerine,
  Coda,
  Iceland,
} from "next/font/google"
import { Analytics } from "@vercel/analytics/next"
import { getGoogleFontsUrl } from "@/lib/fonts"
import { AuthProvider } from "@/components/auth-provider"
import { IslandAlertsProvider } from "@/components/ui/island-alerts"
import { Toaster } from "@/components/ui/sonner"
import Script from "next/script"
import SmoothScroll from "@/components/smooth-scroll"
import "./globals.css"

// Serif Fonts
const playfairDisplay = Playfair_Display({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800", "900"],
  variable: "--font-playfair"
})
const iceland = Iceland({
  subsets: ["latin"],
  weight: ["400"],
  variable: "--font-iceland"

})

const cormorantGaramond = Cormorant_Garamond({
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700"],
  variable: "--font-cormorant"
})

const lora = Lora({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-lora"
})

const crimsonText = Crimson_Text({
  subsets: ["latin"],
  weight: ["400", "600", "700"],
  variable: "--font-crimson"
})

const merriweather = Merriweather({
  subsets: ["latin"],
  weight: ["300", "400", "700", "900"],
  variable: "--font-merriweather"
})
const coda = Coda({
  subsets: ["latin"],
  weight: ["400", "800"],
  variable: "--font-coda"
})

// Sans-Serif Fonts
const roboto = Roboto({
  subsets: ["cyrillic", "latin"],
  weight: ["100", "300", "400", "500", "700", "900"],
  variable: "--font-roboto"
})

const montserrat = Montserrat({
  subsets: ["latin"],
  weight: ["100", "200", "300", "400", "500", "600", "700", "800", "900"],
  variable: "--font-montserrat"
})

const openSans = Open_Sans({
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700", "800"],
  variable: "--font-open-sans"
})

const poppins = Poppins({
  subsets: ["latin"],
  weight: ["100", "200", "300", "400", "500", "600", "700", "800", "900"],
  variable: "--font-poppins"
})

const inter = Inter({
  subsets: ["latin"],
  weight: ["100", "200", "300", "400", "500", "600", "700", "800", "900"],
  variable: "--font-inter"
})

const raleway = Raleway({
  subsets: ["latin"],
  weight: ["100", "200", "300", "400", "500", "600", "700", "800", "900"],
  variable: "--font-raleway"
})

// Script Fonts
const caveat = Caveat({
  subsets: ["latin"],
  weight: ["400", "700"],
  variable: "--font-caveat"
})

// Export font classNames for direct use
export { caveat }

const marckScript = Marck_Script({
  subsets: ["latin"],
  weight: ["400"],
  variable: "--font-marck-script"
})

const greatVibes = Great_Vibes({
  subsets: ["latin"],
  weight: ["400"],
  variable: "--font-great-vibes"
})

const pacifico = Pacifico({
  subsets: ["latin"],
  weight: ["400"],
  variable: "--font-pacifico"
})

const dancingScript = Dancing_Script({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-dancing-script"
})

const tangerine = Tangerine({
  subsets: ["latin"],
  weight: ["400", "700"],
  variable: "--font-tangerine"
})

export const metadata: Metadata = {
  metadataBase: new URL("https://certifio.com"),
  title: "Certifio - Certificate Generation & Verification Platform | Secure Digital Certificates",
  description: "Create, send, and verify digital certificates at scale. Trusted by 100+ organizations. Secure certificate generation for events, programs, and institutions. No credit card required.",
  keywords: [
    "certificate generation",
    "digital certificates",
    "certificate verification",
    "bulk certificates",
    "secure certificates",
    "online certificate maker",
    "certificate issuing platform",
    "event certificates",
    "course completion certificates",
    "certificate management system",
    "certificate authentication",
    "blockchain certificates",
    "verifiable credentials"
  ],
  generator: "certifio.com",
  applicationName: "Certifio",
  referrer: "strict-origin-when-cross-origin",
  authors: [{ name: "Senement", url: "https://senement.com" }],
  creator: "Senement",
  publisher: "Senement",
  formatDetection: {
    email: false,
    telephone: false,
    address: false,
  },
  icons: {
    icon: "/favicon.ico",
    shortcut: "/favicon.ico",
    apple: "/cflo1.png",
  },
  openGraph: {
    type: "website",
    locale: "en_US",
    url: "https://certifio.com",
    siteName: "Certifio",
    title: "Certifio - Certificate Generation & Verification Platform",
    description: "Create, send, and verify digital certificates at scale. Trusted by 100+ organizations.",
    images: [
      {
        url: "/cflo1.png",
        width: 1200,
        height: 630,
        alt: "Certifio - Certificate Generation Platform",
        type: "image/png",
      }
    ]
  },
  twitter: {
    card: "summary_large_image",
    title: "Certifio - Certificate Generation & Verification",
    description: "Create, send, and verify digital certificates at scale. Trusted by 100+ organizations.",
    images: ["/cflo1.png"],
    creator: "@senement",
  },
  robots: {
    index: true,
    follow: true,
    nocache: false,
    googleBot: {
      index: true,
      follow: true,
      "max-snippet": -1,
      "max-image-preview": "large",
      "max-video-preview": -1,
    },
  },
  alternates: {
    canonical: "https://certifio.com",
  },
  verification: {
    google: "your-google-verification-code",
  },
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href={getGoogleFontsUrl()} rel="stylesheet" />
        {/* Explicit Caveat font load as backup */}
        <link href="https://fonts.googleapis.com/css2?family=Caveat:wght@400;700&display=swap" rel="stylesheet" />

        {/* JSON-LD Structured Data */}
        <Script
          id="schema-organization"
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              "@context": "https://schema.org",
              "@type": "Organization",
              "name": "Certifio",
              "url": "https://certifio.com",
              "logo": "https://certifio.com/cflo1.png",
              "description": "Certificate generation and verification platform",
              "sameAs": [
                "https://twitter.com/senement",
                "https://linkedin.com/company/senement"
              ],
              "contactPoint": {
                "@type": "ContactPoint",
                "contactType": "Customer Support",
                "url": "https://certifio.com/contact"
              }
            })
          }}
        />

        {/* JSON-LD Product Schema */}
        <Script
          id="schema-product"
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              "@context": "https://schema.org",
              "@type": "SoftwareApplication",
              "name": "Certifio",
              "description": "Create, send, and verify digital certificates at scale",
              "url": "https://certifio.com",
              "applicationCategory": "BusinessApplication",
              "offers": {
                "@type": "Offer",
                "price": "0",
                "priceCurrency": "USD",
                "description": "Free for early partners"
              },
              "aggregateRating": {
                "@type": "AggregateRating",
                "ratingValue": "4.8",
                "ratingCount": "100"
              }
            })
          }}
        />

        {/* JSON-LD FAQPage Schema */}
        <Script
          id="schema-faq"
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              "@context": "https://schema.org",
              "@type": "FAQPage",
              "mainEntity": [
                {
                  "@type": "Question",
                  "name": "What is Certifio?",
                  "acceptedAnswer": {
                    "@type": "Answer",
                    "text": "Certifio is a digital certificate generation and verification platform that allows organizations to create, send, and verify certificates at scale."
                  }
                },
                {
                  "@type": "Question",
                  "name": "Is Certifio free?",
                  "acceptedAnswer": {
                    "@type": "Answer",
                    "text": "Yes, Certifio is free for early partners. No credit card is required to get started."
                  }
                },
                {
                  "@type": "Question",
                  "name": "How secure are Certifio certificates?",
                  "acceptedAnswer": {
                    "@type": "Answer",
                    "text": "Certifio uses industry-standard security protocols to ensure all certificates are secure and verifiable."
                  }
                }
              ]
            })
          }}
        />
      </head>
      <body className={`font-sans ${roboto.variable} ${playfairDisplay.variable} ${cormorantGaramond.variable} ${lora.variable} ${coda.variable} ${crimsonText.variable} ${merriweather.variable} ${montserrat.variable} ${openSans.variable} ${poppins.variable} ${inter.variable} ${raleway.variable} ${caveat.variable}${iceland.variable} ${marckScript.variable} ${greatVibes.variable} ${pacifico.variable} ${dancingScript.variable} ${tangerine.variable} antialiased`}>
        <SmoothScroll>
          {/* Google Analytics */}
          <Script
            src="https://www.googletagmanager.com/gtag/js?id=G-G1CV391NB5"
            strategy="afterInteractive"
          />
          <Script id="google-analytics" strategy="afterInteractive">
            {`
            window.dataLayer = window.dataLayer || [];
            function gtag(){dataLayer.push(arguments);}
            gtag('js', new Date());
            gtag('config', 'G-G1CV391NB5');
          `}
          </Script>

          <AuthProvider>
            <IslandAlertsProvider>
              {children}
            </IslandAlertsProvider>
          </AuthProvider>
          <Toaster position="top-right" richColors />
          <Analytics mode="production" />
        </SmoothScroll>
      </body>
    </html>
  )
}
