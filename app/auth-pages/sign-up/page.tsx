import { signUpAction } from "@/app/actions";
import { FormMessage } from "@/components/form-message";
import { SubmitButton } from "@/components/submit-button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import Link from "next/link";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: 'Sign Up',
  description: 'Create a new account',
}

export default function SignUp({
  searchParams,
}: {
  searchParams?: { [key: string]: string | string[] | undefined }
}) {
  const message = searchParams?.message 
    ? Array.isArray(searchParams.message)
      ? searchParams.message[0]
      : searchParams.message
    : null

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-900">
      <div className="w-full max-w-sm mx-auto p-8 bg-gray-800/50 rounded-xl shadow-xl border border-gray-700">
        <form className="flex flex-col items-center w-full">
          <h1 className="text-2xl font-semibold mb-6 text-white">Sign up</h1>
          <Link 
            href="/auth-pages/sign-in" 
            className="text-sm text-blue-400 hover:text-blue-300 transition-colors mb-8"
          >
            Already have an account? Sign in
          </Link>
          <div className="w-full space-y-4">
            <Label htmlFor="display_name">Display Name</Label>
            <Input name="display_name" placeholder="How others will see you" required />
            <Label htmlFor="email">Email</Label>
            <Input name="email" placeholder="you@example.com" required />
            <Label htmlFor="password">Password</Label>
            <Input type="password" name="password" placeholder="••••••••" required />
            <SubmitButton formAction={signUpAction} pendingText="Signing up...">
              Sign up
            </SubmitButton>
            {message && (
              <FormMessage message={{ message }} />
            )}
          </div>
        </form>
      </div>
    </div>
  )
}
