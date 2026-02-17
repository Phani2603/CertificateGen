import Link from "next/link"

export default function NotFound() {
  return (
    <div className="relative h-screen w-full overflow-hidden">
      {/* Full-screen Video Background */}
      <video
        autoPlay
        loop
        muted
        playsInline
        className="absolute inset-0 w-full h-full object-cover"
      >
        <source src="/v1.mov" type="video/mp4" />
        Your browser does not support the video tag.
      </video>

      {/* Home Link - Top Left */}
      <Link
        href="/"
        className="absolute top-6 left-6 z-10 px-6 py-2 bg-black/10 backdrop-blur-sm text-black/80 text-smborder border-white/20 rounded-lg font-medium hover:bg-white/20 transition-all"
      >
        ← Back to Home
      </Link>

      {/* Credits - Bottom Right */}
      <a
        href="https://dribbble.com/shots/22404038-Daily-UI-008-404-page?utm_source=Clipboard_Shot&utm_campaign=kosmachev&utm_content=Daily%20UI%20008%20%E2%80%94%20404%20page&utm_medium=Social_Share&utm_source=Clipboard_Shot&utm_campaign=kosmachev&utm_content=Daily%20UI%20008%20%E2%80%94%20404%20page&utm_medium=Social_Share"
        target="_blank"
        rel="noopener noreferrer"
        className="absolute bottom-6 right-6 z-10 px-4 py-2 bg-black/30 backdrop-blur-sm text-white/80 text-sm rounded-md hover:bg-black/40 hover:text-white transition-all"
      >
        Video by DigitalCrocs on Dribbble
      </a>
    </div>
  )
}
