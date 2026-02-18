import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'

// Prevent static prerendering — pages need live env vars at runtime
export const dynamic = 'force-dynamic'

const inter = Inter({
  subsets: ['latin'],
  display: 'swap',
})

export const metadata: Metadata = {
  title: 'Enterprise Brain | Firmenwissen auf Knopfdruck',
  description:
    'KI-gestütztes, mandantenfähiges Wissensmanagementsystem für Unternehmen. Powered by Gemini & Supabase.',
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="de">
      <body className={`${inter.className} antialiased`}>{children}</body>
    </html>
  )
}
