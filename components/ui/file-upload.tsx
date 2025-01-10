"use client";

import { UploadButton } from "@/utils/uploadthing";
import { Paperclip } from "lucide-react";

interface FileUploadProps {
  onUploadComplete: (url: string, fileType: string, fileName: string) => void;
  onUploadError: (error: Error) => void;
}

export function FileUpload({ onUploadComplete, onUploadError }: FileUploadProps) {
  return (
    <UploadButton
      endpoint="messageAttachment"
      onClientUploadComplete={(res) => {
        if (res?.[0]) {
          const { url, name, type } = res[0];
          onUploadComplete(url, type, name);
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