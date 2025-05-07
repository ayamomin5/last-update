"use client";

import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import Navigation from "@/components/Navigation";
import { toast } from "react-hot-toast";

export default function ForgotPasswordPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [role, setRole] = useState<'student' | 'company' | null>(null);
  const [email, setEmail] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Set the role from URL parameter when component mounts
  useEffect(() => {
    const roleParam = searchParams?.get('role') as 'student' | 'company' | null;
    if (roleParam) {
      setRole(roleParam);
    }
  }, [searchParams]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      // Here you would typically make an API call to send reset password email
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      toast.success("Password reset link has been sent to your email!");
      setSuccessMessage("Password reset link has been sent to your email!");
      // Add a delay before redirecting to ensure the toast is visible
      setTimeout(() => {
        router.push(`/login?role=${role}`);
      }, 2000);
    } catch (error) {
      toast.error("Failed to send reset link. Please try again.");
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
            href={`/login?role=${role}`}
            className="inline-flex items-center text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200 mb-8 transition-colors"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Login
          </Link>

          <div className="bg-white dark:bg-gray-800 rounded-2xl p-8 border border-gray-200 dark:border-gray-700 shadow-sm">
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">
              Reset Your Password
            </h1>
            <p className="text-gray-600 dark:text-gray-400 mb-8">
              Enter your email address and we'll send you a link to reset your password.
            </p>

            {successMessage && (
              <div className="mb-4 p-4 bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 rounded-lg">
                {successMessage}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-6">
              <div>
                <label htmlFor="email" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Email Address
                </label>
                <input
                  type="email"
                  id="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder={role === 'student' ? "student@university.edu" : "company@example.com"}
                  className="w-full px-4 py-2 rounded-lg bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 text-gray-900 dark:text-gray-100 placeholder:text-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500/10 transition-all"
                  required
                />
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="w-full px-8 py-3 rounded-full font-medium bg-gradient-to-r from-blue-500 to-purple-500 dark:from-blue-300 dark:to-purple-400 text-white dark:text-gray-900 hover:from-blue-400 hover:to-purple-400 dark:hover:from-blue-200 dark:hover:to-purple-300 transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-purple-400/20 disabled:opacity-50"
              >
                {isLoading ? "Sending..." : "Send Reset Link"}
              </button>
            </form>
          </div>
        </div>
      </main>
    </div>
  );
} 