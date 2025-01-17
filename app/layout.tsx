import { Geist } from "next/font/google";
import "./globals.css";
import { NextSSRPlugin } from "@uploadthing/react/next-ssr-plugin";
import { extractRouterConfig } from "uploadthing/server";
import { ourFileRouter } from "./api/uploadthing/core";
import { ThemeProvider } from "@/components/theme-provider"

const defaultUrl = process.env.VERCEL_URL
  ? `https://${process.env.VERCEL_URL}`
  : "http://localhost:3000";

export const metadata = {
  metadataBase: new URL(defaultUrl),
  title: "ChattyG, no-frills workplace chat",
  description: "A simple, efficient workplace chat platform with AI assistance",
};

const geistSans = Geist({
  display: "swap",
  subsets: ["latin"],
});

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" className={`h-full ${geistSans.className}`} suppressHydrationWarning>
      <head />
      <body className="h-full w-full">
        <ThemeProvider
          attribute="class"
          defaultTheme="dark"
          enableSystem={true}
        >
          <NextSSRPlugin 
            routerConfig={extractRouterConfig(ourFileRouter)}
          />
          {children}
        </ThemeProvider>
      </body>
    </html>
  )
}
