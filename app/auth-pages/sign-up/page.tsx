import { signUpAction } from "@/app/actions";
import { FormMessage, Message } from "@/components/form-message";
import { SubmitButton } from "@/components/submit-button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import Link from "next/link";
import { SmtpMessage } from "../smtp-message";

export default function Signup({
  searchParams,
}: {
  searchParams: { [key: string]: string | string[] | undefined }
}) {
  const message = Array.isArray(searchParams.message) 
    ? searchParams.message[0] 
    : searchParams.message;

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-900">
      <div className="w-full max-w-sm mx-auto p-8 bg-gray-800/50 rounded-xl shadow-xl border border-gray-700">
        <form className="flex flex-col items-center w-full">
          <h1 className="text-2xl font-semibold mb-6 text-white">Sign up</h1>
          <p className="text-sm text-gray-400">
            Already have an account?{" "}
            <Link 
              href="/auth-pages/sign-in" 
              className="text-blue-400 hover:text-blue-300 transition-colors"
            >
              Sign in
            </Link>
          </p>
          <div className="w-full space-y-4 mt-8">
            <Label htmlFor="display_name">Display Name</Label>
            <Input 
              name="display_name" 
              placeholder="How others will see you"
              required 
            />
            <Label htmlFor="email">Email</Label>
            <Input name="email" placeholder="you@example.com" required />
            <Label htmlFor="password">Password</Label>
            <Input
              type="password"
              name="password"
              placeholder="Your password"
              minLength={6}
              required
            />
            <SubmitButton formAction={signUpAction} pendingText="Signing up...">
              Sign up
            </SubmitButton>
            {message && (
              <FormMessage message={{ message }} />
            )}
          </div>
        </form>
        <SmtpMessage />
      </div>
    </div>
  )
}
