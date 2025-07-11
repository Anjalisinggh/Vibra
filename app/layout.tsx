import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
   title: 'Vibra',
  description: 'Vibra is an emotion-driven music platform where users discover songs that match their feelings and share anonymous, unsent messages linked to each track. It blends heartfelt expression with mood-based music discovery in a safe, aesthetic space.',
  icons: {
    icon: '/icon.jpg', 
  },
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  )
}