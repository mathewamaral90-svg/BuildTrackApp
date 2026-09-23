import './globals.css'

export const metadata = {
  title: 'BuildTrack',
  description: 'Automotive build tracking and community',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  )
}
