import { DmMessageArea } from "@/components/dm-message-area";
import { createClient } from "@/utils/supabase/server";
import { redirect } from "next/navigation";

interface DMPageProps {
  params: {
    userId: string;
  };
}

export default async function DMPage({ params }: DMPageProps) {
  const { userId } = await params;
  
  // Verify authentication
  const supabase = await createClient();
  const { data: { session } } = await supabase.auth.getSession();

  if (!session) {
    redirect('/auth-pages/sign-in');
  }

  // Verify the target user exists
  const { data: targetUser } = await supabase
    .from('profiles')
    .select('id, display_name')
    .eq('id', userId)
    .single();

  if (!targetUser) {
    redirect('/chat'); // Redirect if user not found
  }

  return (
    <div className="flex-1 flex flex-col bg-[#36393E]">
      <div className="h-14 border-b border-gray-700 flex items-center px-4">
        <h2 className="text-xl font-semibold">
          {targetUser.display_name || 'Direct Message'}
        </h2>
      </div>
      <div className="flex-1 overflow-y-auto">
        <DmMessageArea targetUserId={userId} />
      </div>
    </div>
  );
} 