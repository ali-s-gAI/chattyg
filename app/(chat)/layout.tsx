import { AuthLayout } from '@/components/auth-layout'

export default function ChatLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return <AuthLayout>{children}</AuthLayout>
} 