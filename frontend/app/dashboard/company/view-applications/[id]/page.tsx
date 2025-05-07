"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import Navigation from "@/components/Navigation";
import { ArrowLeft } from "lucide-react";
import { getCompanyApplications } from "@/lib/api";
import { use } from "react";

interface PageParams {
  id: string;
}

export default function ViewApplicationsPage({ params }: { params: Promise<PageParams> }) {
  const router = useRouter();
  const [applications, setApplications] = useState<any[]>([]);
  const [opportunityTitle, setOpportunityTitle] = useState<string>("");
  const [loading, setLoading] = useState(true);
  const unwrappedParams = use(params);

  useEffect(() => {
    const fetchApplications = async () => {
      setLoading(true);
      try {
        const token = localStorage.getItem('token');
        if (!token) throw new Error('No token');
        const allApps = await getCompanyApplications(token);
        // Filter applications for this opportunity
        const filtered = allApps.filter((app: any) => app.opportunity && app.opportunity._id === unwrappedParams.id);
        setApplications(filtered);
        if (filtered.length > 0) {
          setOpportunityTitle(filtered[0].opportunity.title);
        } else {
          setOpportunityTitle('');
        }
      } catch (err) {
        setApplications([]);
        setOpportunityTitle('');
      } finally {
        setLoading(false);
      }
    };
    fetchApplications();
  }, [unwrappedParams.id]);

  const handleReviewApplication = (applicationId: number) => {
    router.push(`/dashboard/company/review-application/${applicationId}`);
  };

  const handleScheduleInterview = (applicationId: number) => {
    router.push(`/dashboard/company/schedule-interviews?applicationId=${applicationId}`);
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

        <div className="max-w-4xl mx-auto">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6 mb-6">
            <h1 className="text-2xl font-bold mb-4 text-gray-900 dark:text-white">
              Applications for {opportunityTitle || 'this opportunity'}
            </h1>
            {loading ? (
              <div className="animate-pulse space-y-4">
                {[1,2,3].map(i => (
                  <div key={i} className="h-20 bg-gray-200 dark:bg-gray-700 rounded"></div>
                ))}
              </div>
            ) : applications.length === 0 ? (
              <div className="text-gray-500 dark:text-gray-300">No applications found for this opportunity.</div>
            ) : (
              <div className="space-y-4">
                {applications.map((app) => {
                  const backendUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';
                  const resumeUrl = app.resume?.startsWith('/uploads/')
                    ? backendUrl.replace(/\/api$/, '') + app.resume
                    : app.resume;
                  return (
                    <div key={app.id} className="border-b last:border-0 pb-6 last:pb-0">
                      <div className="flex justify-between items-start mb-4">
                        <div>
                          <h3 className="font-semibold text-gray-900 dark:text-white">
                            {app.student?.name || 'Unknown Student'}
                          </h3>
                          <p className="text-gray-600 dark:text-gray-400">
                            {app.student?.email}
                            {app.student?.title && ` • ${app.student.title}`}
                            {app.student?.location && ` • ${app.student.location}`}
                          </p>
                        </div>
                        <span className={`px-3 py-1 rounded-full text-sm ${
                          app.status === "pending" ? "bg-blue-100 text-blue-800" :
                          app.status === "reviewing" ? "bg-yellow-100 text-yellow-800" :
                          app.status === "interview" ? "bg-purple-100 text-purple-800" :
                          app.status === "accepted" ? "bg-green-100 text-green-800" :
                          app.status === "rejected" ? "bg-red-100 text-red-800" :
                          "bg-gray-100 text-gray-800"
                        }`}>
                          {app.status.charAt(0).toUpperCase() + app.status.slice(1)}
                        </span>
                      </div>
                      <div className="flex flex-col gap-2 text-sm text-gray-600 dark:text-gray-400 mb-2">
                        <span>📅 Applied {new Date(app.createdAt).toLocaleDateString()}</span>
                        {app.student?.skills && app.student.skills.length > 0 && (
                          <span>Skills: {app.student.skills.join(', ')}</span>
                        )}
                        {app.student?.education && app.student.education.length > 0 && (
                          <span>Education: {app.student.education.map((ed: any) => ed.school || ed.degree || '').join(', ')}</span>
                        )}
                        {app.student?.experience && app.student.experience.length > 0 && (
                          <span>Experience: {app.student.experience.map((ex: any) => ex.position || '').join(', ')}</span>
                        )}
                      </div>
                      <div className="flex flex-col gap-2 text-sm text-gray-600 dark:text-gray-400 mb-2">
                        {app.coverLetter && (
                          <div>
                            <span className="font-medium">Cover Letter:</span>
                            <div className="whitespace-pre-wrap">{app.coverLetter}</div>
                          </div>
                        )}
                        {app.resume && (
                          <a href={resumeUrl} target="_blank" rel="noopener noreferrer" className="text-blue-600 underline">View Resume</a>
                        )}
                      </div>
                      <div className="flex gap-4 mt-2">
                        <Button
                          onClick={() => handleReviewApplication(app.id)}
                          className="bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-gray-200 hover:bg-gray-300 dark:hover:bg-gray-600"
                        >
                          Review Application
                        </Button>
                        <Button
                          onClick={() => handleScheduleInterview(app.id)}
                          variant="outline"
                          className="bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-gray-200 hover:bg-gray-300 dark:hover:bg-gray-600"
                        >
                          Schedule Interview
                        </Button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
} 