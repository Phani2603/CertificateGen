import Link from "next/link"

export function SiteFooter() {
    return (
        <footer className="py-6 md:px-8 md:py-0 border-t border-gray-100">
            <div className="container flex flex-col items-center justify-between gap-4 md:h-16 md:flex-row text-xs text-muted-foreground">
                <p className="text-balance text-center md:text-left">
                    © 2026 Certiflo. Built for a more sustainable future. All rights reserved.
                </p>
                <div className="flex items-center gap-4">
                    <Link href="/terms" className="hover:text-foreground transition-colors hover:underline">
                        Terms & Conditions
                    </Link>
                    <span>•</span>
                    <Link href="/privacy-policy" className="hover:text-foreground transition-colors hover:underline">
                        Privacy Policy
                    </Link>
                </div>
            </div>
        </footer>
    )
}
