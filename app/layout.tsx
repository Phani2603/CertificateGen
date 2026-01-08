import type React from "react"
import type { Metadata } from "next"
import {  Roboto } from "next/font/google"
import { Analytics } from "@vercel/analytics/next"
import { getGoogleFontsUrl } from "@/lib/fonts"
import { AuthProvider } from "@/components/auth-provider"
import { SocketProvider } from "@/components/socket-provider"
import { IslandAlertsProvider } from "@/components/ui/island-alerts"
import { Toaster } from "@/components/ui/sonner"
import Script from "next/script"
import "./globals.css"


const roboto =Roboto({subsets:["cyrillic","latin"], weight:["100","200","800","600","500","300","400","700","900"]})

export const metadata: Metadata = {
  title: "CertificateHash",
  description: "Certificate Generator - Bulk Certificate Creation and Emailing generated and send professional certificates with ease.",
  generator: "senement.com",
  icons:{
    icon: "/favicon-32x32.png",
    apple: "/apple-touch-icon.png",
    shortcut: "/favicon.ico"
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
      </head>
      <body className={`font-sans ${roboto.className} antialiased`}>
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
          <SocketProvider>
            <IslandAlertsProvider>
              {children}
            </IslandAlertsProvider>
          </SocketProvider>
        </AuthProvider>
        <Toaster position="top-right" richColors />
        <Analytics mode="production" />
      </body>
    </html>
  )
}
