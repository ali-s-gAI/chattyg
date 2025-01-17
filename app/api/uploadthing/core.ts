import { createUploadthing, type FileRouter } from "uploadthing/next";
import { UploadThingError } from "uploadthing/server";

const f = createUploadthing();

// Simple auth function
const auth = async (req: Request) => {
  // For testing, simulate a successful auth
  return { id: "test-user" };
};

export const ourFileRouter = {
  messageAttachment: f({
    image: { maxFileSize: "4MB", maxFileCount: 1 },
    pdf: { maxFileSize: "8MB", maxFileCount: 1 },
    text: { maxFileSize: "1MB", maxFileCount: 1 }
  })
    .middleware(async ({ req }) => {
      // This code runs on your server before upload
      const user = await auth(req);

      console.log("Middleware running with user:", user);

      if (!user) throw new UploadThingError("Unauthorized");

      return { userId: user.id };
    })
    .onUploadComplete(async ({ metadata, file }) => {
      console.log("Upload complete:", { metadata, file });
      return { uploadedBy: metadata.userId, url: file.url };
    }),

  // New endpoint for avatar uploads
  avatarUploader: f({
    image: { maxFileSize: "1MB", maxFileCount: 1 }
  })
    .middleware(async ({ req }) => {
      const user = await auth(req);
      if (!user) throw new UploadThingError("Unauthorized");
      return { userId: user.id };
    })
    .onUploadComplete(async ({ metadata, file }) => {
      console.log("Avatar upload complete:", { metadata, file });
      return { uploadedBy: metadata.userId, url: file.url };
    }),
} satisfies FileRouter;

export type OurFileRouter = typeof ourFileRouter; 