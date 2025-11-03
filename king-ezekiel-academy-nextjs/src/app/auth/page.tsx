'use client'
import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { FcGoogle } from 'react-icons/fc';
import { FaApple } from 'react-icons/fa';
import { useAuth } from '@/contexts/AuthContextOptimized';
import { createClient } from '@/lib/supabase/client';

const AuthPage: React.FC = () => {
  const router = useRouter();
  const { user, authLoading } = useAuth();
  const [isRedirecting, setIsRedirecting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!authLoading && user && !isRedirecting) {
      setIsRedirecting(true);
      router.replace('/dashboard');
    }
  }, [user, authLoading, isRedirecting, router]);

  const signInWithProvider = async (provider: 'google' | 'apple') => {
    try {
      setError(null);
      const supabase = createClient();
      const siteUrl = process.env.NEXT_PUBLIC_SITE_URL;
      const { data, error } = await supabase.auth.signInWithOAuth({
        provider,
        options: {
          redirectTo: typeof window !== 'undefined'
            ? `${(siteUrl || window.location.origin).replace(/\/$/, '')}/dashboard`
            : undefined,
          queryParams: provider === 'apple' ? { scope: 'name email' } : undefined,
        },
      });
      if (error) {
        setError(error.message || 'Failed to start sign in');
      } else if (!data?.url) {
        setError('Failed to initiate provider redirect');
      }
    } catch (e: any) {
      setError(e?.message || 'Unexpected error');
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-50 flex items-center justify-center px-4">
      <div className="w-full max-w-md">
        <div className="bg-white/80 backdrop-blur rounded-2xl shadow-xl border border-gray-100 p-8">
          <div className="text-center">
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">
              Welcome to The King Ezekiel Academy 👋
            </h1>
            <p className="mt-2 text-sm text-gray-600">
              Continue with your favorite account to get started.
            </p>
          </div>

          {error && (
            <div className="mt-6 rounded-lg border border-red-200 bg-red-50 text-red-700 px-4 py-3 text-sm">
              {error}
            </div>
          )}

          <div className="mt-8 space-y-4">
            <button
              type="button"
              onClick={() => signInWithProvider('google')}
              className="w-full inline-flex items-center justify-center gap-3 rounded-lg border border-gray-200 bg-white px-4 py-3 text-sm font-medium text-gray-800 shadow-sm hover:shadow-md hover:bg-gray-50 transition-all"
              disabled={authLoading || isRedirecting}
            >
              <FcGoogle className="h-5 w-5" />
              <span>Continue with Google</span>
            </button>

            {/* Apple button temporarily disabled */}
            {/* <button
              type="button"
              onClick={() => signInWithProvider('apple')}
              className="w-full inline-flex items-center justify-center gap-3 rounded-lg border border-gray-900 bg-black px-4 py-3 text-sm font-medium text-white shadow-sm hover:shadow-md hover:bg-gray-900 transition-all"
              disabled={authLoading || isRedirecting}
            >
              <FaApple className="h-5 w-5" />
              <span>Continue with Apple</span>
            </button> */}
          </div>

          <p className="mt-8 text-center text-xs text-gray-500">
            By continuing, you agree to our{' '}
            <a href="/terms" className="underline hover:text-gray-700">Terms</a>
            {' '}and{' '}
            <a href="/privacy" className="underline hover:text-gray-700">Privacy Policy</a>.
          </p>
        </div>
      </div>
    </div>
  );
};

export default AuthPage;


