"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import Navigation from "@/components/Navigation";
import { ArrowLeft } from "lucide-react";
import { getApplicationById, updateApplicationStatus } from "@/lib/api";
import React from "react";

interface PageParams {
  id: string;
}

export default function ReviewApplicationPage({ params }: { params: Promise<PageParams> }) {
  const router = useRouter();
  const unwrappedParams = React.use(params);
  const [reviewNotes, setReviewNotes] = useState("");
  const [decision, setDecision] = useState<"accept" | "reject" | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [application, setApplication] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    const fetchApplication = async () => {
      setLoading(true);
      setError(null);
      try {
        const token = localStorage.getItem('token');
        if (!token) throw new Error('No token');
        const app = await getApplicationById(unwrappedParams.id, token);
        setApplication(app);
      } catch (err: any) {
        setError(err.message || 'Failed to fetch application');
      } finally {
        setLoading(false);
      }
    };
    fetchApplication();
  }, [unwrappedParams.id]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!decision) return;
    setIsSubmitting(true);
    setError(null);
    try {
      const token = localStorage.getItem('token');
      if (!token) throw new Error('No token');
      await updateApplicationStatus(unwrappedParams.id, decision === 'accept' ? 'accepted' : 'rejected', token);
      setSuccess(true);
      setTimeout(() => {
        router.replace("/dashboard/company");
      }, 1500);
    } catch (err: any) {
      setError(err.message || 'Failed to update application');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <Navigation />
      
      <div className="container mx-auto px-4 py-8">
        <Button
          variant="outline"
          onClick={() => router.back()}
          className="mb-6 flex items-center gap-2"
        >
          <ArrowLeft className="w-4 h-4" /> Back
        </Button>

        <div className="max-w-3xl mx-auto">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6 mb-6">
            <h1 className="text-2xl font-bold mb-4 text-gray-900 dark:text-white">
              Review Application
            </h1>
            
            {loading ? (
              <div className="animate-pulse space-y-4">
                <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded w-1/2 mb-2"></div>
                <div className="h-5 bg-gray-200 dark:bg-gray-700 rounded w-1/3 mb-2"></div>
                <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-2/3 mb-2"></div>
              </div>
            ) : error ? (
              <div className="text-red-500 mb-4">{error}</div>
            ) : success ? (
              <div className="text-green-600 font-semibold text-center">Application {decision === 'accept' ? 'accepted' : 'rejected'} successfully!</div>
            ) : application ? (
              <form onSubmit={handleSubmit} className="space-y-6">
                <div>
                  <h2 className="text-lg font-semibold mb-2 text-gray-900 dark:text-white">Application Details</h2>
                  <div className="grid grid-cols-2 gap-4 text-gray-600 dark:text-gray-400">
                    <div>
                      <p className="font-medium">Candidate Name</p>
                      <p>{application.student?.name || 'Unknown Student'}</p>
                    </div>
                    <div>
                      <p className="font-medium">Position</p>
                      <p>{application.opportunity?.title || ''}</p>
                    </div>
                    <div>
                      <p className="font-medium">Email</p>
                      <p>{application.student?.email || ''}</p>
                    </div>
                    <div>
                      <p className="font-medium">Location</p>
                      <p>{application.student?.location || ''}</p>
                    </div>
                    <div>
                      <p className="font-medium">Application Date</p>
                      <p>{new Date(application.createdAt).toLocaleDateString()}</p>
                    </div>
                  </div>
                </div>

                <div>
                  <h2 className="text-lg font-semibold mb-2 text-gray-900 dark:text-white">Cover Letter</h2>
                  <p className="text-gray-600 dark:text-gray-400 whitespace-pre-wrap">
                    {application.coverLetter}
                  </p>
                </div>

                {application.resume && (
                  <div>
                    <h2 className="text-lg font-semibold mb-2 text-gray-900 dark:text-white">Resume</h2>
                    {(() => {
                      const backendUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';
                      const resumeUrl = application.resume.startsWith('/uploads/')
                        ? backendUrl.replace(/\/api$/, '') + application.resume
                        : application.resume;
                      return (
                        <a href={resumeUrl} target="_blank" rel="noopener noreferrer" className="text-blue-600 underline">View Resume</a>
                      );
                    })()}
                  </div>
                )}

                <div>
                  <h2 className="text-lg font-semibold mb-2 text-gray-900 dark:text-white">Review Notes</h2>
                  <Textarea
                    value={reviewNotes}
                    onChange={(e) => setReviewNotes(e.target.value)}
                    placeholder="Enter your review notes here..."
                    className="min-h-[150px]"
                  />
                </div>

                <div className="flex gap-4">
                  <Button
                    type="button"
                    onClick={() => setDecision("accept")}
                    className={`flex-1 ${
                      decision === "accept"
                        ? "bg-green-500 hover:bg-green-600 text-white"
                        : "bg-gray-200 dark:bg-gray-700 text-gray-900 dark:text-white"
                    }`}
                    disabled={isSubmitting}
                  >
                    Accept Application
                  </Button>
                  <Button
                    type="button"
                    onClick={() => setDecision("reject")}
                    className={`flex-1 ${
                      decision === "reject"
                        ? "bg-red-500 hover:bg-red-600 text-white"
                        : "bg-gray-200 dark:bg-gray-700 text-gray-900 dark:text-white"
                    }`}
                    disabled={isSubmitting}
                  >
                    Reject Application
                  </Button>
                </div>

                <Button
                  type="submit"
                  className="w-full bg-gradient-to-r from-blue-500 to-purple-500 text-white hover:from-blue-400 hover:to-purple-400"
                  disabled={!decision || isSubmitting}
                >
                  {isSubmitting ? "Submitting..." : "Submit Review"}
                </Button>
              </form>
            ) : null}
          </div>
        </div>
      </div>
    </div>
  );
} 