"use client";

import { UploadButton } from "@/utils/uploadthing";
import { Paperclip } from "lucide-react";

interface FileUploadProps {
  onUploadComplete: (url: string, type: string, name: string, size: number) => void;
  onUploadError: (error: Error) => void;
}

export function FileUpload({ onUploadComplete, onUploadError }: FileUploadProps) {
  return (
    <UploadButton
      endpoint="messageAttachment"
      onClientUploadComplete={(res) => {
        if (res?.[0]) {
          const { url, name, type, size } = res[0];
          console.log("Upload complete:", { url, name, type, size });
          onUploadComplete(url, type, name, size);
        }
      }}
      onUploadError={onUploadError}
      appearance={{
        button: "p-2 rounded-full hover:bg-gray-700/50 transition-colors",
        allowedContent: "hidden"
      }}
    >
      <Paperclip className="h-5 w-5" />
    </UploadButton>
  );
} 