'use client';

import { useEffect } from 'react';
import { useAuth } from '@clerk/nextjs';
import { useRouter } from 'next/navigation';
import { SignedOut } from "@clerk/nextjs";

export default function Home() {
  const { isSignedIn, isLoaded } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (isLoaded && isSignedIn) {
      router.push('/dashboard');
    }
  }, [isSignedIn, isLoaded, router]);

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <SignedOut>
        <div className="text-center">
          <div className="mb-8">
            <h1 className="text-4xl font-bold text-gray-900 mb-4">
              📝 TodoApp
            </h1>
            <h2 className="text-2xl font-semibold text-gray-700 mb-6">
              Organize your tasks with ease
            </h2>
            <p className="text-lg text-gray-600 mb-8 max-w-2xl mx-auto">
              Create lists, manage todos, track progress, and stay organized with our intuitive task management application.
            </p>
          </div>
          
          <div className="grid md:grid-cols-3 gap-8 mb-12">
            <div className="bg-white rounded-lg shadow-md p-6">
              <div className="text-blue-500 text-3xl mb-4">📋</div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Organize with Lists</h3>
              <p className="text-gray-600">Create different lists to categorize your tasks and keep everything organized.</p>
            </div>
            
            <div className="bg-white rounded-lg shadow-md p-6">
              <div className="text-green-500 text-3xl mb-4">✅</div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Track Progress</h3>
              <p className="text-gray-600">Mark tasks as complete, set priorities, and monitor your progress.</p>
            </div>
            
            <div className="bg-white rounded-lg shadow-md p-6">
              <div className="text-purple-500 text-3xl mb-4">🎯</div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Stay Focused</h3>
              <p className="text-gray-600">Set priorities and status to focus on what matters most.</p>
            </div>
          </div>
          
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-8">
            <h3 className="text-xl font-semibold text-blue-900 mb-4">
              Ready to get organized?
            </h3>
            <p className="text-blue-700 mb-6">
              Sign in to start creating your first todo list and take control of your tasks.
            </p>
            <p className="text-sm text-blue-600">
              Click the &ldquo;Sign In&rdquo; button in the header to get started!
            </p>
          </div>
        </div>
      </SignedOut>
    </div>
  );
}