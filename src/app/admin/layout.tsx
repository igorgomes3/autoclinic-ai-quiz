import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Admin — autoclinic.ai',
  description: 'Painel de administração',
  robots: 'noindex, nofollow',
}

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return children
}
