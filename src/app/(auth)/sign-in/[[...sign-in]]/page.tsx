import { SignIn } from "@clerk/nextjs";
import Image from "next/image";

export default function SignInPage() {
  return (
    <div className="min-h-screen flex">
      {/* Left side - Sign in form */}
      <div className="flex-1 flex flex-col justify-center px-8 lg:px-16 bg-white">
        {/* Logo */}
        <div className="absolute top-8 left-8">
          <Image
            src="/logo.png"
            alt="Todo Logo"
            width={120}
            height={48}
            className="w-auto h-12"
            priority
          />
        </div>

        <div className="max-w-md w-full mx-auto">
          <SignIn
            appearance={{
              elements: {
                formButtonPrimary:
                  "bg-gray-900 hover:bg-gray-800 text-sm normal-case rounded-lg py-3",
                card: "shadow-none p-0",
                headerTitle: "hidden",
                headerSubtitle: "hidden",
                socialButtonsBlockButton:
                  "border border-gray-300 hover:bg-gray-50 text-gray-700 rounded-lg py-3 mb-4",
                socialButtonsBlockButtonText: "font-medium text-sm",
                formFieldInput:
                  "border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-900 focus:border-gray-900 py-3",
                footerActionLink: "text-red-500 hover:text-red-600 font-medium",
                dividerLine: "bg-gray-200",
                dividerText: "text-gray-500 text-sm",
                formFieldLabel: "text-gray-700 font-medium mb-2",
                identityPreviewText: "text-gray-600",
                formResendCodeLink: "text-gray-900 hover:text-gray-700",
              },
              layout: {
                socialButtonsPlacement: "top",
                socialButtonsVariant: "blockButton",
              },
            }}
            signUpUrl="/sign-up"
            redirectUrl="/dashboard"
          />

          <div className="mt-6 text-center">
            <p className="text-sm text-gray-600">
              Already have an account?{" "}
              <a
                href="/sign-up"
                className="font-medium text-red-500 hover:text-red-600"
              >
                Login
              </a>
            </p>
          </div>
        </div>
      </div>

      {/* Right side - Banner image */}
      <div className="hidden lg:flex flex-1 relative">
        <Image
          src="/auth/banner.png"
          alt="Authentication Banner"
          fill
          className="object-cover"
          priority
        />
      </div>
    </div>
  );
}
