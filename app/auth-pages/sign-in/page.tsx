import { signInAction } from "@/app/actions";
import { FormMessage, Message } from "@/components/form-message";
import { SubmitButton } from "@/components/submit-button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import Link from "next/link";

export default function SignIn({
  searchParams,
}: {
  searchParams: Message
}) {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background">
      <div className="w-full max-w-sm mx-auto p-6">
        <form className="flex flex-col items-center w-full">
          <h1 className="text-2xl font-medium mb-6">Sign in</h1>
          <Link 
            href="/auth-pages/sign-up" 
            className="text-sm text-accent hover:underline mb-8"
          >
            Don&apos;t have an account? Sign up
          </Link>
          <div className="w-full space-y-4">
            <Label htmlFor="email">Email</Label>
            <Input name="email" placeholder="you@example.com" required />
            <Label htmlFor="password">Password</Label>
            <Input type="password" name="password" placeholder="••••••••" required />
            <SubmitButton formAction={signInAction} pendingText="Signing in...">
              Sign in
            </SubmitButton>
            <FormMessage message={searchParams} />
          </div>
        </form>
      </div>
    </div>
  )
}
