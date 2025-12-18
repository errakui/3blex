import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: '3Blex Network - Network Marketing Platform',
  description: 'Piattaforma professionale di Network Marketing',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="it">
      <body>{children}</body>
    </html>
  )
}

