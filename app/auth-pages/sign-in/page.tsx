import { signInAction } from "@/app/actions";
import { FormMessage } from "@/components/form-message";
import { SubmitButton } from "@/components/submit-button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import Link from "next/link";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: 'Sign In',
  description: 'Sign in to your account',
}

interface Message {
  message?: string
}

export default async function SignIn({
  searchParams,
}: {
  searchParams: Promise<Message>
}) {
  const params = await searchParams;
  const message = params?.message || null;

  return (
    <div className="flex h-screen w-screen items-center justify-center bg-gray-900">
      <div className="w-[400px] p-8 bg-gray-800/50 rounded-xl shadow-xl border border-gray-700">
        <form className="flex flex-col items-center space-y-6">
          <h1 className="text-2xl font-semibold text-white">Sign in</h1>
          <Link 
            href="/auth-pages/sign-up" 
            className="text-sm text-blue-400 hover:text-blue-300 transition-colors"
          >
            Don&apos;t have an account? Sign up
          </Link>
          <div className="w-full space-y-4">
            <div>
              <Label className="block text-center mb-2" htmlFor="email">Email</Label>
              <Input 
                name="email" 
                placeholder="you@example.com" 
                required 
                className="w-full"
              />
            </div>
            <div>
              <Label className="block text-center mb-2" htmlFor="password">Password</Label>
              <Input 
                type="password" 
                name="password" 
                placeholder="••••••••" 
                required 
                className="w-full"
              />
            </div>
            <SubmitButton formAction={signInAction} pendingText="Signing in...">
              Sign in
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
