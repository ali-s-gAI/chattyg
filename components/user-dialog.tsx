"use client";

import { useRouter } from "next/navigation";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";

interface UserDialogProps {
  user: {
    id: string;
    display_name: string | null;
    avatar_url: string | null;
  } | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function UserDialog({ user, open, onOpenChange }: UserDialogProps) {
  const router = useRouter();

  const handleDM = (userId: string) => {
    onOpenChange(false);
    router.push(`/chat/dm/${userId}`);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="bg-[#2F3136] text-white border border-gray-700">
        <DialogHeader>
          <DialogTitle className="text-lg font-semibold">
            {user?.display_name || "User Info"}
          </DialogTitle>
          <div className="flex flex-col items-center mt-4">
            <Avatar className="h-16 w-16 mb-4">
              <AvatarImage src={user?.avatar_url || ""} />
              <AvatarFallback className="bg-gray-700">
                {user?.display_name?.[0]?.toUpperCase() || "?"}
              </AvatarFallback>
            </Avatar>
          </div>
        </DialogHeader>
        <div className="mt-4 flex justify-center">
          <button
            onClick={() => user && handleDM(user.id)}
            className="px-4 py-2 bg-blue-500 hover:bg-blue-600 rounded transition-colors"
          >
            Send Message
          </button>
        </div>
      </DialogContent>
    </Dialog>
  );
} 