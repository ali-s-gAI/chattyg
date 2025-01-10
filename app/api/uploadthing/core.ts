import { createUploadthing, type FileRouter } from "uploadthing/next";
import { cookies } from "next/headers";
import { createClient } from "@/utils/supabase/server";

const f = createUploadthing();

export const ourFileRouter = {
  messageAttachment: f({
    image: { maxFileSize: "4MB" },
    pdf: { maxFileSize: "8MB" },
    text: { maxFileSize: "1MB" },
    "application/msword": { maxFileSize: "8MB" },
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document": { maxFileSize: "8MB" }
  })
    .middleware(async () => {
      const cookieStore = cookies();
      const supabase = createClient(cookieStore);
      const { data: { session } } = await supabase.auth.getSession();

      if (!session?.user) throw new Error("Unauthorized");

      return { userId: session.user.id };
    })
    .onUploadComplete(async ({ metadata, file }) => {
      return { uploadedBy: metadata.userId, url: file.url };
    }),
} satisfies FileRouter;

export type OurFileRouter = typeof ourFileRouter; 