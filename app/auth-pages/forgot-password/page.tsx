export default function ForgotPassword() {
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

// TODO: need to reimplement this functionality later
// import { forgotPasswordAction } from "@/app/actions";
// import { FormMessage } from "@/components/form-message";
// import { SubmitButton } from "@/components/submit-button";
// import { Input } from "@/components/ui/input";
// import { Label } from "@/components/ui/label";
// import Link from "next/link";
// import { SmtpMessage } from "../smtp-message";

// export default function ForgotPassword({
//   searchParams,
// }: {
//   searchParams: { [key: string]: string | string[] | undefined }
// }) {
//   const message = Array.isArray(searchParams.message) 
//     ? searchParams.message[0] 
//     : searchParams.message;

//   return (
//     <div className="flex min-h-screen items-center justify-center bg-gray-900">
//       <div className="w-full max-w-sm mx-auto p-8 bg-gray-800/50 rounded-xl shadow-xl border border-gray-700">
//         <form className="flex flex-col items-center w-full">
//           <h1 className="text-2xl font-semibold mb-6 text-white">Reset Password</h1>
//           <p className="text-sm text-gray-400 mb-8">
//             Enter your email to receive password reset instructions
//           </p>
//           <div className="w-full space-y-4">
//             <Label htmlFor="email">Email</Label>
//             <Input name="email" placeholder="you@example.com" required />
//             <SubmitButton formAction={forgotPasswordAction}>
//               Reset Password
//             </SubmitButton>
//             {message && (
//               <FormMessage message={{ message }} />
//             )}
//           </div>
//         </form>
//         <SmtpMessage />
//       </div>
//     </div>
//   )
// }
