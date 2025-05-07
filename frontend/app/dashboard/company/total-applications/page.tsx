"use client";

import { Button } from "@/components/ui/button";
import Navigation from "@/components/Navigation";
import { ArrowLeft, GraduationCap, BookOpen, Calendar } from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { useEffect, useState } from "react";
import { getCompanyApplications } from "@/lib/api";

export default function TotalApplicationsPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const statusFilter = searchParams ? searchParams.get('status') : null;
  const [applications, setApplications] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchAndMarkApplications = async () => {
      setLoading(true);
      try {
        const token = localStorage.getItem('token');
        if (!token) throw new Error('No token');
        let apps = await getCompanyApplications(token);
        const newApps = apps.filter((app: any) => app.status === 'pending' || app.status === 'new');
        await Promise.all(newApps.map((app: any) =>
          fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api'}/applications/${app._id || app.id}/status`, {
            method: 'PUT',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({ status: 'under_review' })
          })
        ));
        apps = await getCompanyApplications(token);
        
        // Apply status filter if provided
        if (statusFilter) {
          apps = apps.filter((app: any) => app.status === statusFilter);
        }
        
        setApplications(apps);
      } catch (err) {
        setApplications([]);
      } finally {
        setLoading(false);
      }
    };
    fetchAndMarkApplications();
  }, [statusFilter]);

  const sortedApplications = [...applications].sort((a, b) => {
    const isNewA = a.status === 'pending' || a.status === 'new';
    const isNewB = b.status === 'pending' || b.status === 'new';
    if (isNewA === isNewB) {
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    }
    return isNewA ? -1 : 1;
  });

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <Navigation />
      
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center gap-4 mb-6">
            <Button
              variant="outline"
              size="icon"
              onClick={() => router.back()}
              className="bg-white dark:bg-gray-800"
            >
              <ArrowLeft className="h-4 w-4" />
            </Button>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
              {statusFilter === 'accepted' ? 'Accepted Applications' : 
               statusFilter === 'rejected' ? 'Rejected Applications' : 
               'All Applications'}
            </h1>
          </div>

          <div className="grid gap-6">
            {loading ? (
              <div className="text-center text-gray-600 dark:text-gray-400">Loading applications...</div>
            ) : applications.length === 0 ? (
              <div className="text-center text-gray-600 dark:text-gray-400">No applications found.</div>
            ) : (
              sortedApplications.map((application) => {
                const appId = application._id || application.id;
                if (!appId) return null;
                return (
                  <div key={appId} className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6 transition-transform transform hover:scale-105 hover:shadow-xl">
                    <div className="flex justify-between items-start mb-4">
                      <div>
                        <h2 className="font-semibold text-[#9d4edd] dark:text-white text-xl">{application.student?.name || 'Unknown Student'}</h2>
                        <p className="text-gray-600 dark:text-gray-400">{application.opportunity?.title || 'Unknown Position'}</p>
                      </div>
                      <span className={`px-3 py-1 rounded-full text-sm ${
                        application.status === "new" ? "bg-blue-100 text-blue-800" :
                        application.status === "under_review" ? "bg-yellow-100 text-yellow-800" :
                        application.status === "interview_scheduled" || application.status === "interview" ? "bg-green-100 text-green-800" :
                        application.status === "accepted" ? "bg-green-200 text-green-900" :
                        application.status === "rejected" ? "bg-red-100 text-red-800" :
                        "bg-gray-100 text-gray-800"
                      }`}>
                        {application.status?.replace(/_/g, ' ').replace(/\b\w/g, (c: string) => c.toUpperCase()) || 'Status'}
                      </span>
                    </div>

                    <div className="space-y-3 mb-4">
                      {Array.isArray(application.student?.education) && application.student.education.length > 0 ? (
                        application.student.education.map((ed: any, idx: number) => (
                          <div key={idx} className="flex gap-2 text-sm text-gray-600 dark:text-gray-400">
                            <GraduationCap className="w-4 h-4" />
                            <span>{ed.school || ed.institution || 'Unknown School'}</span>
                            <BookOpen className="w-4 h-4 ml-4" />
                            <span>{ed.major || ed.degree || 'Unknown Major'}</span>
                          </div>
                        ))
                      ) : (
                        <div className="flex gap-2 text-sm text-gray-600 dark:text-gray-400">
                          <GraduationCap className="w-4 h-4" />
                          <span>No education info</span>
                        </div>
                      )}
                      <div className="flex gap-2 text-sm text-gray-600 dark:text-gray-400">
                        <Calendar className="w-4 h-4" />
                        <span>Applied {application.createdAt ? new Date(application.createdAt).toLocaleDateString() : 'N/A'}</span>
                      </div>
                    </div>

                    <div className="flex gap-4">
                      <Link href={`/dashboard/company/review-application/${appId}`}>
                        <Button 
                          className="bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-gray-200 hover:bg-gray-300 dark:hover:bg-gray-600"
                        >
                          Review Application
                        </Button>
                      </Link>
                      {(application.status === "accepted" || application.status === "under_review") && (
                        <Link href={`/dashboard/company/schedule-interviews?applicationId=${appId}`}>
                          <Button 
                            variant="outline" 
                            className="bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-gray-200 hover:bg-gray-300 dark:hover:bg-gray-600"
                          >
                            {application.status === "accepted" ? "Interview Completed" : "Schedule Interview"}
                          </Button>
                        </Link>
                      )}
                      {(application.status === "interview" || application.status === "interview_scheduled") && (
                        <Link href={`/dashboard/company/schedule-interviews?applicationId=${appId}`}>
                          <Button 
                            variant="outline" 
                            className="bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-gray-200 hover:bg-gray-300 dark:hover:bg-gray-600"
                          >
                            Reschedule
                          </Button>
                        </Link>
                      )}
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>
    </div>
  );
} 