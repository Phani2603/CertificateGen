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
} from "next/font/google"
import { Analytics } from "@vercel/analytics/next"
import { getGoogleFontsUrl } from "@/lib/fonts"
import { AuthProvider } from "@/components/auth-provider"
import { IslandAlertsProvider } from "@/components/ui/island-alerts"
import { Toaster } from "@/components/ui/sonner"
import Script from "next/script"
import "./globals.css"

// Serif Fonts
const playfairDisplay = Playfair_Display({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800", "900"],
  variable: "--font-playfair"
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
const coda =Coda({
  subsets:["latin"],
  weight:["400","800"],
  variable:"--font-coda"
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
 title: "Certifio - Certificate Generation Made Simple | by Senement",
  description: "Create, send, and verify certificates for events, programs, and organizations securely and at scale. No credit card required for early partners.",
  keywords: ["certificate generation", "digital certificates", "certificate verification", "bulk certificates", "secure certificates"],
  generator: "senement.com",
  icons:{
    icon: "/cflo1.png",
    apple: "/cflo1.png",
    shortcut: "/cflo1.png"
  }
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
      </head>
      <body className={`font-sans ${roboto.variable} ${playfairDisplay.variable} ${cormorantGaramond.variable} ${lora.variable} ${coda.variable} ${crimsonText.variable} ${merriweather.variable} ${montserrat.variable} ${openSans.variable} ${poppins.variable} ${inter.variable} ${raleway.variable} ${caveat.variable} ${marckScript.variable} ${greatVibes.variable} ${pacifico.variable} ${dancingScript.variable} ${tangerine.variable} antialiased`}>
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
      </body>
    </html>
  )
}
