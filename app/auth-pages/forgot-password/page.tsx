import { Metadata } from "next"

export const metadata: Metadata = {
  title: 'Reset Password',
  description: 'Reset your password',
}

type SearchParams = { message?: string }

export default async function ForgotPassword({
  searchParams,
}: {
  searchParams: SearchParams
}) {
  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-900">
      <div className="w-full max-w-sm mx-auto p-8 bg-gray-800/50 rounded-xl shadow-xl border border-gray-700">
        <h1 className="text-2xl font-semibold mb-6 text-white text-center">
          Coming Soon
        </h1>
        <p className="text-gray-400 text-center">
          Password reset functionality will be available in a future update.
        </p>
      </div>
    </div>
  )
}
