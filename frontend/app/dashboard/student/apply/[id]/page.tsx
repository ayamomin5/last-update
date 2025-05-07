"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import Navigation from "@/components/Navigation";
import { ArrowLeft, Upload, CheckCircle2 } from "lucide-react";
import { getOpportunity } from "@/lib/api";

export default function ApplyPage() {
  // Use the useParams hook instead
  const params = useParams();
  const opportunityId = params?.id as string;
  
  const router = useRouter();
  const [coverLetter, setCoverLetter] = useState("");
  const [resume, setResume] = useState<File | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [job, setJob] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchOpportunity = async () => {
      setLoading(true);
      try {
        const token = localStorage.getItem('token');
        if (!token) throw new Error('No token');
        const opp = await getOpportunity(opportunityId, token);
        setJob({
          id: opp._id,
          company: typeof opp.company === 'string' ? opp.company : (opp.company && (opp.company as any).name ? (opp.company as any).name : ''),
          position: opp.title,
          location: opp.location,
          description: opp.description,
          requirements: opp.requirements || [],
        });
      } catch (err) {
        setJob(null);
      } finally {
        setLoading(false);
      }
    };
    fetchOpportunity();
  }, [opportunityId]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);

    try {
      const token = localStorage.getItem('token');
      if (!token) throw new Error('No token');
      const formData = new FormData();
      formData.append('coverLetter', coverLetter);
      if (resume) formData.append('resume', resume);
      const apiUrl = `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api'}/applications/apply/${opportunityId}`;
      const response: Response = await fetch(apiUrl, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        },
        body: formData
      });
      if (!response.ok) {
        const err = await response.json();
        throw new Error(err.msg || 'Failed to submit application');
      }
      setIsSubmitting(false);
      setSuccess(true);
      setTimeout(() => {
        router.push("/my-applications");
      }, 2000);
    } catch (err: any) {
      setError((err as any).message || 'Failed to submit application');
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
          className="mb-6 flex items-center gap-2 border border-[#5e60ce] bg-white dark:bg-gray-800 text-gray-900 dark:text-white hover:bg-gray-200 dark:hover:bg-gray-700 transition-all duration-300 rounded-lg"
        >
          <ArrowLeft className="w-4 h-4" /> Back
        </Button>

        <div className="max-w-3xl mx-auto">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6 mb-6">
            {loading ? (
              <div className="animate-pulse">
                <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded w-1/2 mb-4"></div>
                <div className="h-5 bg-gray-200 dark:bg-gray-700 rounded w-1/3 mb-2"></div>
                <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-2/3 mb-6"></div>
                <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded w-1/4 mb-4"></div>
                <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-full mb-2"></div>
                <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-3/4 mb-2"></div>
              </div>
            ) : job ? (
              <>
                <h1 className="text-3xl font-bold mb-4 text-[#6930c3] dark:text-[#b185db]">
                  {job.position}
                </h1>
                <p className="text-lg text-gray-600 dark:text-gray-400 mb-2">
                  {job.company} • {job.location}
                </p>
                <p className="text-gray-600 dark:text-gray-400 mb-6">
                  {job.description}
                </p>
                
                <h2 className="text-xl font-semibold mb-4 text-[#6930c3] dark:text-[#b185db]">
                  Requirements
                </h2>
                <ul className="list-disc list-inside space-y-2 text-gray-600 dark:text-gray-400 mb-6">
                  {job.requirements && job.requirements.length > 0 ? job.requirements.map((req: string, index: number) => (
                    <li key={index}>{req}</li>
                  )) : <li>No requirements listed.</li>}
                </ul>
              </>
            ) : (
              <div className="text-red-500">Opportunity not found.</div>
            )}
          </div>

          {!success ? (
            <form onSubmit={handleSubmit} className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6">
              {error && <div className="mb-4 text-red-500">{error}</div>}
              <h2 className="text-2xl font-bold mb-6 text-[#6930c3] dark:text-[#b185db]">
                Submit Your Application
              </h2>

              <div className="space-y-6">
                <div>
                  <label className="block text-sm font-medium mb-2 text-gray-700 dark:text-gray-300">
                    Cover Letter
                  </label>
                  <Textarea
                    value={coverLetter}
                    onChange={(e) => setCoverLetter(e.target.value)}
                    placeholder="Tell us why you're the perfect candidate for this position..."
                    className="min-h-[200px]"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2 text-gray-700 dark:text-gray-300">
                    Resume
                  </label>
                  <div className="flex items-center gap-4">
                    <input
                      type="file"
                      accept=".pdf,.doc,.docx"
                      onChange={(e) => setResume(e.target.files?.[0] || null)}
                      className="hidden"
                      id="resume-upload"
                      required
                    />
                    <label
                      htmlFor="resume-upload"
                      className="flex items-center gap-2 px-4 py-2 border border-[#5e60ce] rounded-lg cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors duration-300"
                    >
                      <Upload className="w-4 h-4" />
                      <span className="text-sm">
                        {resume ? resume.name : "Upload Resume"}
                      </span>
                    </label>
                    {resume && (
                      <span className="text-sm text-green-600 dark:text-green-400 flex items-center gap-1">
                        <CheckCircle2 className="w-4 h-4" />
                        File selected
                      </span>
                    )}
                  </div>
                </div>

                <Button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full bg-gradient-to-r from-blue-500 to-purple-500 text-white hover:from-blue-600 hover:to-purple-600 transition-all duration-300"
                >
                  {isSubmitting ? "Submitting..." : "Submit Application"}
                </Button>
              </div>
            </form>
          ) : (
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6 text-center">
              <div className="flex flex-col items-center gap-4">
                <CheckCircle2 className="w-16 h-16 text-green-500" />
                <h2 className="text-2xl font-bold text-[#6930c3] dark:text-[#b185db]">
                  Application Submitted!
                </h2>
                <p className="text-gray-600 dark:text-gray-400">
                  Your application has been successfully submitted. Redirecting to your applications...
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
} 