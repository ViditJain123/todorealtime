import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import {
  ClerkProvider,
  SignInButton,
  SignedIn,
  SignedOut,
  UserButton
} from "@clerk/nextjs";
import "./globals.css";
import Link from "next/link";
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
          className={`${geistSans.variable} ${geistMono.variable} antialiased bg-gray-50 min-h-screen`}
        >
          <SocketProvider>
            <nav className="bg-white shadow-sm border-b">
              <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex justify-between items-center h-16">
                  <div className="flex items-center">
                    <Link href="/dashboard" className="text-xl font-bold text-gray-900">
                      📝 TodoApp
                    </Link>
                  </div>
                  <div className="flex items-center space-x-4">
                    <SignedOut>
                      <SignInButton>
                        <button className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-medium transition-colors">
                          Sign In
                        </button>
                      </SignInButton>
                    </SignedOut>
                    <SignedIn>
                      <UserButton afterSignOutUrl="/" />
                    </SignedIn>
                  </div>
                </div>
              </div>
            </nav>
            <main>{children}</main>
          </SocketProvider>
        </body>
      </html>
    </ClerkProvider>
  );
}
