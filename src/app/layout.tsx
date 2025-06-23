import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import {
  ClerkProvider
} from "@clerk/nextjs";
import "./globals.css";
import { SocketProvider } from "@/hooks/useSocket";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Realtime Todo App",
  description: "A realtime todo application with Clerk authentication",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <ClerkProvider>
      <html lang="en">
        <body
          className={`${geistSans.variable} ${geistMono.variable} antialiased bg-white min-h-screen`}
        >
          <SocketProvider>
            <main>{children}</main>
          </SocketProvider>
        </body>
      </html>
    </ClerkProvider>
  );
}
