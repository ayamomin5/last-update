"use client";

import { Button } from "@/components/ui/button";
import Navigation from "@/components/Navigation";
import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { ArrowLeft, Building2, GraduationCap } from "lucide-react";
import { login } from "@/lib/api";

export default function LoginPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [role, setRole] = useState<'student' | 'company' | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  // Set the role from URL parameter when component mounts
  useEffect(() => {
    const roleParam = searchParams?.get('role') as 'student' | 'company' | null;
    if (roleParam) {
      setRole(roleParam);
    }
  }, [searchParams]);

  const handleLogin = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsLoading(true);
    const form = e.currentTarget;
    const email = (form.elements.namedItem('email') as HTMLInputElement).value;
    const password = (form.elements.namedItem('password') as HTMLInputElement).value;

    try {
      const data = await login({ email, password, role: role! });
      localStorage.setItem('token', data.token);
      localStorage.setItem('user', JSON.stringify(data.user));
      if (role === 'student') {
        router.push('/dashboard/student');
      } else if (role === 'company') {
        router.push('/dashboard/company');
      }
    } catch (error: any) {
      alert(error.message || "Login failed. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-white dark:bg-black">
      <Navigation />
      
      <main className="container mx-auto px-4 py-16">
        <div className="max-w-md mx-auto">
          <Link 
            href="/" 
            className="inline-flex items-center text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200 mb-8 transition-colors"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Home
          </Link>

          {!role ? (
            // Role Selection
            <div className="bg-white dark:bg-gray-800 rounded-2xl p-8 border border-gray-200 dark:border-gray-700 shadow-sm">
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">Welcome Back</h1>
              <p className="text-gray-600 dark:text-gray-400 mb-8">
                Please select your role to continue
              </p>

              <div className="space-y-4">
                <button
                  onClick={() => setRole('student')}
                  className="w-full p-4 rounded-xl border border-gray-200 dark:border-gray-700 hover:border-blue-500 dark:hover:border-blue-400 bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-750 transition-all group"
                >
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center group-hover:bg-blue-200 dark:group-hover:bg-blue-900/50 transition-colors">
                      <GraduationCap className="w-6 h-6 text-blue-600 dark:text-blue-400" />
                    </div>
                    <div className="text-left">
                      <h3 className="font-semibold text-gray-900 dark:text-white">Student</h3>
                      <p className="text-sm text-gray-600 dark:text-gray-400">Looking for internships</p>
                    </div>
                  </div>
                </button>

                <button
                  onClick={() => setRole('company')}
                  className="w-full p-4 rounded-xl border border-gray-200 dark:border-gray-700 hover:border-purple-500 dark:hover:border-purple-400 bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-750 transition-all group"
                >
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-full bg-purple-100 dark:bg-purple-900/30 flex items-center justify-center group-hover:bg-purple-200 dark:group-hover:bg-purple-900/50 transition-colors">
                      <Building2 className="w-6 h-6 text-purple-600 dark:text-purple-400" />
                    </div>
                    <div className="text-left">
                      <h3 className="font-semibold text-gray-900 dark:text-white">Company</h3>
                      <p className="text-sm text-gray-600 dark:text-gray-400">Hiring interns</p>
                    </div>
                  </div>
                </button>
              </div>
            </div>
          ) : (
            // Login Form
            <div className="bg-white dark:bg-gray-800 rounded-2xl p-8 border border-gray-200 dark:border-gray-700 shadow-sm">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                    {role === 'student' ? 'Student Login' : 'Company Login'}
                  </h1>
                  <p className="text-gray-600 dark:text-gray-400 mt-1">
                    Sign in to your {role} account
                  </p>
                </div>
                <button 
                  onClick={() => setRole(null)}
                  className="p-2 text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 transition-colors"
                >
                  <ArrowLeft className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleLogin} className="space-y-6">
                <div>
                  <label htmlFor="email" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Email Address
                  </label>
                  <input
                    type="email"
                    id="email"
                    name="email"
                    placeholder={role === 'student' ? "student@university.edu" : "company@example.com"}
                    className="w-full px-4 py-2 rounded-lg bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 text-gray-900 dark:text-gray-100 placeholder:text-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500/10 transition-all"
                    required
                  />
                </div>

                <div>
                  <label htmlFor="password" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Password
                  </label>
                  <input
                    type="password"
                    id="password"
                    name="password"
                    placeholder="••••••••"
                    className="w-full px-4 py-2 rounded-lg bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 text-gray-900 dark:text-gray-100 placeholder:text-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500/10 transition-all"
                    required
                  />
                </div>

                <div className="flex items-center justify-between">
                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      className="w-4 h-4 rounded border-gray-300 text-blue-500 focus:ring-blue-500/20 dark:border-gray-600 dark:bg-gray-800"
                    />
                    <span className="ml-2 text-sm text-gray-600 dark:text-gray-400">Remember me</span>
                  </label>
                  <Link
                    href={`/login/forgot-password?role=${role}`}
                    className="text-sm text-blue-600 dark:text-blue-400 hover:text-blue-500 dark:hover:text-blue-300"
                  >
                    Forgot password?
                  </Link>
                </div>

                <button
                  type="submit"
                  disabled={isLoading}
                  className="w-full px-8 py-3 rounded-full font-medium bg-gradient-to-r from-blue-500 to-purple-500 dark:from-blue-300 dark:to-purple-400 text-white dark:text-gray-900 hover:from-blue-400 hover:to-purple-400 dark:hover:from-blue-200 dark:hover:to-purple-300 transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-purple-400/20 disabled:opacity-50"
                >
                  {isLoading ? "Signing in..." : "Sign In"}
                </button>
              </form>

              <div className="mt-8 text-center">
                <p className="text-gray-600 dark:text-gray-400">
                  Don't have an account?{" "}
                  <Link
                    href={`/signup?role=${role}`}
                    className="text-blue-600 dark:text-blue-400 hover:text-blue-500 dark:hover:text-blue-300 font-medium"
                  >
                    Sign up
                  </Link>
                </p>
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
} 